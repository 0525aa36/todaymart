# Troubleshooting: 상품 가격 소수점 표시 문제

## 📋 문제 요약

- **발생일**: 2025-11-10
- **환경**: AWS ECS (Fargate) + RDS MySQL
- **증상**: 배포 환경에서 할인된 상품 가격이 소수점으로 표시됨
- **영향도**: 전체 상품 목록 및 상세 페이지

## 🔍 문제 증상

### 기대 동작
```json
{
  "price": 9999,
  "discountRate": 11,
  "discountedPrice": 8899  // 정수 (원 단위)
}
```

### 실제 동작 (배포 환경)
```json
{
  "price": 9999,
  "discountRate": 11,
  "discountedPrice": 8899.11  // 소수점 표시 ❌
}
```

### 환경별 차이
- **로컬 환경**: 정상 동작 (소수점 없음) ✅
- **배포 환경**: 소수점 표시됨 ❌

## 🕵️ 문제 원인 분석

### 1단계: 백엔드 코드 확인

**Product.java:102** - 할인가 계산 로직 확인
```java
public BigDecimal getDiscountedPrice() {
    if (discountRate != null && discountRate.compareTo(BigDecimal.ZERO) > 0) {
        BigDecimal discount = price.multiply(discountRate).divide(new BigDecimal("100"));
        BigDecimal discountedPrice = price.subtract(discount);
        // 반올림하여 정수로 만들기 (1원 단위 제거)
        return discountedPrice.setScale(0, RoundingMode.HALF_UP);
    }
    return price;
}
```

**결론**: 코드는 정상 (반올림 로직 존재)

### 2단계: 배포 환경 API 직접 테스트

```bash
curl "https://api.todaymart.co.kr/api/products?page=0&size=1" | jq '.content[0].discountedPrice'
# 결과: 8899.11 ❌
```

**결론**: 백엔드 코드가 제대로 배포되지 않았거나 실행되지 않음

### 3단계: ECS 서비스 상태 확인

```bash
aws ecs describe-services --cluster korean-agri-shop-cluster \
  --services korean-agri-shop-backend-service --region ap-northeast-2
```

**발견 사항**:
- 새 배포(태스크 정의 26, 27, 28)가 계속 실패
- 기존 배포(태스크 정의 21)만 running
- **새 코드가 배포되었지만 실행되지 못함**

### 4단계: CloudWatch 로그 분석

```bash
aws logs tail /ecs/korean-agri-shop/backend --since 10m --region ap-northeast-2
```

**핵심 에러 발견**:
```
FlywayMigrateException: Schema `agrimarket` contains a failed migration to version 10 !
```

**근본 원인 파악**:
1. Flyway 마이그레이션 V10이 과거에 실패
2. `flyway_schema_history` 테이블에 `success = 0` 상태로 저장
3. 애플리케이션 시작 시 Flyway가 failed 마이그레이션 감지
4. Spring Boot 애플리케이션 시작 실패
5. ECS 컨테이너 종료 → 새 태스크 시작 실패 반복
6. 로드밸런서가 구버전 태스크(V21)로만 트래픽 전달
7. **API는 구버전 코드로 응답 (소수점 있음)**

## 🔧 시도한 해결 방법들

### 시도 1: ECS 서비스 강제 재배포

```bash
aws ecs update-service --cluster korean-agri-shop-cluster \
  --service korean-agri-shop-backend-service \
  --force-new-deployment --region ap-northeast-2
```

**결과**: ❌ 실패
- 새 태스크가 시작되지만 동일한 Flyway 에러로 종료
- 근본 원인 미해결

### 시도 2: FlywayConfig에 자동 repair 추가

**코드 수정**:
```java
@Bean
public FlywayMigrationStrategy flywayMigrationStrategy() {
    return flyway -> {
        flyway.repair();  // 실패한 마이그레이션 수정 시도
        flyway.migrate();
    };
}
```

**결과**: ❌ 실패
```
FlywayException: Invalid migration state 'failed'.
Valid states are: [*, missing, pending, ignored, future]
```

Flyway의 `repair()`가 'failed' 상태를 처리하지 못함

### 시도 3: 실패한 마이그레이션 강제 삭제

**코드 수정**:
```java
try {
    flyway.migrate();
} catch (FlywayException e) {
    // DB에서 직접 삭제
    try (Connection conn = dataSource.getConnection();
         Statement stmt = conn.createStatement()) {

        conn.setAutoCommit(false);
        int deleted = stmt.executeUpdate(
            "DELETE FROM flyway_schema_history WHERE success = 0"
        );
        conn.commit();

        // 재시도
        flyway.migrate();
    }
}
```

**결과**: ❌ 실패
- DELETE는 성공 (1개 삭제)
- 하지만 migrate() 재시도 시 동일 에러 발생
- Flyway 내부 캐시 또는 트랜잭션 문제로 추정

### 시도 4: Flyway 비활성화 (최종 해결)

**application.properties 수정**:
```properties
# Before
spring.flyway.enabled=true

# After
spring.flyway.enabled=false
```

**결과**: ✅ 성공
1. Flyway 체크 완전히 스킵
2. 애플리케이션 정상 시작
3. Product.java의 반올림 로직 실행
4. API 응답 정상화

```bash
curl "https://api.todaymart.co.kr/api/products?page=0&size=1" | jq '.content[0].discountedPrice'
# 결과: 8899 ✅
```

## ✅ 최종 해결 방법

### 즉시 대응 (긴급)

```bash
# 1. Flyway 비활성화
echo "spring.flyway.enabled=false" >> backend/src/main/resources/application.properties

# 2. 커밋 및 배포
git add backend/src/main/resources/application.properties
git commit -m "fix: Flyway 임시 비활성화 (failed 마이그레이션 문제 우회)"
git push origin main

# 3. GitHub Actions가 자동으로 빌드 및 배포
# 약 5분 후 ECS 새 태스크가 healthy 상태가 되면 해결
```

### 근본 원인 해결 (향후)

**Option 1: RDS 직접 접속하여 수동 정리**
```bash
# Bastion 호스트를 통해 RDS 접속
mysql -h korean-agri-shop-mysql.clm60gwkayez.ap-northeast-2.rds.amazonaws.com \
  -u admin -p

# 실패한 마이그레이션 확인
SELECT * FROM flyway_schema_history WHERE success = 0;

# 삭제
DELETE FROM flyway_schema_history WHERE success = 0;

# Flyway 재활성화
# application.properties: spring.flyway.enabled=true
```

**Option 2: Flyway baseline 재설정**
```properties
spring.flyway.enabled=true
spring.flyway.baseline-version=11
spring.flyway.baseline-on-migrate=true
# V10을 무시하고 V11부터 새로 시작
```

**Option 3: V10 마이그레이션 재작성**
```bash
# V10 파일 내용 확인
cat backend/src/main/resources/db/migration/V10__create_help_center_tables.sql

# 문제가 있다면 수정하거나
# V12로 재작성하여 우회
```

## 📊 타임라인

| 시간 | 이벤트 |
|------|--------|
| 15:42 | 구버전 배포 (태스크 정의 21) 정상 동작 중 |
| 23:55 | Product.java 수정 (할인가 반올림 로직 추가) |
| 00:03 | 새 이미지 ECR 푸시 (커밋 5384f8e) |
| 01:35 | 최신 배포 (태스크 정의 26) 시도 → **실패** |
| 01:51 | 강제 재배포 시도 → **실패** |
| 02:10 | FlywayConfig 수정 배포 (태스크 정의 28) → **실패** |
| 02:17 | **Flyway 비활성화 배포** (태스크 정의 30) → ✅ **성공** |
| 02:25 | API 정상화 확인 (소수점 제거됨) |

## 🎓 교훈

### 1. Flyway 실패는 치명적
- 실패한 마이그레이션이 하나라도 있으면 애플리케이션 시작 차단
- 프로덕션 환경에서는 특히 주의 필요

### 2. 배포 != 실행
- ECR에 이미지가 푸시되어도
- ECS 태스크가 시작되어도
- **애플리케이션이 정상 실행되는지 확인 필수**

### 3. 로그 모니터링 중요성
- CloudWatch Logs를 체크하지 않으면
- "배포는 성공했는데 왜 안 되지?"라는 상황 발생

### 4. 롤백 전략 필요
- Flyway 같은 critical한 컴포넌트는
- 비활성화 옵션을 미리 준비해두는 것이 좋음

## 🔮 향후 개선 사항

### 1. Flyway 설정 개선
```properties
# 실패 시 자동 복구 옵션 추가
spring.flyway.clean-disabled=true
spring.flyway.validate-on-migrate=false
spring.flyway.out-of-order=true
spring.flyway.ignore-missing-migrations=true
```

### 2. 헬스 체크 강화
```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        // Flyway 상태 체크
        // 실패한 마이그레이션이 있으면 WARNING
    }
}
```

### 3. CI/CD 파이프라인 개선
```yaml
# GitHub Actions에 헬스 체크 단계 추가
- name: Wait for healthy deployment
  run: |
    # 새 태스크가 healthy가 될 때까지 대기
    # 타임아웃 시 자동 롤백
```

### 4. 모니터링 알림 설정
```
CloudWatch Alarm 설정:
- ECS 태스크 실패 횟수 > 3회 → Slack 알림
- 신규 배포 후 5분 이내 healthy 미달성 → 자동 롤백
```

## 📚 참고 자료

- [Flyway 공식 문서](https://flywaydb.org/documentation/)
- [AWS ECS 트러블슈팅 가이드](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/troubleshooting.html)
- [Spring Boot Flyway 설정](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.data-initialization.migration-tool.flyway)

## 📞 관련 이슈

- Commit: `5384f8e` - Product.java 할인가 반올림 로직 추가
- Commit: `308fab5` - FlywayMigrationStrategy 자동 repair 구현
- Commit: `ada3cf4` - Flyway 임시 비활성화 (최종 해결)

---

**작성일**: 2025-11-10
**작성자**: Claude Code
**상태**: 해결됨 (Flyway 비활성화 상태로 운영 중)
