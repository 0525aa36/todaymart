# Korean Agricultural Products E-commerce Platform - 시스템 아키텍처

## 1. Mermaid 다이어그램 (GitHub/Notion에서 렌더링 가능)

### 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph "Client Layer"
        User[👤 사용자]
        Admin[👤 관리자]
    end

    subgraph "Frontend Layer - Next.js 15 (Port 3000)"
        NextJS[Next.js App Router]
        Pages[Pages & Components]
        ApiClient[API Client<br/>JWT Auto-Refresh]
        SSEClient[SSE Event Listener]

        NextJS --> Pages
        Pages --> ApiClient
        Pages --> SSEClient
    end

    subgraph "Backend Layer - Spring Boot 3.5.7 (Port 8081)"
        Gateway[Spring MVC<br/>REST Controller]

        subgraph "Security"
            JwtFilter[JWT Authentication Filter]
            SecurityConfig[Spring Security Config]
            OAuth2[OAuth2 Client<br/>Naver, Kakao]
        end

        subgraph "Service Layer"
            UserService[User Service]
            ProductService[Product Service]
            OrderService[Order Service]
            PaymentService[Payment Service]
            CartService[Cart Service]
            NotificationService[Notification Service<br/>SSE]
            AdminService[Admin Service]
        end

        subgraph "Data Access"
            JPA[Spring Data JPA]
            QueryDSL[QueryDSL]
            HikariCP[HikariCP<br/>Connection Pool]
        end

        Gateway --> JwtFilter
        JwtFilter --> SecurityConfig
        SecurityConfig --> OAuth2
        Gateway --> UserService
        Gateway --> ProductService
        Gateway --> OrderService
        Gateway --> PaymentService
        Gateway --> CartService
        Gateway --> NotificationService
        Gateway --> AdminService

        UserService --> JPA
        ProductService --> JPA
        OrderService --> JPA
        PaymentService --> JPA
        CartService --> JPA
        AdminService --> QueryDSL

        JPA --> HikariCP
        QueryDSL --> HikariCP
    end

    subgraph "Database Layer"
        MySQL[(MySQL 8<br/>Database)]
        Flyway[Flyway Migration<br/>12 Versions]

        Flyway -.-> MySQL
    end

    subgraph "External Services"
        TossAPI[Toss Payments API<br/>결제 승인/취소]
        TossWebhook[Toss Webhook<br/>HMAC-SHA256 검증]
        S3[AWS S3<br/>파일 저장]
        SES[AWS SES<br/>이메일 발송]
        SecretsManager[AWS Secrets Manager<br/>환경변수 관리]
        NaverOAuth[Naver OAuth2]
        KakaoOAuth[Kakao OAuth2]
    end

    User --> NextJS
    Admin --> NextJS

    ApiClient -->|REST API<br/>JSON| Gateway
    SSEClient -->|Server-Sent Events| NotificationService

    HikariCP --> MySQL

    PaymentService -->|결제 요청/확인| TossAPI
    TossWebhook -->|Webhook 알림| PaymentService

    ProductService -->|이미지 업로드| S3
    NotificationService -->|이메일 발송| SES
    SecurityConfig -->|환경변수 조회| SecretsManager

    OAuth2 -->|소셜 로그인| NaverOAuth
    OAuth2 -->|소셜 로그인| KakaoOAuth

    style User fill:#e1f5ff
    style Admin fill:#ffe1e1
    style NextJS fill:#000,color:#fff
    style Gateway fill:#6db33f,color:#fff
    style MySQL fill:#4479a1,color:#fff
    style TossAPI fill:#3182f6,color:#fff
    style S3 fill:#ff9900,color:#fff
```

### 인증 플로우

```mermaid
sequenceDiagram
    participant User as 👤 사용자
    participant Frontend as Next.js
    participant Backend as Spring Boot
    participant JWT as JWT Provider
    participant DB as MySQL

    User->>Frontend: 로그인 요청
    Frontend->>Backend: POST /api/auth/login<br/>{email, password}
    Backend->>DB: 사용자 조회
    DB-->>Backend: User 정보
    Backend->>JWT: Access Token 생성 (1시간)
    Backend->>JWT: Refresh Token 생성 (30일)
    Backend-->>Frontend: {token, refreshToken}<br/>httpOnly Cookie
    Frontend->>Frontend: localStorage.setItem('token')

    Note over User,DB: 이후 API 요청

    Frontend->>Backend: GET /api/orders<br/>Authorization: Bearer <token>
    Backend->>JWT: 토큰 검증

    alt 토큰 유효
        Backend-->>Frontend: 200 OK, 주문 데이터
    else 토큰 만료 (401)
        Backend-->>Frontend: 401 Unauthorized
        Frontend->>Backend: POST /api/auth/refresh<br/>(Refresh Token in Cookie)
        Backend->>JWT: Refresh Token 검증
        Backend->>JWT: 새 Access Token 생성
        Backend-->>Frontend: {token}
        Frontend->>Frontend: localStorage.setItem('token')
        Frontend->>Backend: GET /api/orders (재시도)<br/>Authorization: Bearer <new_token>
        Backend-->>Frontend: 200 OK, 주문 데이터
    end
```

### 결제 플로우

```mermaid
sequenceDiagram
    participant User as 👤 사용자
    participant Frontend as Next.js
    participant Backend as Spring Boot
    participant Toss as Toss Payments API
    participant DB as MySQL

    User->>Frontend: 주문하기 클릭
    Frontend->>Backend: POST /api/orders<br/>{items, address, coupon}
    Backend->>DB: Order 생성 (PENDING_PAYMENT)
    DB-->>Backend: Order 저장 완료
    Backend-->>Frontend: {orderId, amount}

    Frontend->>Frontend: Toss Payment Widget 렌더링
    User->>Frontend: 결제 수단 선택 및 승인
    Frontend->>Toss: 결제 요청
    Toss-->>Frontend: Redirect with paymentKey

    Frontend->>Backend: POST /api/payments/confirm<br/>{paymentKey, orderId, amount}
    Backend->>Toss: POST /v1/payments/confirm
    Toss-->>Backend: 결제 승인 완료
    Backend->>DB: Order 상태 → PAID<br/>Cart 비우기
    Backend->>Backend: SSE 알림 전송 (관리자)
    Backend-->>Frontend: 200 OK

    Note over Toss,Backend: 비동기 Webhook
    Toss->>Backend: POST /api/payments/webhook<br/>x-signature: HMAC-SHA256<br/>x-timestamp: 1234567890
    Backend->>Backend: HMAC 서명 검증<br/>Timestamp 검증 (5분)
    Backend->>DB: Payment 상태 업데이트
    Backend-->>Toss: 200 OK
```

### SSE 실시간 알림 플로우

```mermaid
sequenceDiagram
    participant Admin as 👤 관리자
    participant Frontend as Next.js
    participant NotificationService as Notification Service
    participant User as 👤 사용자
    participant OrderService as Order Service

    Admin->>Frontend: 관리자 대시보드 접속
    Frontend->>NotificationService: GET /api/notifications/stream<br/>EventSource 연결
    NotificationService->>NotificationService: adminEmitters.put(email, emitter)
    NotificationService-->>Frontend: SSE 연결 성공 (60분 timeout)

    Note over User,OrderService: 신규 주문 발생

    User->>OrderService: 주문 생성
    OrderService->>OrderService: Order 저장
    OrderService->>NotificationService: sendToAllAdminsAsync()<br/>"신규 주문", ORDER_CREATED

    NotificationService->>NotificationService: adminEmitters.forEach()
    NotificationService-->>Frontend: SSE event: notification<br/>{title, message, type}
    Frontend->>Frontend: toast.success("신규 주문이 들어왔습니다")
    Frontend->>Admin: 🔔 알림 표시
```

---

## 2. ASCII 아트 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER                                 │
│                     👤 사용자          👤 관리자                          │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  │ HTTPS
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                    FRONTEND - Next.js 15 (Port 3000)                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Next.js App Router                                              │   │
│  │  ├─ app/                                                          │   │
│  │  │  ├─ page.tsx (홈)                                              │   │
│  │  │  ├─ product/[id]/ (상품 상세)                                  │   │
│  │  │  ├─ cart/ (장바구니)                                           │   │
│  │  │  ├─ checkout/ (주문)                                           │   │
│  │  │  ├─ payment/ (결제)                                            │   │
│  │  │  ├─ mypage/ (마이페이지)                                       │   │
│  │  │  └─ admin/ (관리자)                                            │   │
│  │  │                                                                 │   │
│  │  ├─ lib/api-client.ts (JWT Auto-Refresh)                         │   │
│  │  └─ hooks/useNotifications.ts (SSE Listener)                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  │ REST API (JSON)
                                  │ SSE (Server-Sent Events)
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│              BACKEND - Spring Boot 3.5.7 (Port 8081)                    │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                      SECURITY LAYER                             │    │
│  │  • JWT Authentication Filter                                    │    │
│  │  • Spring Security Config                                       │    │
│  │  • OAuth2 Client (Naver, Kakao)                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                     CONTROLLER LAYER                            │    │
│  │  • AuthController         • UserController                      │    │
│  │  • ProductController      • OrderController                     │    │
│  │  • PaymentController      • CartController                      │    │
│  │  • ReviewController       • AdminController                     │    │
│  │  • NotificationController (SSE)                                 │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                      SERVICE LAYER                              │    │
│  │  • UserService            • ProductService                      │    │
│  │  • OrderService           • PaymentService                      │    │
│  │  • CartService            • ReviewService                       │    │
│  │  • NotificationService    • AdminService                        │    │
│  │  • CouponService          • WishlistService                     │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                   DATA ACCESS LAYER                             │    │
│  │  • Spring Data JPA (Repository)                                 │    │
│  │  • QueryDSL (Complex Query)                                     │    │
│  │  • HikariCP Connection Pool (max 5, leak detection 10s)        │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  │ JDBC
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                    DATABASE - MySQL 8                                    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Tables (20+ tables)                                             │   │
│  │  • users                  • products                             │   │
│  │  • product_options        • product_images                       │   │
│  │  • orders                 • order_items                          │   │
│  │  • payments               • carts, cart_items                    │   │
│  │  • reviews                • wishlists                            │   │
│  │  • coupons                • notifications                        │   │
│  │  • banners, categories, sellers, etc.                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  Flyway Migration (12 versions)                                          │
└───────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                               │
│                                                                           │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   │
│  │ Toss Payments    │   │  AWS S3          │   │  AWS SES         │   │
│  │ • 결제 승인/취소  │   │  • 파일 저장      │   │  • 이메일 발송    │   │
│  │ • Webhook 알림   │   │  • 상품 이미지    │   │                  │   │
│  │ • HMAC 검증      │   │                  │   │                  │   │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘   │
│                                                                           │
│  ┌──────────────────┐   ┌──────────────────┐                           │
│  │ Naver OAuth2     │   │ Kakao OAuth2     │                           │
│  │ • 소셜 로그인     │   │ • 소셜 로그인     │                           │
│  └──────────────────┘   └──────────────────┘                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 데이터 플로우

### 주문 생성부터 결제까지

```
1. 사용자 → Frontend (Next.js)
   ├─ 상품 선택
   ├─ 장바구니 담기 (POST /api/carts)
   └─ 주문하기 클릭

2. Frontend → Backend (Spring Boot)
   ├─ POST /api/orders
   │  ├─ Authorization: Bearer <JWT>
   │  └─ Body: {items: [{productOptionId, quantity}], address, coupon}
   │
   └─ Backend 처리
      ├─ JWT 검증 (JwtAuthenticationFilter)
      ├─ User 조회
      ├─ ProductOption 재고 확인
      ├─ Coupon 유효성 검증
      ├─ Order 생성 (상태: PENDING_PAYMENT)
      ├─ OrderItem 생성 (각 상품 옵션별)
      └─ 응답: {orderId, amount}

3. Frontend → Toss Payments
   ├─ Payment Widget 렌더링
   ├─ 사용자 결제 수단 선택
   └─ Toss 서버로 결제 요청

4. Toss → Frontend (Redirect)
   └─ ?paymentKey=xxx&orderId=xxx&amount=xxx

5. Frontend → Backend
   ├─ POST /api/payments/confirm
   │  └─ Body: {paymentKey, orderId, amount}
   │
   └─ Backend 처리
      ├─ Order 조회 및 금액 검증
      ├─ Toss API 호출 (결제 승인 확인)
      │  └─ POST https://api.tosspayments.com/v1/payments/confirm
      ├─ Order 상태 → PAID
      ├─ Payment 레코드 생성
      ├─ Cart 비우기
      ├─ SSE 알림 (관리자에게 "신규 주문")
      └─ 응답: 200 OK

6. Toss → Backend (Webhook, 비동기)
   ├─ POST /api/payments/webhook
   │  ├─ x-signature: HMAC-SHA256 서명
   │  └─ x-timestamp: 타임스탬프
   │
   └─ Backend 처리
      ├─ HMAC 서명 검증
      ├─ Timestamp 검증 (5분 이내)
      ├─ Payment 상태 업데이트
      └─ 응답: 200 OK
```

---

## 4. 기술 스택 계층별 정리

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  Next.js 15.2.4, React 19, TypeScript, Tailwind CSS             │
│  shadcn/ui (Radix UI), Recharts, React Hook Form + Zod         │
└─────────────────────────────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                         │
│  Spring Boot 3.5.7, Java 21                                     │
│  Spring Security, JWT (HS512), OAuth2                           │
│  Spring Data JPA, QueryDSL, HikariCP                            │
│  Resilience4j (Rate Limiting)                                   │
└─────────────────────────────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PERSISTENCE LAYER                         │
│  MySQL 8, Flyway Migration                                      │
│  20+ Tables, 12 Versions                                        │
└─────────────────────────────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE LAYER                      │
│  AWS S3 (파일 저장), AWS SES (이메일), AWS Secrets Manager      │
│  Toss Payments API (결제), Docker, Git                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. 보안 계층

```
┌──────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                            │
│                                                                   │
│  Layer 1: Transport Security                                      │
│  └─ HTTPS (TLS 1.2+)                                             │
│                                                                   │
│  Layer 2: Authentication                                          │
│  ├─ JWT (HS512, 512-bit secret)                                  │
│  │  ├─ Access Token: 1시간 (localStorage)                        │
│  │  └─ Refresh Token: 30일 (httpOnly Cookie)                     │
│  └─ OAuth2 (Naver, Kakao)                                        │
│                                                                   │
│  Layer 3: Authorization                                           │
│  ├─ Spring Security FilterChain                                  │
│  ├─ Role-based Access Control (USER, ADMIN)                      │
│  └─ Method-level @PreAuthorize                                   │
│                                                                   │
│  Layer 4: API Security                                            │
│  ├─ Rate Limiting (Resilience4j)                                 │
│  │  ├─ /api/auth: 5 req/min                                      │
│  │  ├─ /api/payment: 10 req/min                                  │
│  │  └─ /api/search: 100 req/min                                  │
│  └─ CORS (환경변수 기반 origins)                                  │
│                                                                   │
│  Layer 5: Payment Security                                        │
│  ├─ HMAC-SHA256 서명 검증 (Webhook)                              │
│  ├─ Timestamp 검증 (5분, Replay Attack 방지)                     │
│  └─ Constant-time 비교 (Timing Attack 방지)                      │
│                                                                   │
│  Layer 6: Database Security                                       │
│  ├─ Connection Pool 관리 (leak detection)                        │
│  ├─ Prepared Statement (SQL Injection 방지)                      │
│  └─ Password Hashing (BCrypt)                                    │
└───────────────────────────────────────────────────────────────────┘
```

---

## 6. 성능 최적화 전략

```
┌──────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE OPTIMIZATION                       │
│                                                                   │
│  Frontend:                                                        │
│  ├─ Server Components (Next.js) - 초기 로딩 속도 향상             │
│  ├─ API Response Caching (SWR 패턴)                              │
│  ├─ Image Optimization (next/image)                              │
│  └─ Code Splitting (Dynamic Import)                              │
│                                                                   │
│  Backend:                                                         │
│  ├─ Connection Pool 최적화                                        │
│  │  ├─ HikariCP max-pool-size: 5                                │
│  │  ├─ leak-detection: 10s                                       │
│  │  └─ auto-commit: false                                        │
│  │                                                                │
│  ├─ Query 최적화                                                  │
│  │  ├─ QueryDSL fetch join (N+1 방지)                           │
│  │  ├─ DTO Projection (불필요한 필드 제외)                        │
│  │  ├─ Hibernate Batch Fetching (batch_size=10)                 │
│  │  └─ @Transactional(readOnly=true)                            │
│  │                                                                │
│  ├─ Lazy Loading 전략                                             │
│  │  └─ open-in-view=false (명시적 트랜잭션)                      │
│  │                                                                │
│  └─ 비동기 처리                                                   │
│     ├─ @Async (SSE 알림)                                         │
│     └─ @Scheduled (크롤러)                                       │
│                                                                   │
│  Database:                                                        │
│  ├─ Index 최적화 (V12 migration)                                 │
│  ├─ 복합 인덱스 (user_id + created_at)                            │
│  └─ 쿼리 실행 계획 분석 (EXPLAIN)                                 │
└───────────────────────────────────────────────────────────────────┘
```

---

_이 아키텍처 문서는 이력서 포트폴리오에 포함될 시스템 구조를 시각화한 것입니다._
