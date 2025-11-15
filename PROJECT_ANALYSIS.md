# 프로젝트 종합 분석 보고서

**분석 날짜**: 2025-11-15
**프로젝트**: Korean Agricultural Products E-commerce Platform
**버전**: Current (Post Refresh Token Implementation)

---

## 📋 목차

1. [개요](#개요)
2. [보안 취약점](#보안-취약점)
3. [성능 최적화](#성능-최적화)
4. [사용자 경험 개선](#사용자-경험-개선)
5. [비즈니스 기능](#비즈니스-기능)
6. [운영 및 모니터링](#운영-및-모니터링)
7. [테스트 및 품질](#테스트-및-품질)
8. [인프라 및 배포](#인프라-및-배포)
9. [우선순위 로드맵](#우선순위-로드맵)

---

## 개요

### 현재 프로젝트 상태

**강점**:
- ✅ 리프레시 토큰 시스템 완전 구현 (Access Token 1시간 + Refresh Token 30일)
- ✅ JWT 기반 Stateless 인증 with httpOnly 쿠키
- ✅ OAuth2 소셜 로그인 (네이버, 카카오, 구글)
- ✅ 상품 옵션 시스템 (크기/무게 변형)
- ✅ Toss Payments 결제 연동
- ✅ 크롤러 시스템 (onong.co.kr)
- ✅ 관리자 대시보드 with Excel 내보내기
- ✅ SSE 기반 실시간 알림

**개선 필요 영역**:
- ⚠️ 프로덕션 보안 설정 (Cookie Secure 플래그, HTTPS)
- ⚠️ 데이터베이스 인덱스 최적화
- ⚠️ 에러 처리 및 사용자 피드백
- ⚠️ 재고 관리 시스템 부재
- ⚠️ 통합 테스트 커버리지 부족
- ⚠️ 로깅 및 모니터링 체계 미흡

---

## 보안 취약점

### 1. 🔴 CRITICAL: 프로덕션 쿠키 보안 설정

**문제점**:
현재 모든 환경에서 `Secure=false`로 설정되어 있어, HTTPS 환경에서도 HTTP로 쿠키가 전송될 수 있습니다.

**현재 코드** (`AuthController.java:72`):
```java
refreshTokenCookie.setSecure(false); // 로컬 개발 환경에서는 false, 프로덕션에서는 true
```

**해결책**:
환경 변수를 사용하여 동적으로 설정:

```java
// SecurityConfig.java
@Value("${app.cookie.secure:false}")
private boolean cookieSecure;

// AuthController.java
refreshTokenCookie.setSecure(cookieSecure);
```

**application.properties**:
```properties
# 로컬 개발 환경
app.cookie.secure=false

# 프로덕션 환경 (환경 변수로 오버라이드)
# APP_COOKIE_SECURE=true
```

**우선순위**: CRITICAL
**예상 작업 시간**: 30분

---

### 2. 🟡 MEDIUM: 토큰 블랙리스트 시스템 부재

**문제점**:
액세스 토큰은 만료 전까지 서버에서 무효화할 방법이 없습니다. 로그아웃 시 리프레시 토큰만 삭제되며, 액세스 토큰은 1시간 동안 유효합니다.

**보안 시나리오**:
1. 사용자가 로그아웃
2. 리프레시 토큰은 DB에서 삭제됨
3. 그러나 액세스 토큰은 1시간 동안 여전히 유효
4. 공격자가 액세스 토큰을 탈취했다면 계속 사용 가능

**해결책**:
Redis 기반 토큰 블랙리스트 구현:

```java
// RedisTokenBlacklistService.java
@Service
public class RedisTokenBlacklistService {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    public void blacklistToken(String token, long expirationMs) {
        String key = "blacklist:token:" + token;
        redisTemplate.opsForValue().set(
            key,
            "revoked",
            expirationMs,
            TimeUnit.MILLISECONDS
        );
    }

    public boolean isBlacklisted(String token) {
        String key = "blacklist:token:" + token;
        return redisTemplate.hasKey(key);
    }
}

// JwtAuthenticationFilter.java 수정
@Override
protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain) {
    String jwt = parseJwt(request);

    if (jwt != null && jwtTokenProvider.validateToken(jwt)) {
        // 블랙리스트 체크 추가
        if (tokenBlacklistService.isBlacklisted(jwt)) {
            logger.warn("Blacklisted token attempted: {}", jwt);
            filterChain.doFilter(request, response);
            return;
        }

        // ... 기존 인증 로직
    }
}

// AuthService.java - 로그아웃 시 액세스 토큰도 블랙리스트 추가
public void logout(String accessToken, String refreshToken) {
    // 리프레시 토큰 삭제 (기존)
    refreshTokenService.revokeRefreshToken(refreshToken);

    // 액세스 토큰 블랙리스트 추가 (신규)
    long remainingTime = jwtTokenProvider.getRemainingExpiration(accessToken);
    tokenBlacklistService.blacklistToken(accessToken, remainingTime);
}
```

**의존성 추가** (`build.gradle`):
```gradle
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
```

**우선순위**: MEDIUM
**예상 작업 시간**: 3시간

---

### 3. 🟡 MEDIUM: 비밀번호 정책 강화

**문제점**:
현재 비밀번호에 대한 복잡도 검증이 없습니다.

**현재 코드** (`RegisterRequest.java`):
```java
@NotBlank(message = "비밀번호는 필수입니다.")
@Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
private String password;
```

**해결책**:
정규식 기반 비밀번호 복잡도 검증:

```java
@NotBlank(message = "비밀번호는 필수입니다.")
@Size(min = 8, max = 100, message = "비밀번호는 8자 이상 100자 이하여야 합니다.")
@Pattern(
    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
    message = "비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 이상 포함해야 합니다."
)
private String password;
```

**프론트엔드 검증** (`frontend/app/register/page.tsx`):
```typescript
const passwordSchema = z.string()
  .min(8, "비밀번호는 최소 8자 이상이어야 합니다.")
  .max(100, "비밀번호는 100자 이하여야 합니다.")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    "대문자, 소문자, 숫자, 특수문자를 각각 포함해야 합니다.")
```

**우선순위**: MEDIUM
**예상 작업 시간**: 1시간

---

### 4. 🟢 LOW: CORS 설정 세분화

**문제점**:
프로덕션 환경에서도 모든 로컬호스트 포트가 허용될 수 있습니다.

**현재 코드** (`SecurityConfig.java`):
```java
@Value("${cors.allowed.origins:http://localhost:3000}")
private String allowedOrigins;
```

**해결책**:
프로파일별 CORS 설정:

```java
@Configuration
public class SecurityConfig {

    @Value("${cors.allowed.origins}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 환경 변수에서 읽어온 도메인 리스트 사용
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOrigins(origins);

        // ... 나머지 설정
    }
}
```

**application-prod.properties**:
```properties
cors.allowed.origins=https://todaymart.co.kr,https://www.todaymart.co.kr
```

**우선순위**: LOW
**예상 작업 시간**: 30분

---

### 5. 🟡 MEDIUM: 결제 웹훅 보안 강화

**문제점**:
웹훅 서명 검증이 구현되어 있지만, 재전송 공격(Replay Attack) 방어가 없습니다.

**현재 코드** (`PaymentService.java`):
```java
public boolean verifyWebhookSignature(String signature, String requestBody) {
    String expectedSignature = calculateHmacSha256(requestBody, webhookSecret);
    return signature.equals(expectedSignature);
}
```

**해결책**:
타임스탬프 검증 추가:

```java
public boolean verifyWebhookSignature(String signature,
                                        String timestamp,
                                        String requestBody) {
    // 1. 타임스탬프 검증 (5분 이내만 허용)
    long requestTime = Long.parseLong(timestamp);
    long currentTime = System.currentTimeMillis() / 1000;
    if (Math.abs(currentTime - requestTime) > 300) {
        logger.warn("Webhook timestamp too old: {}", timestamp);
        return false;
    }

    // 2. 서명 검증
    String payload = timestamp + "." + requestBody;
    String expectedSignature = calculateHmacSha256(payload, webhookSecret);
    return signature.equals(expectedSignature);
}

// 웹훅 ID 중복 체크 (Redis)
@Autowired
private RedisTemplate<String, String> redisTemplate;

public boolean isWebhookProcessed(String webhookId) {
    String key = "webhook:processed:" + webhookId;
    Boolean exists = redisTemplate.hasKey(key);

    if (exists) {
        return true; // 이미 처리됨
    }

    // 처리 완료 마크 (24시간 TTL)
    redisTemplate.opsForValue().set(key, "processed", 24, TimeUnit.HOURS);
    return false;
}
```

**우선순위**: MEDIUM
**예상 작업 시간**: 2시간

---

## 성능 최적화

### 1. 🔴 CRITICAL: 데이터베이스 인덱스 추가

**문제점**:
자주 조회되는 컬럼에 인덱스가 없어 성능 저하가 발생합니다.

**분석**:
- `users.email` - 로그인, 사용자 조회 시 매번 사용
- `refresh_tokens.token` - 토큰 갱신 시 매번 조회
- `orders.user_id` - 주문 내역 조회 시 사용
- `products.category` - 카테고리별 상품 조회 시 사용
- `order_items.order_id` - 주문 상세 조회 시 사용

**해결책**:
인덱스 추가 마이그레이션:

```sql
-- V1__add_performance_indexes.sql

-- 사용자 이메일 조회 최적화 (로그인)
CREATE INDEX idx_users_email ON users(email);

-- 리프레시 토큰 조회 최적화
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- 주문 조회 최적화
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- 주문 상세 조회 최적화
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 상품 조회 최적화
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- 리뷰 조회 최적화
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- 복합 인덱스: 사용자별 주문 상태 조회
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- 전문 검색 인덱스 (상품명, 설명)
CREATE FULLTEXT INDEX idx_products_search ON products(name, description);
```

**성능 개선 예상**:
- 로그인 쿼리: ~100ms → ~5ms (20배 개선)
- 주문 내역 조회: ~50ms → ~3ms (16배 개선)
- 상품 검색: ~200ms → ~10ms (20배 개선)

**우선순위**: CRITICAL
**예상 작업 시간**: 1시간

---

### 2. 🟡 MEDIUM: N+1 쿼리 문제 해결

**문제점**:
주문 상세 조회 시 OrderItem, Product, ProductOption을 각각 조회하여 N+1 문제 발생.

**현재 코드** (`OrderService.java`):
```java
public Order getOrderById(Long orderId) {
    return orderRepository.findById(orderId)
        .orElseThrow(() -> new RuntimeException("주문을 찾을 수 없습니다."));
}
// OrderItem → Product → ProductOption 각각 lazy loading
```

**해결책**:
Fetch Join 사용:

```java
// OrderRepository.java
@Query("SELECT DISTINCT o FROM Order o " +
       "LEFT JOIN FETCH o.orderItems oi " +
       "LEFT JOIN FETCH oi.productOption po " +
       "LEFT JOIN FETCH po.product p " +
       "WHERE o.id = :orderId")
Optional<Order> findByIdWithItems(@Param("orderId") Long orderId);

// OrderService.java
public Order getOrderById(Long orderId) {
    return orderRepository.findByIdWithItems(orderId)
        .orElseThrow(() -> new RuntimeException("주문을 찾을 수 없습니다."));
}
```

**성능 개선 예상**:
- 10개 아이템 주문: 21개 쿼리 → 1개 쿼리 (21배 개선)

**우선순위**: MEDIUM
**예상 작업 시간**: 2시간

---

### 3. 🟡 MEDIUM: Redis 캐싱 전략

**문제점**:
자주 조회되지만 변경이 적은 데이터(상품 목록, 카테고리 등)를 매번 DB에서 조회합니다.

**해결책**:
Redis 캐시 적용:

```java
// CacheConfig.java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10)) // 기본 TTL 10분
            .serializeValuesWith(
                SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer())
            );

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // 상품 목록: 5분 TTL
        cacheConfigurations.put("products",
            config.entryTtl(Duration.ofMinutes(5)));

        // 상품 상세: 10분 TTL
        cacheConfigurations.put("productDetail",
            config.entryTtl(Duration.ofMinutes(10)));

        // 사용자 정보: 30분 TTL
        cacheConfigurations.put("users",
            config.entryTtl(Duration.ofMinutes(30)));

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(config)
            .withInitialCacheConfigurations(cacheConfigurations)
            .build();
    }
}

// ProductService.java
@Cacheable(value = "products", key = "#page + '-' + #size + '-' + #category")
public Page<Product> getProducts(int page, int size, String category) {
    // ... 기존 로직
}

@Cacheable(value = "productDetail", key = "#id")
public Product getProductById(Long id) {
    // ... 기존 로직
}

@CacheEvict(value = {"products", "productDetail"}, allEntries = true)
public Product updateProduct(Long id, ProductRequest request) {
    // 상품 수정 시 캐시 삭제
}
```

**성능 개선 예상**:
- 상품 목록 조회: ~30ms → ~2ms (15배 개선)
- DB 부하: 70% 감소

**우선순위**: MEDIUM
**예상 작업 시간**: 4시간

---

### 4. 🟢 LOW: 프론트엔드 최적화

**문제점**:
- 이미지 최적화 미흡
- 코드 스플리팅 부족
- 번들 크기 최적화 필요

**해결책**:

**A. Next.js Image 컴포넌트 사용**:
```typescript
// Before
<img src={product.imageUrl} alt={product.name} />

// After
import Image from 'next/image'

<Image
  src={product.imageUrl}
  alt={product.name}
  width={400}
  height={400}
  placeholder="blur"
  blurDataURL="/placeholder.jpg"
  loading="lazy"
/>
```

**B. 동적 임포트로 코드 스플리팅**:
```typescript
// Before
import { Chart } from '@/components/chart'

// After
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('@/components/chart'), {
  loading: () => <div>Loading...</div>,
  ssr: false
})
```

**C. 번들 분석 및 최적화**:
```bash
# 번들 분석
pnpm add -D @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... 기존 설정
})

# 실행
ANALYZE=true pnpm build
```

**우선순위**: LOW
**예상 작업 시간**: 3시간

---

### 5. 🟡 MEDIUM: 데이터베이스 커넥션 풀 튜닝

**현재 설정** (`application.properties`):
```properties
spring.datasource.hikari.maximum-pool-size=5
spring.datasource.hikari.leak-detection-threshold=10000
```

**문제점**:
- 최대 커넥션 수가 5개로 제한되어 동시 사용자 증가 시 병목 발생 가능
- Leak detection 임계값이 10초로 너무 길어 조기 발견 어려움

**해결책**:
```properties
# HikariCP 설정 최적화
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.leak-detection-threshold=5000
spring.datasource.hikari.connection-test-query=SELECT 1

# 커넥션 풀 모니터링
spring.datasource.hikari.register-mbeans=true
```

**권장 커넥션 수 계산**:
```
connections = ((core_count * 2) + effective_spindle_count)
```

**우선순위**: MEDIUM
**예상 작업 시간**: 30분

---

## 사용자 경험 개선

### 1. 🟡 MEDIUM: 에러 메시지 사용자 친화적 개선

**문제점**:
기술적 에러 메시지가 사용자에게 그대로 노출됩니다.

**현재 코드** (`api-client.ts:38`):
```typescript
if (!response.ok) {
  const errorText = await response.text()
  throw new ApiError(response.status, errorText)
}
```

**해결책**:
사용자 친화적 에러 메시지 매핑:

```typescript
// lib/error-messages.ts
export const ERROR_MESSAGES: Record<number, string> = {
  400: '잘못된 요청입니다. 입력하신 정보를 확인해주세요.',
  401: '로그인이 필요한 서비스입니다.',
  403: '접근 권한이 없습니다.',
  404: '요청하신 정보를 찾을 수 없습니다.',
  409: '이미 존재하는 정보입니다.',
  422: '입력하신 정보가 올바르지 않습니다.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  502: '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
  503: '서비스 점검 중입니다. 잠시 후 다시 시도해주세요.',
}

// 특정 에러 메시지 매핑
export const SPECIFIC_ERROR_MESSAGES: Record<string, string> = {
  'User already exists': '이미 가입된 이메일입니다.',
  'Invalid credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'Insufficient stock': '재고가 부족합니다.',
  'Payment failed': '결제에 실패했습니다. 다시 시도해주세요.',
}

// api-client.ts
export function getUserFriendlyError(status: number, serverMessage: string): string {
  // 1. 서버 메시지 기반 매칭
  const specificError = SPECIFIC_ERROR_MESSAGES[serverMessage]
  if (specificError) return specificError

  // 2. 상태 코드 기반 매칭
  return ERROR_MESSAGES[status] || '알 수 없는 오류가 발생했습니다.'
}
```

**백엔드 에러 응답 표준화** (`GlobalExceptionHandler.java`):
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleUserAlreadyExists(UserAlreadyExistsException e) {
        ErrorResponse response = ErrorResponse.builder()
            .status(409)
            .error("CONFLICT")
            .message("User already exists")
            .userMessage("이미 가입된 이메일입니다.")
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.status(409).body(response);
    }

    // ... 다른 예외 핸들러
}

@Data
@Builder
public class ErrorResponse {
    private int status;
    private String error;
    private String message;      // 개발자용 메시지
    private String userMessage;  // 사용자용 메시지
    private LocalDateTime timestamp;
    private Map<String, String> details;
}
```

**우선순위**: MEDIUM
**예상 작업 시간**: 3시간

---

### 2. 🟢 LOW: 로딩 상태 및 스켈레톤 UI

**문제점**:
데이터 로딩 중 빈 화면이 표시되어 사용자 경험 저하.

**해결책**:
스켈레톤 UI 구현:

```typescript
// components/skeleton/product-card-skeleton.tsx
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  )
}

// app/page.tsx
import { Suspense } from 'react'
import { ProductCardSkeleton } from '@/components/skeleton/product-card-skeleton'

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    }>
      <ProductList />
    </Suspense>
  )
}
```

**우선순위**: LOW
**예상 작업 시간**: 2시간

---

### 3. 🟢 LOW: 편의 기능 추가

**A. 최근 본 상품**:
```typescript
// lib/recent-products.ts
export function addRecentProduct(productId: number) {
  const recent = getRecentProducts()
  const updated = [productId, ...recent.filter(id => id !== productId)].slice(0, 10)
  localStorage.setItem('recentProducts', JSON.stringify(updated))
}

export function getRecentProducts(): number[] {
  const data = localStorage.getItem('recentProducts')
  return data ? JSON.parse(data) : []
}
```

**B. 상품 비교 기능**:
```typescript
// 최대 3개 상품 비교
export function CompareProducts() {
  const [compareList, setCompareList] = useState<Product[]>([])

  return (
    <div className="compare-panel">
      {compareList.map(product => (
        <div key={product.id} className="compare-item">
          <h3>{product.name}</h3>
          <p>가격: {product.price}원</p>
          <p>평점: {product.rating}점</p>
        </div>
      ))}
    </div>
  )
}
```

**C. 주문 배송 추적**:
```java
// Order.java
@Column(name = "tracking_number")
private String trackingNumber;

@Column(name = "courier_company")
private String courierCompany;

// 배송 조회 API 연동 (CJ대한통운, 우체국 등)
```

**우선순위**: LOW
**예상 작업 시간**: 각 기능당 2시간

---

## 비즈니스 기능

### 1. 🔴 CRITICAL: 재고 관리 시스템

**문제점**:
현재 재고 관리 기능이 없어 품절 상품 주문 가능.

**해결책**:
재고 추적 시스템 구현:

```java
// Product.java
@Column(name = "stock_quantity")
private Integer stockQuantity = 0;

@Column(name = "low_stock_threshold")
private Integer lowStockThreshold = 10;

public boolean isInStock() {
    return stockQuantity != null && stockQuantity > 0;
}

public boolean isLowStock() {
    return stockQuantity != null && stockQuantity <= lowStockThreshold;
}

// ProductOption.java
@Column(name = "stock_quantity")
private Integer stockQuantity = 0;

// InventoryService.java
@Service
@Transactional
public class InventoryService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductOptionRepository productOptionRepository;

    /**
     * 재고 차감 (동시성 제어)
     */
    public void decreaseStock(Long productOptionId, int quantity) {
        ProductOption option = productOptionRepository
            .findByIdWithLock(productOptionId)
            .orElseThrow(() -> new RuntimeException("상품 옵션을 찾을 수 없습니다."));

        if (option.getStockQuantity() < quantity) {
            throw new InsufficientStockException(
                String.format("재고 부족: 요청 %d개, 재고 %d개",
                    quantity, option.getStockQuantity())
            );
        }

        option.setStockQuantity(option.getStockQuantity() - quantity);
        productOptionRepository.save(option);
    }

    /**
     * 재고 복구 (주문 취소 시)
     */
    public void increaseStock(Long productOptionId, int quantity) {
        ProductOption option = productOptionRepository.findById(productOptionId)
            .orElseThrow(() -> new RuntimeException("상품 옵션을 찾을 수 없습니다."));

        option.setStockQuantity(option.getStockQuantity() + quantity);
        productOptionRepository.save(option);
    }
}

// ProductOptionRepository.java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT po FROM ProductOption po WHERE po.id = :id")
Optional<ProductOption> findByIdWithLock(@Param("id") Long id);

// OrderService.java
public Order createOrder(OrderRequest request) {
    // 재고 검증 및 차감
    for (OrderItemRequest item : request.getOrderItems()) {
        inventoryService.decreaseStock(item.getProductOptionId(), item.getQuantity());
    }

    // 주문 생성
    Order order = new Order();
    // ... 주문 로직

    return orderRepository.save(order);
}

// 주문 취소 시 재고 복구
public void cancelOrder(Long orderId) {
    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new RuntimeException("주문을 찾을 수 없습니다."));

    for (OrderItem item : order.getOrderItems()) {
        inventoryService.increaseStock(
            item.getProductOption().getId(),
            item.getQuantity()
        );
    }

    order.setStatus(OrderStatus.CANCELLED);
    orderRepository.save(order);
}
```

**프론트엔드 재고 표시**:
```typescript
// components/product-card.tsx
<div className="stock-indicator">
  {product.stockQuantity === 0 ? (
    <span className="text-red-500">품절</span>
  ) : product.stockQuantity <= product.lowStockThreshold ? (
    <span className="text-orange-500">재고 {product.stockQuantity}개</span>
  ) : (
    <span className="text-green-500">재고 있음</span>
  )}
</div>
```

**관리자 대시보드 - 재고 알림**:
```java
// AdminController.java
@GetMapping("/inventory/low-stock")
public ResponseEntity<?> getLowStockProducts() {
    List<Product> lowStockProducts = productRepository
        .findByStockQuantityLessThanEqual(10);

    return ResponseEntity.ok(lowStockProducts);
}
```

**우선순위**: CRITICAL
**예상 작업 시간**: 8시간

---

### 2. 🟡 MEDIUM: 쿠폰 및 할인 시스템

**해결책**:
```java
// Coupon.java
@Entity
@Table(name = "coupons")
@Getter
@Setter
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code; // 쿠폰 코드

    @Enumerated(EnumType.STRING)
    private CouponType type; // PERCENTAGE, FIXED_AMOUNT

    private BigDecimal discountValue; // 할인 금액 또는 비율

    private BigDecimal minOrderAmount; // 최소 주문 금액

    private BigDecimal maxDiscountAmount; // 최대 할인 금액

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDateTime endDate;

    private Integer usageLimit; // 전체 사용 제한

    private Integer usageLimitPerUser; // 사용자당 사용 제한

    @Column(nullable = false)
    private Boolean active = true;

    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return active && now.isAfter(startDate) && now.isBefore(endDate);
    }
}

// UserCoupon.java (사용자별 쿠폰 사용 이력)
@Entity
@Table(name = "user_coupons")
public class UserCoupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    @Column(nullable = false)
    private LocalDateTime usedAt;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;
}

// CouponService.java
@Service
public class CouponService {

    public BigDecimal calculateDiscount(String couponCode, BigDecimal orderAmount) {
        Coupon coupon = couponRepository.findByCode(couponCode)
            .orElseThrow(() -> new CouponNotFoundException("쿠폰을 찾을 수 없습니다."));

        if (!coupon.isValid()) {
            throw new InvalidCouponException("유효하지 않은 쿠폰입니다.");
        }

        if (orderAmount.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new InvalidCouponException(
                String.format("최소 주문 금액 %s원 이상부터 사용 가능합니다.",
                    coupon.getMinOrderAmount())
            );
        }

        BigDecimal discount;
        if (coupon.getType() == CouponType.PERCENTAGE) {
            discount = orderAmount.multiply(coupon.getDiscountValue())
                .divide(BigDecimal.valueOf(100));

            if (coupon.getMaxDiscountAmount() != null
                && discount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                discount = coupon.getMaxDiscountAmount();
            }
        } else {
            discount = coupon.getDiscountValue();
        }

        return discount;
    }
}

// Order.java 수정
@ManyToOne
@JoinColumn(name = "coupon_id")
private Coupon appliedCoupon;

@Column(name = "discount_amount")
private BigDecimal discountAmount;
```

**우선순위**: MEDIUM
**예상 작업 시간**: 10시간

---

### 3. 🟡 MEDIUM: 정산 시스템 자동화

**문제점**:
관리자가 수동으로 정산 작업 수행.

**해결책**:
```java
// Settlement.java
@Entity
@Table(name = "settlements")
public class Settlement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate settlementDate; // 정산 날짜

    private BigDecimal totalSales; // 총 매출

    private BigDecimal totalRefunds; // 총 환불

    private BigDecimal platformFee; // 플랫폼 수수료

    private BigDecimal paymentFee; // 결제 수수료

    private BigDecimal netAmount; // 순 정산액

    @Enumerated(EnumType.STRING)
    private SettlementStatus status; // PENDING, COMPLETED

    private LocalDateTime processedAt;
}

// SettlementScheduler.java
@Component
public class SettlementScheduler {

    @Autowired
    private SettlementService settlementService;

    // 매일 오전 1시 전날 정산 처리
    @Scheduled(cron = "0 0 1 * * *")
    public void processDailySettlement() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        settlementService.processSettlement(yesterday);
    }
}

// SettlementService.java
@Service
@Transactional
public class SettlementService {

    public Settlement processSettlement(LocalDate date) {
        // 해당 날짜의 완료된 주문 조회
        List<Order> orders = orderRepository.findByCreatedAtBetweenAndStatus(
            date.atStartOfDay(),
            date.plusDays(1).atStartOfDay(),
            OrderStatus.COMPLETED
        );

        BigDecimal totalSales = orders.stream()
            .map(Order::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRefunds = calculateRefunds(date);
        BigDecimal platformFee = totalSales.multiply(BigDecimal.valueOf(0.03)); // 3%
        BigDecimal paymentFee = totalSales.multiply(BigDecimal.valueOf(0.015)); // 1.5%

        BigDecimal netAmount = totalSales
            .subtract(totalRefunds)
            .subtract(platformFee)
            .subtract(paymentFee);

        Settlement settlement = Settlement.builder()
            .settlementDate(date)
            .totalSales(totalSales)
            .totalRefunds(totalRefunds)
            .platformFee(platformFee)
            .paymentFee(paymentFee)
            .netAmount(netAmount)
            .status(SettlementStatus.COMPLETED)
            .processedAt(LocalDateTime.now())
            .build();

        return settlementRepository.save(settlement);
    }
}
```

**우선순위**: MEDIUM
**예상 작업 시간**: 12시간

---

## 운영 및 모니터링

### 1. 🔴 CRITICAL: 구조화된 로깅 시스템

**문제점**:
현재 로그가 구조화되어 있지 않아 분석 어려움.

**해결책**:
Logback + JSON 로깅:

```xml
<!-- logback-spring.xml -->
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>

    <!-- Console Appender (개발 환경) -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- JSON File Appender (프로덕션 환경) -->
    <appender name="JSON_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/application.json</file>
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <includeContext>true</includeContext>
            <includeMdc>true</includeMdc>
            <customFields>{"app":"korean-agri-shop","env":"${SPRING_PROFILES_ACTIVE}"}</customFields>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/application-%d{yyyy-MM-dd}.json.gz</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
    </appender>

    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="JSON_FILE"/>
    </root>
</configuration>
```

**구조화된 로깅 예시**:
```java
// LoggingAspect.java
@Aspect
@Component
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    @Around("@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.PutMapping)")
    public Object logApiCall(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();

        MDC.put("class", className);
        MDC.put("method", methodName);
        MDC.put("requestId", UUID.randomUUID().toString());

        long startTime = System.currentTimeMillis();

        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;

            logger.info("API call completed: {}.{} in {}ms",
                className, methodName, duration);

            return result;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;

            logger.error("API call failed: {}.{} in {}ms - {}",
                className, methodName, duration, e.getMessage(), e);

            throw e;
        } finally {
            MDC.clear();
        }
    }
}
```

**우선순위**: CRITICAL
**예상 작업 시간**: 3시간

---

### 2. 🟡 MEDIUM: APM (Application Performance Monitoring)

**해결책**:
Sentry 또는 Datadog 연동:

```gradle
// build.gradle
implementation 'io.sentry:sentry-spring-boot-starter:6.34.0'
implementation 'io.sentry:sentry-logback:6.34.0'
```

```properties
# application.properties
sentry.dsn=https://your-sentry-dsn
sentry.environment=${SPRING_PROFILES_ACTIVE}
sentry.traces-sample-rate=1.0
sentry.enable-tracing=true
```

```java
// SentryConfig.java
@Configuration
public class SentryConfig {

    @Bean
    public SentryOptions.BeforeSendCallback beforeSendCallback() {
        return (event, hint) -> {
            // 민감 정보 필터링
            if (event.getRequest() != null) {
                event.getRequest().setHeaders(filterSensitiveHeaders(
                    event.getRequest().getHeaders()
                ));
            }
            return event;
        };
    }
}
```

**우선순위**: MEDIUM
**예상 작업 시간**: 2시간

---

### 3. 🟡 MEDIUM: 헬스체크 및 메트릭 엔드포인트

**해결책**:
Spring Boot Actuator:

```gradle
implementation 'org.springframework.boot:spring-boot-starter-actuator'
implementation 'io.micrometer:micrometer-registry-prometheus'
```

```properties
# application.properties
management.endpoints.web.exposure.include=health,info,metrics,prometheus
management.endpoint.health.show-details=always

# 커스텀 헬스 체크
management.health.db.enabled=true
management.health.redis.enabled=true
```

```java
// CustomHealthIndicator.java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {

    @Autowired
    private DataSource dataSource;

    @Override
    public Health health() {
        try (Connection conn = dataSource.getConnection()) {
            return Health.up()
                .withDetail("database", "MySQL")
                .withDetail("validConnection", true)
                .build();
        } catch (SQLException e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}
```

**우선순위**: MEDIUM
**예상 작업 시간**: 2시간

---

## 테스트 및 품질

### 1. 🟡 MEDIUM: 서비스 레이어 단위 테스트

**현재 상태**:
테스트 코드가 거의 없음.

**해결책**:
```java
// AuthServiceTest.java
@SpringBootTest
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private RefreshTokenService refreshTokenService;

    @Test
    @DisplayName("회원가입 성공")
    void registerUser_Success() {
        // Given
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("Password123!");
        request.setName("테스트 사용자");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");

        // When
        authService.register(request);

        // Then
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("중복 이메일로 회원가입 실패")
    void registerUser_DuplicateEmail() {
        // Given
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@example.com");

        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        // When & Then
        assertThrows(UserAlreadyExistsException.class, () -> {
            authService.register(request);
        });
    }
}
```

**목표 커버리지**: 70% 이상

**우선순위**: MEDIUM
**예상 작업 시간**: 20시간 (전체 서비스 레이어)

---

### 2. 🟢 LOW: 통합 테스트

```java
// OrderIntegrationTest.java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class OrderIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private OrderRepository orderRepository;

    private String authToken;

    @BeforeAll
    void setup() {
        // 로그인 후 토큰 획득
        LoginRequest loginRequest = new LoginRequest("test@example.com", "password");
        ResponseEntity<JwtResponse> response = restTemplate.postForEntity(
            "/api/auth/login", loginRequest, JwtResponse.class
        );
        authToken = response.getBody().getToken();
    }

    @Test
    @DisplayName("주문 생성 통합 테스트")
    void createOrder_IntegrationTest() {
        // Given
        OrderRequest orderRequest = createTestOrderRequest();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(authToken);
        HttpEntity<OrderRequest> request = new HttpEntity<>(orderRequest, headers);

        // When
        ResponseEntity<Order> response = restTemplate.postForEntity(
            "/api/orders", request, Order.class
        );

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertNotNull(response.getBody().getId());

        // DB 검증
        Order savedOrder = orderRepository.findById(response.getBody().getId()).get();
        assertEquals(OrderStatus.PENDING, savedOrder.getStatus());
    }
}
```

**우선순위**: LOW
**예상 작업 시간**: 15시간

---

### 3. 🟢 LOW: E2E 테스트 (Playwright)

```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test'

test.describe('주문 프로세스', () => {
  test('상품 선택부터 결제까지 완전한 플로우', async ({ page }) => {
    // 1. 로그인
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')

    // 2. 상품 선택
    await page.goto('/')
    await page.click('text=테스트 상품')
    await expect(page).toHaveURL(/\/product\/\d+/)

    // 3. 장바구니 추가
    await page.click('button:has-text("장바구니")')
    await expect(page.locator('text=장바구니에 추가되었습니다')).toBeVisible()

    // 4. 주문하기
    await page.goto('/cart')
    await page.click('button:has-text("주문하기")')

    // 5. 배송지 입력
    await page.fill('input[name="recipient"]', '홍길동')
    await page.fill('input[name="phone"]', '010-1234-5678')
    await page.fill('input[name="address"]', '서울시 강남구')

    // 6. 결제
    await page.click('button:has-text("결제하기")')
    await expect(page).toHaveURL(/\/payment/)
  })
})
```

**우선순위**: LOW
**예상 작업 시간**: 10시간

---

## 인프라 및 배포

### 1. 🟡 MEDIUM: 환경별 설정 분리

**해결책**:
```properties
# application.properties (공통)
spring.application.name=korean-agri-shop

# application-local.properties
spring.datasource.url=jdbc:mysql://localhost:3306/agrimarket
app.cookie.secure=false
cors.allowed.origins=http://localhost:3000

# application-dev.properties
spring.datasource.url=${DB_URL}
app.cookie.secure=false
cors.allowed.origins=https://dev.todaymart.co.kr

# application-prod.properties
spring.datasource.url=${DB_URL}
app.cookie.secure=true
cors.allowed.origins=https://todaymart.co.kr,https://www.todaymart.co.kr
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
```

**우선순위**: MEDIUM
**예상 작업 시간**: 2시간

---

### 2. 🟢 LOW: Docker Compose 개발 환경

```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: agrimarket
      MYSQL_USER: agrimarket
      MYSQL_PASSWORD: agripass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8081:8081"
    environment:
      SPRING_PROFILES_ACTIVE: local
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/agrimarket
      REDIS_HOST: redis
    depends_on:
      - mysql
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8081
    depends_on:
      - backend

volumes:
  mysql_data:
```

**우선순위**: LOW
**예상 작업 시간**: 3시간

---

### 3. 🟢 LOW: CI/CD 파이프라인

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 21
        uses: actions/setup-java@v3
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Run tests
        run: |
          cd backend
          ./gradlew test

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build backend
        run: |
          cd backend
          ./gradlew bootJar

      - name: Build frontend
        run: |
          cd frontend
          pnpm build

      - name: Deploy to production
        # AWS ECS, EC2, or other deployment
```

**우선순위**: LOW
**예상 작업 시간**: 8시간

---

## 우선순위 로드맵

### Phase 1: Critical (즉시 수행, 1-2주)

1. **재고 관리 시스템 구현** (8시간)
   - 동시성 제어 포함
   - 품절 처리 로직
   - 관리자 알림

2. **데이터베이스 인덱스 최적화** (1시간)
   - 주요 쿼리 분석
   - 인덱스 추가
   - 성능 테스트

3. **프로덕션 쿠키 보안 설정** (30분)
   - 환경별 Secure 플래그
   - SameSite 정책 검증

4. **구조화된 로깅 시스템** (3시간)
   - JSON 로깅
   - 로그 순환 정책
   - 에러 추적

**예상 총 작업 시간**: 12.5시간

---

### Phase 2: High (2-4주)

1. **N+1 쿼리 문제 해결** (2시간)
2. **Redis 캐싱 전략** (4시간)
3. **토큰 블랙리스트 시스템** (3시간)
4. **비밀번호 정책 강화** (1시간)
5. **에러 메시지 개선** (3시간)
6. **쿠폰 시스템** (10시간)
7. **APM 연동** (2시간)
8. **헬스체크 엔드포인트** (2시간)

**예상 총 작업 시간**: 27시간

---

### Phase 3: Medium (1-2개월)

1. **정산 시스템 자동화** (12시간)
2. **서비스 레이어 단위 테스트** (20시간)
3. **환경별 설정 분리** (2시간)
4. **결제 웹훅 보안 강화** (2시간)
5. **데이터베이스 커넥션 풀 튜닝** (30분)

**예상 총 작업 시간**: 36.5시간

---

### Phase 4: Low (장기, 3개월+)

1. **프론트엔드 최적화** (3시간)
2. **스켈레톤 UI** (2시간)
3. **편의 기능 추가** (6시간)
4. **통합 테스트** (15시간)
5. **E2E 테스트** (10시간)
6. **Docker Compose 환경** (3시간)
7. **CI/CD 파이프라인** (8시간)
8. **CORS 설정 세분화** (30분)

**예상 총 작업 시간**: 47.5시간

---

## 결론

### 종합 평가

**프로젝트 성숙도**: 6/10

**강점**:
- 최신 기술 스택 (Spring Boot 3.5, Next.js 15)
- 완전한 인증 시스템 (JWT + Refresh Token)
- 결제 연동 완료
- 관리자 기능 구현

**개선 필요**:
- 운영 환경 대비 부족 (모니터링, 로깅)
- 재고 관리 미구현
- 테스트 커버리지 낮음
- 성능 최적화 여지 많음

### 다음 단계

1. **Phase 1 작업 즉시 시작** (재고 관리, 인덱스, 보안)
2. **테스트 작성 습관화** (신규 기능마다 테스트 추가)
3. **모니터링 도구 도입** (Sentry, Datadog 등)
4. **정기적 성능 측정** (주간 부하 테스트)

---

**작성자**: Claude Code
**마지막 업데이트**: 2025-11-15
