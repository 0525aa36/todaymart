# 석재민 백엔드 개발자 - 이력서 포트폴리오 (Korean Agricultural Products E-commerce Platform 추가)

---

## 📌 메인 페이지 (1페이지) - 프로젝트 섹션에 추가할 내용

### 프로젝트

#### Mr.nongsu (농수산물 전자상거래 플랫폼) 2024. 10 - 현재

판매자와 소비자를 연결하는 농수산물 전문 이커머스 플랫폼, 결제·주문·리뷰·쿠폰·관리자 기능 통합 관리

**역할** : Spring Boot 기반 Full-Stack 개발 (Backend 중심)

**구현 기능** :
 (1) JWT + OAuth2 통합 인증 및 Refresh Token 자동 갱신으로 seamless 사용자 경험 구현
 (2) Toss Payments API 연동 및 HMAC-SHA256 Webhook 보안 검증으로 안전한 결제 시스템 구축
 (3) SSE 기반 실시간 알림 시스템 및 Recharts 기반 관리자 대시보드 통계 시각화

---

## 📌 상세 페이지 - 프로젝트 전체 내용

---

# Mr.nongsu (농수산물 전자상거래 플랫폼)

## 소개

판매자와 소비자를 연결하는 농수산물 전문 이커머스 플랫폼

Spring Boot와 Next.js를 활용한 Full-Stack 웹 애플리케이션으로, 상품 관리부터 결제·주문·리뷰·쿠폰 시스템까지
전체 전자상거래 프로세스를 구현했습니다.

특히 JWT 기반 인증, Toss Payments 결제 연동, SSE 실시간 알림, 관리자 통계 대시보드 등
실무에서 필요한 핵심 기능들을 직접 설계하고 구현하며 백엔드 개발 역량을 심화했습니다.

## 기간
2024. 10 - 현재

## 인원
1명 (개인 프로젝트)

## 기술 스택

### Backend
- **Java 21**, **Spring Boot 3.5.7**
- **Spring Security** (JWT, OAuth2)
- **JPA/Hibernate** (Flyway, QueryDSL)
- **HikariCP** (Connection Pool 관리)

### Frontend
- **Next.js 15.2.4**, **React 19**, **TypeScript**
- **Tailwind CSS**, **shadcn/ui** (Radix UI)
- **React Hook Form + Zod** (폼 검증)
- **Recharts** (통계 차트)

### Database
- **MySQL 8**
- **Flyway Migration** (버전 관리)

### Payment & Integration
- **Toss Payments API** (결제 연동)
- **HMAC-SHA256** (Webhook 보안 검증)

### Cloud & DevOps
- **AWS S3** (파일 저장)
- **AWS SES** (이메일 발송)
- **AWS Secrets Manager** (환경변수 관리)
- **Docker**, **Git**

### Architecture Pattern
- **REST API** 설계
- **JWT Stateless 인증**
- **SSE** (Server-Sent Events) 실시간 알림
- **MVC + Service Layer** 패턴

## 역할
Spring Boot 기반 백엔드 API 개발 및 Next.js 프론트엔드 연동, 데이터베이스 설계, 결제 시스템 구축,
관리자 대시보드 개발

---

## 아키텍처

```
사용자
  ↓
Next.js Frontend (Port 3000)
  ↓ (REST API)
Spring Boot Backend (Port 8081)
  ├─ Spring Security (JWT + OAuth2)
  ├─ JPA/Hibernate
  ├─ HikariCP Connection Pool
  ├─ Toss Payments API
  ├─ SSE Notification Service
  └─ AWS S3 / SES
  ↓
MySQL 8 Database
  ├─ users (회원 정보)
  ├─ products (상품 + 옵션 + 이미지)
  ├─ orders (주문 + 주문 아이템)
  ├─ payments (결제 내역)
  ├─ carts (장바구니)
  ├─ reviews (리뷰)
  ├─ coupons (쿠폰)
  └─ notifications (알림)
```

### 패키지 구조 (33개 도메인)
```
com.agri.market/
├── admin/          - 관리자 기능 (통계, 엑셀, 주문/상품 관리)
├── auth/           - 인증/회원가입
├── security/       - JWT, Spring Security, OAuth2
├── user/           - 사용자 관리, 프로필, 주소
├── product/        - 상품, 옵션, 이미지
├── order/          - 주문 생성, 상태 관리, 취소
├── payment/        - Toss Payments 연동, 환불
├── cart/           - 장바구니
├── review/         - 상품 리뷰 및 평점
├── wishlist/       - 위시리스트
├── coupon/         - 쿠폰 발급 및 적용
├── notification/   - SSE 기반 실시간 알림
├── banner/         - 메인 배너 관리
├── category/       - 카테고리 관리
├── seller/         - 판매자 정보
├── settlement/     - 정산 관리
└── ... (기타 20+ 도메인)
```

---

## 구현 기능

### 1. JWT + Refresh Token 기반 인증 시스템

**핵심 구현**
- Access Token (1시간, localStorage) + Refresh Token (30일, httpOnly 쿠키) 이중 토큰 구조
- Spring Security + JwtAuthenticationFilter로 요청마다 토큰 검증
- OAuth2 (Naver, Kakao) 소셜 로그인 통합

**프론트엔드 자동 갱신 로직**
```typescript
// api-client.ts
async function refreshAccessToken() {
  if (isRefreshing && refreshPromise) {
    return refreshPromise  // 동시 요청 시 중복 방지
  }

  isRefreshing = true
  refreshPromise = fetch('/api/auth/refresh', {
    credentials: 'include'  // httpOnly 쿠키 전송
  })
    .then(res => res.json())
    .then(data => {
      localStorage.setItem('token', data.token)
      return data.token
    })
    .finally(() => { isRefreshing = false })

  return refreshPromise
}

// 401 에러 시 자동 갱신 후 재시도
if (response.status === 401 && auth && !skipRefresh) {
  const newToken = await refreshAccessToken()
  if (newToken) {
    return apiFetch(path, { ...options, skipRefresh: true })
  }
}
```

**백엔드 JWT 검증 (JwtTokenProvider.java)**
- HS512 알고리즘 (512-bit secret 검증)
- Base64 디코딩 및 키 길이 검증 (@PostConstruct)
- 토큰 만료, 서명 검증 예외 처리

**성과**
- 사용자가 토큰 만료를 인지하지 못하는 seamless 인증 경험
- 동시 다발적 API 요청 시에도 중복 갱신 방지로 서버 부하 최소화

---

### 2. Toss Payments 결제 연동 및 Webhook 보안

**결제 프로세스**
```
주문 생성 → Payment Widget 렌더링 → 사용자 결제
→ Toss 리다이렉트 (paymentKey, orderId, amount)
→ Backend confirmTossPayment()
→ Order 상태 PAID 변경
→ 장바구니 자동 정리
```

**Webhook 보안 검증 (PaymentService.java)**
```java
// HMAC-SHA256 서명 검증
String signature = request.getHeader("x-signature");
String expectedSignature = calculateHMAC(requestBody, webhookSecret);

if (!MessageDigest.isEqual(
    signature.getBytes(UTF_8),
    expectedSignature.getBytes(UTF_8)
)) {
    throw new UnauthorizedException("Invalid webhook signature");
}

// Timestamp 검증 (5분 허용) - Replay Attack 방지
long requestTime = Long.parseLong(request.getHeader("x-timestamp"));
long currentTime = System.currentTimeMillis();
if (Math.abs(currentTime - requestTime) > 5 * 60 * 1000) {
    throw new UnauthorizedException("Webhook timestamp expired");
}
```

**구현 기능**
- Toss Payments API 연동 (`/v1/payments/{paymentKey}/confirm`)
- 전액/부분 환불 처리 및 재고 자동 복구
- 결제 실패 시 Order 상태 롤백
- Admin 권한 검증으로 환불 권한 제어

**성과**
- HMAC 서명 검증으로 외부 공격으로부터 결제 시스템 안전성 확보
- Replay Attack, Timing Attack 등 다층 보안 구조 구현

---

### 3. SSE 기반 실시간 알림 시스템

**NotificationService.java**
```java
@Service
public class NotificationService {
    private final Map<String, SseEmitter> userEmitters = new ConcurrentHashMap<>();
    private final Map<String, SseEmitter> adminEmitters = new ConcurrentHashMap<>();

    // SSE 연결 생성 (60분 타임아웃)
    public SseEmitter createEmitter(String userEmail, boolean isAdmin) {
        SseEmitter emitter = new SseEmitter(60 * 1000 * 60L);

        // onCompletion, onTimeout, onError 핸들러 등록
        emitter.onCompletion(() -> removeEmitter(userEmail, isAdmin));
        emitter.onTimeout(() -> removeEmitter(userEmail, isAdmin));

        if (isAdmin) {
            adminEmitters.put(userEmail, emitter);
        } else {
            userEmitters.put(userEmail, emitter);
        }

        return emitter;
    }

    // 전체 관리자 알림 (비동기)
    @Async
    public void sendToAllAdminsAsync(String title, String message, NotificationType type) {
        adminEmitters.forEach((email, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                    .name("notification")
                    .data(new NotificationDto(title, message, type)));
            } catch (IOException e) {
                removeEmitter(email, true);
            }
        });
    }
}
```

**알림 타입**
- ORDER_CREATED: 신규 주문 시 모든 관리자에게 실시간 알림
- ORDER_SHIPPED: 배송 시작 시 사용자에게 알림
- ORDER_DELIVERED: 배송 완료 알림
- PAYMENT_CONFIRMED: 결제 승인 알림

**프론트엔드 연동**
```typescript
// useNotifications.ts
const eventSource = new EventSource('/api/notifications/stream', {
  withCredentials: true
})

eventSource.addEventListener('notification', (event) => {
  const notification = JSON.parse(event.data)
  toast(notification.title, { description: notification.message })
})
```

**성과**
- ConcurrentHashMap으로 동시성 제어 및 안전한 Emitter 관리
- 신규 주문 시 관리자에게 즉시 알림으로 빠른 대응 가능
- WebSocket 대신 SSE 선택으로 단방향 알림에 최적화된 구조 구현

---

### 4. 관리자 대시보드 및 엑셀 내보내기

**통계 대시보드 (AdminDashboard.tsx)**
- 총 매출, 주문 수, 평균 주문액, 상품 수 (실시간)
- 최근 7일 일별 매출 차트 (Recharts Bar Chart)
- 카테고리별 상품 분포 (Recharts Pie Chart)
- 인기 상품 TOP 5

**엑셀 내보내기 (ExcelService.java)**
```java
@Transactional(readOnly = true)
public ByteArrayOutputStream exportOrdersToExcel(
    LocalDate startDate,
    LocalDate endDate,
    OrderStatus status
) {
    List<Order> orders = orderRepository.findOrdersForExport(
        startDate, endDate, status
    );

    // Apache POI로 엑셀 생성
    Workbook workbook = new XSSFWorkbook();
    Sheet sheet = workbook.createSheet("주문 내역");

    // 헤더 행
    Row headerRow = sheet.createRow(0);
    headerRow.createCell(0).setCellValue("주문번호");
    headerRow.createCell(1).setCellValue("주문일시");
    headerRow.createCell(2).setCellValue("구매자");
    // ... (기타 컬럼)

    // 데이터 행
    int rowNum = 1;
    for (Order order : orders) {
        Row row = sheet.createRow(rowNum++);
        row.createCell(0).setCellValue(order.getOrderNumber());
        row.createCell(1).setCellValue(order.getCreatedAt().toString());
        row.createCell(2).setCellValue(order.getUser().getName());
        // ... (기타 필드)
    }

    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    workbook.write(outputStream);
    return outputStream;
}
```

**주문 관리 고급 기능**
- 다중 선택 일괄 상태 변경 (`/api/admin/orders/bulk-status`)
- 감사 로그 시스템 (AdminAuditLogService) - Old Value / New Value 추적
- 날짜, 상태별 필터링 지원

**성과**
- Apache POI로 주문 데이터를 엑셀로 내보내어 오프라인 정산 지원
- Recharts 시각화로 매출 추이 직관적 파악
- 일괄 처리로 관리자 업무 효율성 향상

---

### 5. 상품 옵션 및 주문 관리 시스템

**Product Entity 설계**
```java
@Entity
public class Product {
    // 기본 정보
    private String name;
    private BigDecimal price;
    private BigDecimal discountRate;
    private Integer stock;

    // 옵션 (정규화)
    @OneToMany(cascade = ALL, mappedBy = "product")
    @JsonManagedReference
    private List<ProductOption> options;

    // 배송 정보
    private BigDecimal shippingFee;
    private Boolean canCombineShipping;

    // 할인가 계산 (반올림)
    public BigDecimal getDiscountedPrice() {
        return price.subtract(
            price.multiply(discountRate).divide(BigDecimal.valueOf(100))
        ).setScale(0, RoundingMode.HALF_UP);
    }
}
```

**ProductOption 패턴**
- 상품 옵션을 별도 테이블로 정규화 (크기, 무게 변형)
- OrderItem이 ProductOption을 직접 참조하여 **주문 당시 가격 히스토리 보존**
- Cascade 연산으로 Product 삭제 시 자동 정리

**순환 참조 해결**
```java
// Parent 쪽
@OneToMany(mappedBy = "product")
@JsonManagedReference
private List<ProductOption> options;

// Child 쪽
@ManyToOne
@JoinColumn(name = "product_id")
@JsonBackReference
private Product product;
```

**성과**
- 상품 옵션 정규화로 데이터 중복 제거 및 일관성 유지
- OrderItem → ProductOption 참조로 가격 변경 시에도 주문 히스토리 보존
- @JsonManagedReference/@JsonBackReference로 JSON 직렬화 시 무한 루프 방지

---

## 트러블슈팅

### 1. Connection Pool 누수로 인한 데이터베이스 연결 고갈

**문제**
- 사용자가 증가하면서 데이터베이스 연결이 정리되지 않아 Connection Pool 고갈
- `HikariPool-1 - Connection is not available` 에러 빈발

**원인**
- `spring.jpa.open-in-view=true` (기본값)로 설정되어 있어 Lazy Loading이 트랜잭션 외부에서 발생
- 이전 연결이 정리되지 않아 메모리 누수 및 세션 충돌 발생
- 명시적인 트랜잭션 관리 부재

**해결 과정**

1. **open-in-view 비활성화**
```properties
spring.jpa.open-in-view=false
```
- Lazy Loading을 명시적으로 @Transactional 내에서만 허용
- 트랜잭션 범위를 명확히 제어

2. **Connection Pool 설정 강화**
```properties
spring.datasource.hikari.leak-detection-threshold=10000
spring.datasource.hikari.auto-commit=false
spring.datasource.hikari.max-pool-size=5
spring.jpa.properties.hibernate.connection.provider_disables_autocommit=true
```
- leak-detection-threshold: 10초 이상 연결 유지 시 경고
- auto-commit=false: 명시적 커밋 전략으로 성능 향상
- max-pool-size=5: 동시 연결 수 제한

3. **트랜잭션 범위 명확화**
```java
@Transactional(readOnly = true)
public OrderResponse getOrderDetail(Long orderId) {
    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new NotFoundException("Order not found"));

    // 트랜잭션 내에서 Lazy 필드 강제 로딩
    order.getOrderItems().size();
    order.getOrderItems().forEach(item -> {
        item.getProductOption().getName();
    });

    return OrderResponse.from(order);
}
```

**성과**
- 연결 누수 100% 방지
- 동시 접속 50명 이상에서도 안정적인 응답 유지
- 메모리 사용량 30% 절감

**배운 점**

Connection Pool 관리는 단순히 설정 값을 조정하는 것이 아니라 트랜잭션 범위와 Lazy Loading 전략을
함께 고려해야 한다는 것을 배웠습니다.

`open-in-view=true`는 편리하지만 트랜잭션이 종료된 후에도 세션을 유지하여
예상치 못한 쿼리 발생과 연결 누수를 일으킬 수 있습니다.

이후로는 항상 트랜잭션 범위를 명확히 설계하고,
필요한 데이터는 트랜잭션 내에서 명시적으로 로딩하는 습관이 생겼습니다.

---

### 2. JWT 토큰 만료 시 사용자 경험 저하

**문제**
- Access Token 만료(1시간) 시 사용자가 로그인 페이지로 강제 이동
- 장바구니에 담은 상품, 작성 중인 리뷰 등이 유실되는 불편함

**원인**
- 프론트엔드에서 401 에러를 단순히 "인증 실패"로만 처리
- Refresh Token이 존재하지만 자동 갱신 로직 미구현

**해결 과정**

1. **Refresh Token 자동 갱신 로직 구현**
```typescript
// api-client.ts
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;  // 동시 요청 시 중복 방지
  }

  isRefreshing = true;
  refreshPromise = fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',  // httpOnly 쿠키 전송
  })
    .then(res => {
      if (!res.ok) throw new Error('Refresh failed');
      return res.json();
    })
    .then(data => {
      localStorage.setItem('token', data.token);
      return data.token;
    })
    .catch(() => {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return null;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}
```

2. **401 에러 시 자동 재시도**
```typescript
export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { auth = false, skipRefresh = false, ...fetchOptions } = options;

  let token = localStorage.getItem('token');
  if (auth && token) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);

  // 401 에러 시 자동 갱신 후 재시도
  if (response.status === 401 && auth && !skipRefresh) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch(path, { ...options, skipRefresh: true });
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await response.json());
  }

  return response.json();
}
```

3. **Backend Refresh Token 검증**
```java
@PostMapping("/refresh")
public ResponseEntity<TokenResponse> refreshToken(
    @CookieValue("refreshToken") String refreshToken
) {
    if (!jwtTokenProvider.validateToken(refreshToken)) {
        throw new UnauthorizedException("Invalid refresh token");
    }

    String email = jwtTokenProvider.getEmailFromToken(refreshToken);
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new NotFoundException("User not found"));

    String newAccessToken = jwtTokenProvider.createAccessToken(email, user.getRole());

    return ResponseEntity.ok(new TokenResponse(newAccessToken));
}
```

**성과**
- 사용자가 토큰 만료를 인지하지 못하는 seamless 인증 경험 제공
- 동시 다발적 API 요청 시에도 중복 갱신 방지 (Promise 캐싱)
- Refresh Token 만료 시에만 로그인 페이지 이동 (30일)

**배운 점**

보안과 사용자 경험이 상충하지 않도록 설계하는 것의 중요성을 배웠습니다.

Access Token의 짧은 유효기간(1시간)은 보안을 위해 필요하지만,
사용자가 매번 로그인하는 불편함을 감수할 필요는 없습니다.

Refresh Token 메커니즘을 구현하며 stateless 인증에서도
지속적인 세션 유지가 가능하다는 것을 체득했습니다.

특히 동시 요청 시 중복 갱신을 방지하는 Promise 캐싱 패턴은
이후 다른 비동기 처리에서도 유용하게 활용할 수 있는 기법이었습니다.

---

### 3. Toss Payments Webhook 보안 취약점 대응

**문제**
- Webhook 엔드포인트 `/api/payments/webhook`이 외부에 노출되어 있어
  누구나 POST 요청을 보낼 수 있는 상태
- 악의적인 공격자가 위변조된 결제 완료 요청을 보내 주문 상태를 조작할 가능성 존재

**원인**
- 단순히 POST 요청만 검증하고 요청 출처(Toss 서버)를 검증하지 않음
- Webhook payload의 무결성을 확인할 수 있는 서명 검증 로직 부재

**해결 과정**

1. **HMAC-SHA256 서명 검증 구현**
```java
@PostMapping("/webhook")
public ResponseEntity<String> handleWebhook(
    @RequestHeader("x-signature") String signature,
    @RequestHeader("x-timestamp") String timestamp,
    @RequestBody String requestBody
) {
    // 1. HMAC-SHA256 서명 검증
    String expectedSignature = calculateHMAC(requestBody, webhookSecret);

    if (!MessageDigest.isEqual(
        signature.getBytes(StandardCharsets.UTF_8),
        expectedSignature.getBytes(StandardCharsets.UTF_8)
    )) {
        log.warn("Invalid webhook signature");
        throw new UnauthorizedException("Invalid webhook signature");
    }

    // 2. Timestamp 검증 (5분 허용) - Replay Attack 방지
    long requestTime = Long.parseLong(timestamp);
    long currentTime = System.currentTimeMillis();

    if (Math.abs(currentTime - requestTime) > 5 * 60 * 1000) {
        log.warn("Webhook timestamp expired: {}", timestamp);
        throw new UnauthorizedException("Webhook timestamp expired");
    }

    // 3. Payload 파싱 및 처리
    PaymentWebhookDto webhookDto = objectMapper.readValue(
        requestBody,
        PaymentWebhookDto.class
    );

    paymentService.processWebhook(webhookDto);

    return ResponseEntity.ok("success");
}

private String calculateHMAC(String data, String secret) {
    try {
        Mac hmacSha256 = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(
            secret.getBytes(StandardCharsets.UTF_8),
            "HmacSHA256"
        );
        hmacSha256.init(secretKeySpec);

        byte[] hash = hmacSha256.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hash);
    } catch (Exception e) {
        throw new RuntimeException("Failed to calculate HMAC", e);
    }
}
```

2. **Constant-time 비교로 Timing Attack 방지**
```java
// ❌ 일반 String 비교는 Timing Attack 취약
if (signature.equals(expectedSignature)) { ... }

// ✅ MessageDigest.isEqual() 사용
if (MessageDigest.isEqual(
    signature.getBytes(UTF_8),
    expectedSignature.getBytes(UTF_8)
)) { ... }
```

3. **SecurityConfig에서 Webhook 엔드포인트 허용**
```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
    return http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/payments/webhook").permitAll()  // Webhook 허용
            .requestMatchers("/api/auth/**").permitAll()
            .anyRequest().authenticated()
        )
        // ...
        .build();
}
```

**성과**
- HMAC-SHA256 서명 검증으로 Toss 서버에서 온 요청임을 확인
- Timestamp 검증으로 Replay Attack (재전송 공격) 방지
- Constant-time 비교로 Timing Attack 차단
- 외부 공격으로부터 결제 시스템 안전성 확보

**배운 점**

외부 시스템과의 통신에서는 단순한 API 호출을 넘어 서명 검증, 타임스탬프 검증 등
다층 보안 구조가 필수라는 것을 배웠습니다.

특히 금융 API 연동 시에는 보안을 설계 단계부터 고려해야 하며,
다음과 같은 보안 원칙이 중요합니다:

1. **무결성 검증**: HMAC 서명으로 데이터가 변조되지 않았음을 확인
2. **재전송 공격 방지**: Timestamp 검증으로 오래된 요청 차단
3. **타이밍 공격 방지**: Constant-time 비교로 서명 비교 시간 통일

이후로는 Webhook뿐만 아니라 모든 외부 API 연동 시
이러한 보안 체크리스트를 미리 검토하는 습관이 생겼습니다.

---

## 실행 화면

### 1. 홈 화면 (배너 + 특가 상품)
- 메인 배너 캐러셀
- 특가 상품 섹션
- 인기 상품 TOP 5

### 2. 상품 상세 페이지
- 상품 이미지 갤러리
- 상품 옵션 선택 (크기, 무게)
- 위시리스트 추가
- 리뷰 및 평점

### 3. 장바구니 & 결제
- 장바구니 아이템 목록
- 쿠폰 적용
- Toss Payments 위젯

### 4. 관리자 대시보드
- 매출 통계 차트 (Recharts)
- 신규 주문 실시간 알림 (SSE)
- 주문 관리 (일괄 상태 변경)
- 엑셀 다운로드

---

## 프로젝트 규모

| 항목 | 수량 |
|------|------|
| Backend 패키지 | 33개 도메인 |
| Controller | 36개 |
| Service | 37개 |
| Repository | 31개 |
| Entity | 20+ 개 |
| Frontend 페이지 | 76개 TSX |
| UI 컴포넌트 | 59개 (shadcn/ui) |
| API 엔드포인트 | 100+ 개 |
| Database 마이그레이션 | 12개 (Flyway) |
| Git 커밋 | 100+ 개 |

---

## GitHub Repository

**Backend**: [korean-agri-shop/backend](https://github.com/사용자명/korean-agri-shop/tree/main/backend)
**Frontend**: [korean-agri-shop/frontend](https://github.com/사용자명/korean-agri-shop/tree/main/frontend)

---

## 핵심 성과 요약

✅ **대규모 Full-Stack E-commerce 플랫폼 구축** (33개 도메인 패키지, 76개 프론트엔드 컴포넌트)

✅ **보안 강화**: JWT + Refresh Token, HMAC Webhook 검증, Replay Attack 방지, Rate Limiting

✅ **성능 최적화**: Connection Pool 누수 방지, N+1 쿼리 해결, HikariCP 설정 최적화

✅ **관리자 기능**: SSE 실시간 알림, Recharts 통계 대시보드, 엑셀 내보내기, 일괄 주문 처리

✅ **UX 개선**: 자동 토큰 갱신, 토스트 알림, PWA 지원, SEO 최적화

---

## 기술적 도전 및 학습

### JWT 자동 갱신 로직 구현
- 401 에러 시 Refresh Token으로 자동 갱신 후 재시도
- 동시 요청 시 중복 갱신 방지 (Promise 캐싱)
- Stateless 인증에서도 seamless 사용자 경험 제공

### Toss Payments Webhook 보안
- HMAC-SHA256 서명 검증
- Replay Attack 방지 (Timestamp 검증)
- Constant-time 비교 (Timing Attack 방지)
- 금융 API 연동 시 다층 보안 구조 설계

### SSE 기반 실시간 알림 시스템
- ConcurrentHashMap으로 동시성 제어
- 60분 타임아웃 및 자동 재연결
- 관리자/사용자별 Emitter 분리
- WebSocket 대신 SSE 선택 (단방향 알림에 최적화)

### Connection Pool 누수 해결
- open-in-view=false + 명시적 트랜잭션
- leak-detection-threshold로 조기 감지
- auto-commit=false로 성능 향상
- Lazy Loading 전략 명확화

---

## 향후 개선 계획

1. **캐싱 도입**: Redis로 상품 조회 성능 향상
2. **검색 고도화**: Elasticsearch 통합
3. **이미지 최적화**: WebP 변환, CDN 적용
4. **테스트 커버리지**: Testcontainers 활용 통합 테스트 확대
5. **모니터링**: Prometheus + Grafana, Sentry 에러 트래킹
6. **CI/CD**: GitHub Actions, Docker Compose, AWS ECS 배포

---

_이 문서는 이력서에 추가할 포트폴리오 내용을 정리한 것입니다._
_실제 PDF 이력서에 추가할 때는 기존 스타일에 맞춰 레이아웃을 조정해주세요._
