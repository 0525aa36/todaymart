# Security Setup Guide

**작성일**: 2025-11-10
**버전**: 1.0
**상태**: Week 1 긴급 보안 패치 완료

---

## 📋 개요

본 문서는 Korean Agri Shop 프로젝트의 보안 설정 가이드입니다. Week 1 긴급 보안 패치를 통해 다음 사항들이 개선되었습니다:

### ✅ 완료된 보안 패치

1. **하드코딩된 시크릿 제거** - `application.properties`에서 모든 기본값 제거
2. **AWS Secrets Manager 통합** - 프로덕션 환경 시크릿 관리
3. **재고 동시성 제어** - Pessimistic Lock으로 재고 차감 시 경쟁 조건 방지

---

## 🔐 시크릿 키 관리

### 제거된 하드코딩 시크릿

다음 시크릿들이 `application.properties`에서 하드코딩된 기본값이 제거되었습니다:

| 시크릿 키 | 용도 | 환경변수명 |
|----------|------|-----------|
| JWT Secret | JWT 토큰 서명 | `JWT_SECRET` |
| Webhook Secret | Toss Payments 웹훅 검증 | `WEBHOOK_SECRET` |
| Toss Client Key | Toss Payments 클라이언트 키 | `TOSS_PAYMENTS_CLIENT_KEY` |
| Toss Secret Key | Toss Payments 서버 키 | `TOSS_PAYMENTS_SECRET_KEY` |
| Naver Client ID | 네이버 OAuth2 클라이언트 ID | `NAVER_CLIENT_ID` |
| Naver Client Secret | 네이버 OAuth2 시크릿 | `NAVER_CLIENT_SECRET` |
| Kakao Client ID | 카카오 OAuth2 클라이언트 ID | `KAKAO_CLIENT_ID` |
| Kakao Client Secret | 카카오 OAuth2 시크릿 | `KAKAO_CLIENT_SECRET` |

### ⚠️ 중요 변경 사항

**이전 (취약)**:
```properties
app.jwtSecret=${JWT_SECRET:YourSuperSecretJwtKeyThatIsAtLeast512BitsLongForHS512...}
```

**현재 (안전)**:
```properties
# JWT Configuration - NO DEFAULT VALUES (환경변수 필수)
app.jwtSecret=${JWT_SECRET}
```

**결과**: 환경변수가 설정되지 않으면 애플리케이션이 시작되지 않습니다. 이는 **의도된 동작**으로, 실수로 기본값을 사용하는 것을 방지합니다.

---

## 🛠️ 로컬 개발 환경 설정

### 1. 환경변수 파일 생성

`.env.local` 파일을 프로젝트 루트에 생성하세요 (Git에 커밋하지 마세요!):

```bash
# .env.local (예시 - 실제 값으로 교체 필요)

# Database Configuration
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=agrimarket
export DB_USERNAME=agrimarket
export DB_PASSWORD=your-secure-password

# JWT Configuration (최소 512비트 필요)
export JWT_SECRET=your-super-secret-jwt-key-that-is-at-least-512-bits-long-for-hs512-algorithm-security-requirements-1234567890

# Toss Payments (개발 환경은 test_ 키 사용)
export TOSS_PAYMENTS_CLIENT_KEY=test_ck_your_client_key
export TOSS_PAYMENTS_SECRET_KEY=test_sk_your_secret_key
export WEBHOOK_SECRET=your-webhook-secret

# OAuth2 - Naver
export NAVER_CLIENT_ID=your_naver_client_id
export NAVER_CLIENT_SECRET=your_naver_client_secret

# OAuth2 - Kakao
export KAKAO_CLIENT_ID=your_kakao_client_id
export KAKAO_CLIENT_SECRET=your_kakao_client_secret

# Frontend URL
export FRONTEND_URL=http://localhost:3000

# CORS
export CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 2. 환경변수 로드

**방법 1: Source 명령어 사용**
```bash
source .env.local
./gradlew bootRun
```

**방법 2: IntelliJ IDEA 사용**
1. Run → Edit Configurations
2. Environment variables 필드에 추가
3. 또는 `.env` 플러그인 사용

**방법 3: Gradle 직접 실행**
```bash
JWT_SECRET="..." TOSS_PAYMENTS_CLIENT_KEY="..." ./gradlew bootRun
```

### 3. JWT Secret 생성

안전한 512비트 이상의 시크릿을 생성하세요:

```bash
# OpenSSL 사용
openssl rand -base64 64

# 또는 Node.js 사용
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## ☁️ AWS Secrets Manager 설정 (프로덕션)

### 1. AWS Secrets Manager에 시크릿 생성

```bash
# AWS CLI를 사용하여 시크릿 생성
aws secretsmanager create-secret \
  --name korean-agri-shop/production/backend \
  --description "Backend application secrets" \
  --secret-string '{
    "JWT_SECRET": "your-production-jwt-secret-512-bits",
    "WEBHOOK_SECRET": "your-production-webhook-secret",
    "TOSS_PAYMENTS_CLIENT_KEY": "live_ck_...",
    "TOSS_PAYMENTS_SECRET_KEY": "live_sk_...",
    "NAVER_CLIENT_ID": "your_production_naver_id",
    "NAVER_CLIENT_SECRET": "your_production_naver_secret",
    "KAKAO_CLIENT_ID": "your_production_kakao_id",
    "KAKAO_CLIENT_SECRET": "your_production_kakao_secret"
  }' \
  --region ap-northeast-2
```

### 2. ECS 태스크 실행 역할 권한 추가

ECS 태스크 실행 역할에 Secrets Manager 읽기 권한을 부여하세요:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:ap-northeast-2:*:secret:korean-agri-shop/production/backend*"
      ]
    }
  ]
}
```

### 3. ECS 태스크 정의에 시크릿 연결

ECS 태스크 정의 JSON에 다음을 추가:

```json
{
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "...",
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:ACCOUNT_ID:secret:korean-agri-shop/production/backend:JWT_SECRET::"
        },
        {
          "name": "WEBHOOK_SECRET",
          "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:ACCOUNT_ID:secret:korean-agri-shop/production/backend:WEBHOOK_SECRET::"
        },
        {
          "name": "TOSS_PAYMENTS_CLIENT_KEY",
          "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:ACCOUNT_ID:secret:korean-agri-shop/production/backend:TOSS_PAYMENTS_CLIENT_KEY::"
        },
        {
          "name": "TOSS_PAYMENTS_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:ACCOUNT_ID:secret:korean-agri-shop/production/backend:TOSS_PAYMENTS_SECRET_KEY::"
        },
        {
          "name": "NAVER_CLIENT_ID",
          "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:ACCOUNT_ID:secret:korean-agri-shop/production/backend:NAVER_CLIENT_ID::"
        },
        {
          "name": "NAVER_CLIENT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:ACCOUNT_ID:secret:korean-agri-shop/production/backend:NAVER_CLIENT_SECRET::"
        },
        {
          "name": "KAKAO_CLIENT_ID",
          "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:ACCOUNT_ID:secret:korean-agri-shop/production/backend:KAKAO_CLIENT_ID::"
        },
        {
          "name": "KAKAO_CLIENT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:ACCOUNT_ID:secret:korean-agri-shop/production/backend:KAKAO_CLIENT_SECRET::"
        }
      ]
    }
  ]
}
```

### 4. GitHub Actions에 시크릿 추가 (CI/CD)

GitHub Repository Settings → Secrets and variables → Actions에 추가:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (ap-northeast-2)

**주의**: 애플리케이션 시크릿은 GitHub Secrets에 저장하지 마세요. AWS Secrets Manager만 사용하세요.

---

## 🔒 재고 동시성 제어

### 개선된 재고 차감 로직

**문제**: 동시에 여러 주문이 발생할 때 재고가 정확히 차감되지 않는 경쟁 조건(Race Condition) 발생

**해결**: JPA Pessimistic Lock 적용

### 변경 사항

**파일**: `backend/src/main/java/com/agri/market/order/OrderService.java`

**이전 (취약)**:
```java
for (OrderItem item : order.getOrderItems()) {
    Product product = item.getProduct();
    product.setStock(product.getStock() - item.getQuantity());
    productRepository.save(product);
}
```

**현재 (안전)**:
```java
for (OrderItem item : order.getOrderItems()) {
    // Pessimistic Write Lock으로 동시성 제어
    Product product = productRepository.findByIdWithLock(item.getProduct().getId())
            .orElseThrow(() -> new RuntimeException("Product not found"));

    // 재고 부족 체크
    if (product.getStock() < item.getQuantity()) {
        throw new RuntimeException("Insufficient stock for product: " + product.getName());
    }

    product.setStock(product.getStock() - item.getQuantity());
    productRepository.save(product);
}
```

### 동작 원리

1. `@Lock(LockModeType.PESSIMISTIC_WRITE)` 어노테이션으로 DB 행 잠금
2. 트랜잭션이 커밋될 때까지 다른 트랜잭션은 해당 상품을 읽거나 수정할 수 없음
3. 재고 부족 시 예외를 발생시켜 주문 전체 롤백
4. 오버셀링(Overselling) 방지

### 성능 고려사항

- **장점**: 데이터 정합성 100% 보장
- **단점**: 동시 처리량 감소 (Lock 대기 시간 발생)
- **권장**: 현재 트래픽 규모에서는 문제 없음. 향후 트래픽 증가 시 Optimistic Lock 검토

---

## 🧪 테스트 방법

### 1. 환경변수 누락 테스트

```bash
# JWT_SECRET 없이 실행 (실패해야 정상)
./gradlew bootRun

# 예상 에러:
# Could not resolve placeholder 'JWT_SECRET' in value "${JWT_SECRET}"
```

### 2. 재고 동시성 테스트

```bash
# JMeter 또는 Artillery로 동시 주문 테스트
artillery quick --count 10 --num 5 http://localhost:8081/api/orders
```

재고가 10개인 상품에 동시 주문 50개 요청 시:
- **이전**: 재고가 음수로 갈 수 있음 (-40개)
- **현재**: 정확히 10개만 판매되고 나머지는 "Insufficient stock" 에러

---

## 📚 참고 자료

### 관련 파일

- `backend/src/main/resources/application.properties` - 시크릿 설정
- `backend/build.gradle` - AWS Secrets Manager 의존성
- `backend/src/main/java/com/agri/market/order/OrderService.java` - 재고 Lock
- `backend/src/main/java/com/agri/market/product/ProductRepository.java` - Lock 쿼리 정의

### 관련 문서

- [Spring Boot Externalized Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.external-config)
- [AWS Secrets Manager with Spring Boot](https://docs.awspring.io/spring-cloud-aws/docs/3.0.3/reference/html/index.html#spring-cloud-aws-secrets-manager)
- [JPA Pessimistic Locking](https://docs.oracle.com/javaee/7/tutorial/persistence-locking002.htm)

### 보안 Best Practices

1. **절대 하드코딩하지 마세요**
   - 시크릿은 항상 환경변수 또는 Secrets Manager 사용
   - 기본값 제공 금지 (개발 환경도 예외 없음)

2. **시크릿 로테이션**
   - JWT Secret: 3개월마다 변경
   - OAuth2 Secrets: 제공자 가이드 준수
   - Webhook Secret: 6개월마다 변경

3. **최소 권한 원칙**
   - IAM 역할은 필요한 권한만 부여
   - Secrets Manager 접근은 프로덕션 ECS 태스크만

4. **모니터링**
   - CloudWatch Logs에서 "Could not resolve placeholder" 에러 알림 설정
   - 재고 음수 발생 시 알림 (현재는 방지됨)

---

## ⚠️ 주의사항

### 배포 전 체크리스트

- [ ] 모든 환경변수가 ECS 태스크 정의에 설정되었는가?
- [ ] AWS Secrets Manager에 프로덕션 시크릿이 생성되었는가?
- [ ] ECS 태스크 실행 역할에 Secrets Manager 권한이 있는가?
- [ ] JWT Secret이 최소 512비트인가?
- [ ] Toss Payments는 프로덕션 환경에서 `live_` 키를 사용하는가?
- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있는가?

### 트러블슈팅

**문제**: 애플리케이션이 시작되지 않음
```
Could not resolve placeholder 'JWT_SECRET'
```
**해결**: 환경변수가 설정되지 않았습니다. 위의 "로컬 개발 환경 설정" 섹션을 참고하세요.

**문제**: ECS 태스크가 STOPPED 상태
```
CannotPullContainerError: inspect image has been retried
```
**해결**: CloudWatch Logs를 확인하여 시크릿 관련 에러가 있는지 확인하세요.

**문제**: 재고가 음수가 됨
**해결**: `OrderService.completePayment()` 메서드가 `findByIdWithLock()`을 사용하는지 확인하세요.

---

## 📞 문의

문제가 발생하면 다음을 확인하세요:

1. CloudWatch Logs (`/ecs/korean-agri-shop/backend`)
2. ECS 서비스 이벤트 탭
3. Secrets Manager 접근 권한
4. 환경변수 철자 오타

---

**마지막 업데이트**: 2025-11-10
**작성자**: Claude Code
**리뷰 상태**: 승인 대기
