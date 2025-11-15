# 보안 체크리스트

**최종 업데이트**: 2025-11-15
**대상 프로젝트**: Korean Agricultural Products E-commerce Platform

---

## 목차

1. [인증 및 권한](#인증-및-권한)
2. [데이터 보호](#데이터-보호)
3. [네트워크 보안](#네트워크-보안)
4. [API 보안](#api-보안)
5. [결제 보안](#결제-보안)
6. [프론트엔드 보안](#프론트엔드-보안)
7. [인프라 보안](#인프라-보안)
8. [배포 체크리스트](#배포-체크리스트)

---

## 인증 및 권한

### ✅ 구현 완료

- [x] JWT 기반 인증 시스템
- [x] 리프레시 토큰 (30일 만료)
- [x] 액세스 토큰 (1시간 만료)
- [x] httpOnly 쿠키로 리프레시 토큰 저장
- [x] OAuth2 소셜 로그인 (네이버, 카카오, 구글)
- [x] 비밀번호 BCrypt 암호화
- [x] Role 기반 접근 제어 (ROLE_USER, ROLE_ADMIN)

### ⚠️ 개선 필요

#### 1. 쿠키 Secure 플래그 환경별 설정

**현재 상태**: 모든 환경에서 `Secure=false`

**위험도**: 🔴 CRITICAL

**체크리스트**:
```
[ ] application.properties에 app.cookie.secure 설정 추가
[ ] 로컬 환경: app.cookie.secure=false
[ ] 프로덕션 환경: APP_COOKIE_SECURE=true 환경 변수 설정
[ ] AuthController.java에서 동적 설정 적용
[ ] OAuth2AuthenticationSuccessHandler.java에서 동적 설정 적용
[ ] 테스트: 프로덕션에서 Secure 플래그 확인
```

**구현 코드**:
```java
// SecurityConfig.java
@Value("${app.cookie.secure:false}")
private boolean cookieSecure;

@Bean
public CookieSecurityConfig cookieConfig() {
    return new CookieSecurityConfig(cookieSecure);
}

// AuthController.java
@Autowired
private CookieSecurityConfig cookieConfig;

refreshTokenCookie.setSecure(cookieConfig.isSecure());
```

---

#### 2. 액세스 토큰 블랙리스트

**현재 상태**: 로그아웃 시 액세스 토큰이 1시간 동안 유효

**위험도**: 🟡 MEDIUM

**체크리스트**:
```
[ ] Redis 설치 및 Spring Data Redis 의존성 추가
[ ] RedisTokenBlacklistService 구현
[ ] JwtAuthenticationFilter에 블랙리스트 체크 추가
[ ] AuthController logout 메서드에 블랙리스트 추가 로직
[ ] JwtTokenProvider에 getRemainingExpiration 메서드 추가
[ ] 테스트: 로그아웃 후 액세스 토큰 사용 불가 확인
```

**구현 코드**:
```java
// RedisTokenBlacklistService.java
@Service
public class RedisTokenBlacklistService {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    public void blacklistToken(String token, long expirationMs) {
        String key = "blacklist:token:" + token;
        redisTemplate.opsForValue().set(key, "revoked", expirationMs, TimeUnit.MILLISECONDS);
    }

    public boolean isBlacklisted(String token) {
        return redisTemplate.hasKey("blacklist:token:" + token);
    }
}
```

---

#### 3. 비밀번호 정책 강화

**현재 상태**: 최소 8자만 요구

**위험도**: 🟡 MEDIUM

**체크리스트**:
```
[ ] RegisterRequest.java에 @Pattern 어노테이션 추가
[ ] 대문자, 소문자, 숫자, 특수문자 각 1개 이상 요구
[ ] 프론트엔드 검증 추가 (Zod schema)
[ ] 비밀번호 변경 시에도 동일한 정책 적용
[ ] 에러 메시지 한글화
[ ] 테스트: 약한 비밀번호 거부 확인
```

**구현 코드**:
```java
@Pattern(
    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
    message = "비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 이상 포함해야 합니다."
)
private String password;
```

---

#### 4. 계정 잠금 정책

**현재 상태**: 무제한 로그인 시도 가능

**위험도**: 🟡 MEDIUM

**체크리스트**:
```
[ ] Redis에 로그인 실패 횟수 저장
[ ] 5회 실패 시 15분간 계정 잠금
[ ] 잠금 해제 시간 표시
[ ] 관리자 계정은 수동 잠금 해제 필요
[ ] 로그인 성공 시 실패 횟수 초기화
[ ] 테스트: 5회 실패 후 잠금 확인
```

**구현 코드**:
```java
@Service
public class LoginAttemptService {

    @Autowired
    private RedisTemplate<String, Integer> redisTemplate;

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_TIME_MINUTES = 15;

    public void loginFailed(String email) {
        String key = "login:attempts:" + email;
        Integer attempts = redisTemplate.opsForValue().get(key);

        if (attempts == null) {
            attempts = 0;
        }

        attempts++;
        redisTemplate.opsForValue().set(key, attempts, LOCK_TIME_MINUTES, TimeUnit.MINUTES);

        if (attempts >= MAX_ATTEMPTS) {
            redisTemplate.opsForValue().set("login:locked:" + email, 1, LOCK_TIME_MINUTES, TimeUnit.MINUTES);
        }
    }

    public boolean isLocked(String email) {
        return redisTemplate.hasKey("login:locked:" + email);
    }

    public void loginSucceeded(String email) {
        redisTemplate.delete("login:attempts:" + email);
        redisTemplate.delete("login:locked:" + email);
    }
}
```

---

#### 5. Method Security 활성화

**현재 상태**: 수동 권한 검증

**위험도**: 🟡 MEDIUM

**체크리스트**:
```
[ ] @EnableMethodSecurity 어노테이션 추가
[ ] 모든 관리자 메서드에 @PreAuthorize("hasRole('ADMIN')") 추가
[ ] 사용자별 리소스 접근 검증 (예: 자신의 주문만 조회)
[ ] 판매자 권한 검증
[ ] 테스트: 권한 없는 접근 거부 확인
```

**구현 코드**:
```java
@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class MethodSecurityConfig {
}

// OrderService.java
@PreAuthorize("hasRole('ADMIN') or @orderSecurityService.isOwner(#orderId, authentication.name)")
public Order getOrderById(Long orderId) {
    // ...
}
```

---

## 데이터 보호

### ✅ 구현 완료

- [x] 비밀번호 BCrypt 암호화
- [x] JWT Secret 환경 변수 분리
- [x] SQL Injection 방어 (JPA 사용)

### ⚠️ 개선 필요

#### 1. 민감 데이터 로깅 방지

**위험도**: 🟡 MEDIUM

**체크리스트**:
```
[ ] Logback 설정에 민감 필드 마스킹 추가
[ ] 비밀번호, 토큰, 카드번호 로깅 방지
[ ] 로그에 개인정보 미포함 확인
[ ] Sentry에도 민감 정보 필터링 적용
[ ] 테스트: 로그 파일 검토
```

**구현 코드**:
```java
// LoggingAspect.java
@Around("execution(* com.agri.market..*(..))")
public Object maskSensitiveData(ProceedingJoinPoint joinPoint) throws Throwable {
    Object[] args = joinPoint.getArgs();

    for (int i = 0; i < args.length; i++) {
        if (args[i] instanceof LoginRequest) {
            LoginRequest masked = new LoginRequest();
            masked.setEmail(((LoginRequest) args[i]).getEmail());
            masked.setPassword("***MASKED***");
            args[i] = masked;
        }
    }

    return joinPoint.proceed(args);
}
```

---

#### 2. 데이터베이스 암호화

**위험도**: 🟢 LOW (현재는 필요 없음, 향후 고려)

**체크리스트** (향후 구현 시):
```
[ ] MySQL Transparent Data Encryption (TDE) 활성화
[ ] AWS RDS 암호화 활성화
[ ] 백업 파일 암호화
[ ] 주민등록번호 등 민감 필드 애플리케이션 레벨 암호화
```

---

## 네트워크 보안

### ⚠️ 개선 필요

#### 1. HTTPS 강제 및 HSTS

**현재 상태**: HTTP 허용

**위험도**: 🔴 CRITICAL (프로덕션)

**체크리스트**:
```
[ ] ALB에서 HTTP -> HTTPS 리다이렉트 설정
[ ] HSTS 헤더 추가 (max-age=31536000; includeSubDomains)
[ ] SecurityConfig에서 requiresSecure() 설정
[ ] 테스트: http:// 접속 시 https://로 리다이렉트 확인
```

**구현 코드**:
```java
// SecurityConfig.java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .requiresChannel(channel -> channel
            .anyRequest().requiresSecure()
        )
        .headers(headers -> headers
            .httpStrictTransportSecurity(hsts -> hsts
                .includeSubDomains(true)
                .maxAgeInSeconds(31536000)
            )
        );

    return http.build();
}
```

---

#### 2. CORS 정책 강화

**현재 상태**: localhost 허용

**위험도**: 🟢 LOW (로컬 개발용)

**체크리스트**:
```
[ ] application-prod.properties에 프로덕션 도메인만 설정
[ ] 와일드카드(*) 사용 금지
[ ] 개발/스테이징 환경별 CORS 설정 분리
[ ] preflight 요청 캐싱 (max-age=3600)
[ ] 테스트: 허용되지 않은 도메인 접근 거부 확인
```

**구현 코드**:
```properties
# application-prod.properties
cors.allowed.origins=https://todaymart.co.kr,https://www.todaymart.co.kr
```

---

#### 3. Rate Limiting

**현재 상태**: 무제한 요청 가능

**위험도**: 🟡 MEDIUM

**체크리스트**:
```
[ ] Bucket4j 라이브러리 추가
[ ] 로그인 API: 5회/분
[ ] 결제 API: 10회/시간
[ ] 일반 API: 100회/분
[ ] IP 기반 제한
[ ] 429 Too Many Requests 응답
[ ] 테스트: 제한 초과 시 거부 확인
```

**구현 코드**:
```java
@Configuration
public class RateLimitConfig {

    @Bean
    public Bucket loginBucket() {
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }
}

// RateLimitInterceptor.java
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    @Autowired
    private Bucket loginBucket;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (request.getRequestURI().contains("/api/auth/login")) {
            if (!loginBucket.tryConsume(1)) {
                response.setStatus(429);
                return false;
            }
        }
        return true;
    }
}
```

---

#### 4. CSP (Content Security Policy)

**현재 상태**: CSP 헤더 없음

**위험도**: 🟡 MEDIUM

**체크리스트**:
```
[ ] CSP 헤더 추가
[ ] script-src 'self'로 제한
[ ] 인라인 스크립트 금지 (또는 nonce 사용)
[ ] img-src에 CDN 도메인 추가
[ ] 테스트: XSS 공격 차단 확인
```

**구현 코드**:
```java
// SecurityConfig.java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp
        .policyDirectives("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://cdn.example.com;")
    )
);
```

---

## API 보안

### ⚠️ 개선 필요

#### 1. 입력 검증 강화

**위험도**: 🟡 MEDIUM

**체크리스트**:
```
[ ] 모든 DTO에 @Valid 어노테이션
[ ] @Size, @NotBlank, @Email 등 검증 어노테이션 추가
[ ] 커스텀 Validator 구현 (전화번호, 주소 등)
[ ] 파일 업로드 크기 제한
[ ] 파일 확장자 화이트리스트
[ ] 테스트: 잘못된 입력 거부 확인
```

**구현 코드**:
```java
// ProductRequest.java
@NotBlank(message = "상품명은 필수입니다.")
@Size(min = 2, max = 100, message = "상품명은 2자 이상 100자 이하여야 합니다.")
private String name;

@NotNull(message = "가격은 필수입니다.")
@Min(value = 0, message = "가격은 0 이상이어야 합니다.")
private BigDecimal price;
```

---

#### 2. API 응답 정보 노출 최소화

**위험도**: 🟢 LOW

**체크리스트**:
```
[ ] 에러 응답에 스택 트레이스 제거
[ ] 내부 에러 메시지 숨기기
[ ] 사용자 친화적 에러 메시지 반환
[ ] 서버 버전 정보 숨기기
[ ] 테스트: 500 에러 시 스택 트레이스 미노출 확인
```

**구현 코드**:
```properties
# application-prod.properties
server.error.include-message=never
server.error.include-stacktrace=never
server.error.include-exception=false
```

---

#### 3. IDOR (Insecure Direct Object Reference) 방어

**위험도**: 🟡 MEDIUM

**체크리스트**:
```
[ ] 주문 ID로 다른 사용자 주문 조회 불가
[ ] 리뷰 수정/삭제 시 작성자 확인
[ ] 주소 ID로 다른 사용자 주소 접근 불가
[ ] UUID 또는 난독화된 ID 사용 고려
[ ] 테스트: 다른 사용자 리소스 접근 거부 확인
```

**구현 코드**:
```java
// OrderService.java
public Order getOrderById(Long orderId, String userEmail) {
    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new NotFoundException("주문을 찾을 수 없습니다."));

    if (!order.getUser().getEmail().equals(userEmail)) {
        throw new ForbiddenException("접근 권한이 없습니다.");
    }

    return order;
}
```

---

## 결제 보안

### ✅ 구현 완료

- [x] Toss Payments 웹훅 서명 검증
- [x] HTTPS 통신
- [x] PCI DSS 준수 (Toss Payments 처리)

### ⚠️ 개선 필요

#### 1. 웹훅 재전송 공격 방어

**위험도**: 🟡 MEDIUM

**체크리스트**:
```
[ ] 웹훅 요청에 타임스탬프 포함
[ ] 5분 이내 요청만 허용
[ ] 웹훅 ID로 중복 처리 방지 (Redis)
[ ] 서명 검증 시 타임스탬프 포함
[ ] 테스트: 오래된 웹훅 거부 확인
```

**구현 코드**:
```java
public boolean verifyWebhookSignature(String signature, String timestamp, String requestBody) {
    // 타임스탬프 검증
    long requestTime = Long.parseLong(timestamp);
    long currentTime = System.currentTimeMillis() / 1000;
    if (Math.abs(currentTime - requestTime) > 300) {
        return false;
    }

    // 서명 검증
    String payload = timestamp + "." + requestBody;
    String expectedSignature = calculateHmacSha256(payload, webhookSecret);
    return signature.equals(expectedSignature);
}
```

---

#### 2. 결제 금액 변조 방지

**위험도**: 🔴 CRITICAL

**체크리스트**:
```
[ ] 서버에서 주문 금액 재계산
[ ] 클라이언트 금액과 서버 금액 비교
[ ] 불일치 시 결제 거부
[ ] 쿠폰 할인 검증
[ ] 배송비 계산 검증
[ ] 테스트: 변조된 금액 결제 거부 확인
```

**구현 코드**:
```java
// PaymentService.java
public void confirmPayment(String paymentKey, String orderId, BigDecimal amount) {
    Order order = orderRepository.findByOrderNumber(orderId)
        .orElseThrow(() -> new NotFoundException("주문을 찾을 수 없습니다."));

    // 서버에서 금액 재계산
    BigDecimal calculatedAmount = calculateOrderAmount(order);

    if (!calculatedAmount.equals(amount)) {
        throw new PaymentValidationException("결제 금액이 일치하지 않습니다.");
    }

    // Toss Payments API 호출
    // ...
}
```

---

## 프론트엔드 보안

### ⚠️ 개선 필요

#### 1. XSS 방어

**위험도**: 🟡 MEDIUM

**체크리스트**:
```
[ ] React 기본 escaping 활용 (dangerouslySetInnerHTML 금지)
[ ] DOMPurify 라이브러리로 사용자 입력 sanitize
[ ] CSP 헤더 적용
[ ] innerHTML 대신 textContent 사용
[ ] 테스트: <script> 태그 입력 시 실행 안 됨 확인
```

**구현 코드**:
```typescript
import DOMPurify from 'dompurify'

// 사용자 입력을 HTML로 렌더링해야 할 경우
const sanitizedHTML = DOMPurify.sanitize(userInput)
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />

// 일반적인 경우
<p>{userInput}</p>  // React가 자동 escape
```

---

#### 2. 토큰 보안 저장

**현재 상태**: localStorage에 액세스 토큰 저장

**위험도**: 🟡 MEDIUM (XSS 공격 시 탈취 가능)

**체크리스트**:
```
[ ] 액세스 토큰도 httpOnly 쿠키로 이동 고려 (트레이드오프)
[ ] localStorage 대신 sessionStorage 고려
[ ] 토큰 자동 갱신 로직 검증
[ ] 로그아웃 시 localStorage 정리
[ ] 테스트: XSS 공격으로 토큰 탈취 시나리오
```

---

#### 3. 민감 정보 노출 방지

**위험도**: 🟢 LOW

**체크리스트**:
```
[ ] console.log 제거 (프로덕션 빌드)
[ ] API 키 하드코딩 금지
[ ] .env 파일 .gitignore 추가
[ ] 소스맵 프로덕션 배포 시 비활성화
[ ] 테스트: 프로덕션 빌드에 console.log 없음 확인
```

**구현 코드**:
```javascript
// next.config.js
module.exports = {
  productionBrowserSourceMaps: false,

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.minimize = true

      // Remove console.log in production
      config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true
    }
    return config
  }
}
```

---

## 인프라 보안

### ⚠️ 개선 필요

#### 1. Secrets Manager 사용

**현재 상태**: 환경 변수로 비밀 관리

**위험도**: 🟡 MEDIUM

**체크리스트**:
```
[ ] AWS Secrets Manager에 비밀 저장
[ ] JWT Secret, DB 비밀번호, OAuth Client Secret 이전
[ ] ECS Task Definition에서 Secrets Manager 참조
[ ] 로컬 개발 환경은 .env 파일 유지
[ ] 비밀 자동 로테이션 설정 (선택)
[ ] 테스트: Secrets Manager에서 비밀 로드 확인
```

**구현 코드**:
```yaml
# ECS Task Definition
{
  "containerDefinitions": [{
    "secrets": [
      {
        "name": "JWT_SECRET",
        "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"
      }
    ]
  }]
}
```

---

#### 2. VPC 및 보안 그룹 강화

**위험도**: 🟡 MEDIUM

**체크리스트**:
```
[ ] RDS를 private subnet에 배치
[ ] ECS 컨테이너를 private subnet에 배치
[ ] ALB만 public subnet에 배치
[ ] 보안 그룹에서 필요한 포트만 허용
[ ] SSH 접근 제한 (Bastion Host 또는 SSM)
[ ] 테스트: 외부에서 RDS 직접 접근 불가 확인
```

---

#### 3. 로깅 및 감사

**위험도**: 🟡 MEDIUM

**체크리스트**:
```
[ ] CloudWatch Logs에 모든 로그 전송
[ ] CloudTrail로 API 호출 감사
[ ] 로그인 시도 로깅
[ ] 권한 변경 로깅
[ ] 결제 트랜잭션 로깅
[ ] 로그 보관 기간 설정 (최소 90일)
[ ] 테스트: 로그 검색 및 분석
```

---

## 배포 체크리스트

### 프로덕션 배포 전 필수 확인 사항

#### Backend

```
[ ] app.cookie.secure=true 설정
[ ] SameSite=None (HTTPS + 크로스 도메인 쿠키)
[ ] CORS allowed origins에 프로덕션 도메인만 포함
[ ] JWT Secret 강력한 랜덤 값으로 설정 (64자 이상)
[ ] OAuth Client Secret 환경 변수로 설정 (기본값 제거)
[ ] spring.jpa.hibernate.ddl-auto=validate
[ ] spring.jpa.show-sql=false
[ ] server.error.include-stacktrace=never
[ ] HTTPS 강제 (requiresSecure)
[ ] HSTS 헤더 활성화
[ ] Rate Limiting 활성화
[ ] Redis 연결 정보 환경 변수로 설정
[ ] AWS Secrets Manager 통합
```

#### Frontend

```
[ ] NEXT_PUBLIC_API_URL을 프로덕션 도메인으로 설정
[ ] console.log 제거 (terser 설정)
[ ] 소스맵 비활성화
[ ] .env 파일 .gitignore 추가
[ ] API 키 환경 변수로 분리
[ ] CSP 헤더 설정
[ ] XSS 방어 확인
```

#### 인프라

```
[ ] HTTPS 인증서 설정 (AWS Certificate Manager)
[ ] ALB에서 HTTP -> HTTPS 리다이렉트
[ ] RDS 암호화 활성화
[ ] RDS 자동 백업 활성화
[ ] VPC 및 보안 그룹 검토
[ ] CloudWatch Alarms 설정
[ ] CloudTrail 활성화
[ ] WAF 규칙 설정 (선택)
```

---

## 정기 점검 (월간)

```
[ ] 의존성 취약점 스캔 (npm audit, Snyk)
[ ] 로그 분석 (의심스러운 활동)
[ ] 비밀번호 정책 준수 확인
[ ] 비활성 계정 정리
[ ] 백업 복구 테스트
[ ] SSL 인증서 만료 확인
[ ] 보안 패치 적용
```

---

## 보안 사고 대응 절차

### 1. 토큰 유출 시

```
1. 즉시 JWT Secret 변경
2. 모든 리프레시 토큰 DB에서 삭제
3. 사용자에게 재로그인 요청
4. 유출 경로 조사
5. 로그 분석
```

### 2. 데이터베이스 침해 시

```
1. DB 접근 차단
2. 최근 백업으로 복구
3. 모든 비밀번호 재설정 강제
4. 사용자에게 공지
5. 침해 원인 파악 및 패치
```

### 3. XSS/CSRF 공격 발견 시

```
1. 해당 입력 필드 즉시 패치
2. 영향받은 사용자 식별
3. CSP 헤더 강화
4. 입력 검증 로직 전면 검토
```

---

## 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Spring Security 공식 문서](https://docs.spring.io/spring-security/reference/)
- [JWT Best Practices](https://curity.io/resources/learn/jwt-best-practices/)
- [NIST 비밀번호 가이드라인](https://pages.nist.gov/800-63-3/)

---

**작성자**: Claude Code
**마지막 업데이트**: 2025-11-15
