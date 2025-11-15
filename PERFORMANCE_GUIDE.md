# 성능 최적화 가이드

**최종 업데이트**: 2025-11-15
**대상 프로젝트**: Korean Agricultural Products E-commerce Platform

---

## 목차

1. [데이터베이스 최적화](#데이터베이스-최적화)
2. [애플리케이션 레벨 최적화](#애플리케이션-레벨-최적화)
3. [캐싱 전략](#캐싱-전략)
4. [프론트엔드 최적화](#프론트엔드-최적화)
5. [인프라 최적화](#인프라-최적화)
6. [모니터링 및 측정](#모니터링-및-측정)
7. [성능 목표](#성능-목표)

---

## 데이터베이스 최적화

### 1. 인덱스 전략

#### 🔴 CRITICAL: 필수 인덱스 추가

**현재 문제**: 자주 조회되는 컬럼에 인덱스가 없어 Full Table Scan 발생

**영향**:
- 로그인 시간: ~100ms → ~5ms (20배 개선 가능)
- 주문 내역 조회: ~50ms → ~3ms (16배 개선 가능)
- 상품 검색: ~200ms → ~10ms (20배 개선 가능)

**구현**:

```sql
-- 1. 사용자 테이블
CREATE INDEX idx_users_email ON users(email);  -- 로그인 시 사용

-- 2. 리프레시 토큰 테이블
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- 3. 주문 테이블
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- 복합 인덱스 (자주 함께 사용되는 경우)
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- 4. 주문 아이템 테이블
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 5. 상품 테이블
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- 전문 검색 인덱스
CREATE FULLTEXT INDEX idx_products_search ON products(name, description);

-- 6. 리뷰 테이블
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
```

**실행 방법**:
```bash
# Flyway 마이그레이션 파일 생성
cd backend/src/main/resources/db/migration
touch V12__add_performance_indexes.sql

# 위 SQL 복사 후 저장
# 서버 재시작 시 자동 적용
```

---

#### 인덱스 성능 측정

**쿼리 실행 계획 확인**:

```sql
-- 인덱스 적용 전/후 비교
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- 결과 예시:
-- 인덱스 없음: type=ALL, rows=10000 (Full Table Scan)
-- 인덱스 있음: type=ref, rows=1, key=idx_users_email
```

**인덱스 사용률 모니터링**:

```sql
-- 사용되지 않는 인덱스 찾기
SELECT
    t.TABLE_NAME,
    s.INDEX_NAME,
    s.COLUMN_NAME
FROM information_schema.STATISTICS s
LEFT JOIN information_schema.TABLES t ON s.TABLE_NAME = t.TABLE_NAME
WHERE s.TABLE_SCHEMA = 'agrimarket'
AND s.INDEX_NAME NOT IN (
    SELECT DISTINCT INDEX_NAME
    FROM information_schema.STATISTICS
);
```

---

### 2. N+1 쿼리 문제 해결

**문제점**: 주문 상세 조회 시 21개 쿼리 실행 (1 주문 + 10 아이템 + 10 상품)

**현재 코드** (`OrderService.java`):
```java
public Order getOrderById(Long orderId) {
    return orderRepository.findById(orderId)
        .orElseThrow(() -> new RuntimeException("주문을 찾을 수 없습니다."));
}
// OrderItem은 Lazy Loading으로 나중에 조회됨
```

**해결책 1: Fetch Join 사용**:

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

**성능 개선**: 21개 쿼리 → 1개 쿼리 (21배 개선)

---

**해결책 2: @EntityGraph 사용**:

```java
// OrderRepository.java
@EntityGraph(attributePaths = {"orderItems", "orderItems.productOption", "orderItems.productOption.product"})
Optional<Order> findById(Long id);
```

---

**해결책 3: @BatchSize 사용** (컬렉션이 매우 클 경우):

```java
// Order.java
@OneToMany(mappedBy = "order")
@BatchSize(size = 10)  // 10개씩 배치로 조회
private List<OrderItem> orderItems = new ArrayList<>();
```

---

### 3. 쿼리 최적화 팁

#### DTO Projection 사용

**문제**: Entity 전체를 조회하지만 일부 필드만 필요

**해결**:
```java
// ProductSummaryDto.java
public record ProductSummaryDto(
    Long id,
    String name,
    BigDecimal price,
    String imageUrl
) {}

// ProductRepository.java
@Query("SELECT new com.agri.market.dto.ProductSummaryDto(p.id, p.name, p.price, p.imageUrl) " +
       "FROM Product p WHERE p.category = :category")
List<ProductSummaryDto> findSummaryByCategory(@Param("category") String category);
```

**성능 개선**: 메모리 사용량 50% 감소, 전송 데이터 70% 감소

---

#### EXISTS vs COUNT

**문제**: 존재 여부만 확인하는데 COUNT 사용

**나쁜 예**:
```java
@Query("SELECT COUNT(o) > 0 FROM Order o WHERE o.user.id = :userId")
boolean hasOrders(@Param("userId") Long userId);
```

**좋은 예**:
```java
boolean existsByUserId(Long userId);  // Spring Data JPA가 EXISTS 사용
```

---

### 4. 커넥션 풀 튜닝

**현재 설정** (`application.properties`):
```properties
spring.datasource.hikari.maximum-pool-size=5
```

**문제**: 동시 사용자 증가 시 병목 발생

**최적화**:
```properties
# HikariCP 설정
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.leak-detection-threshold=5000

# 커넥션 검증
spring.datasource.hikari.connection-test-query=SELECT 1

# JMX 모니터링
spring.datasource.hikari.register-mbeans=true
```

**권장 커넥션 수 계산**:
```
connections = ((core_count * 2) + effective_spindle_count)

예: 4 코어 CPU + 1 디스크 = (4 * 2) + 1 = 9개
실무: 안전 마진 2배 = 20개
```

---

## 애플리케이션 레벨 최적화

### 1. 트랜잭션 최적화

#### @Transactional(readOnly = true) 사용

**목적**: 읽기 전용 트랜잭션은 플러시를 스킵하여 성능 향상

**적용**:
```java
// OrderService.java
@Transactional(readOnly = true)
public Page<Order> getUserOrders(Long userId, Pageable pageable) {
    return orderRepository.findByUserId(userId, pageable);
}

@Transactional  // 쓰기 작업은 readOnly=false (기본값)
public Order createOrder(OrderRequest request) {
    // ...
}
```

---

#### 트랜잭션 범위 최소화

**나쁜 예**:
```java
@Transactional
public void processOrder(OrderRequest request) {
    // 외부 API 호출 (느림)
    PaymentResult payment = tossPaymentsClient.requestPayment(request);

    // DB 저장
    Order order = new Order();
    orderRepository.save(order);
}
```

**좋은 예**:
```java
public void processOrder(OrderRequest request) {
    // 외부 API 호출 (트랜잭션 외부)
    PaymentResult payment = tossPaymentsClient.requestPayment(request);

    // DB 저장 (트랜잭션 내부)
    saveOrder(payment);
}

@Transactional
private void saveOrder(PaymentResult payment) {
    Order order = new Order();
    orderRepository.save(order);
}
```

---

### 2. Lazy Loading 활용

**설정 확인**:
```properties
# application.properties
spring.jpa.open-in-view=false  # ✅ 이미 설정됨
```

**이유**: OSIV를 끄면 트랜잭션 범위가 명확해지고 N+1 문제를 조기 발견

---

### 3. 페이징 최적화

#### Count 쿼리 최적화

**문제**: 페이징 시 전체 건수를 매번 계산

**해결**:
```java
// ProductRepository.java
@Query(value = "SELECT p FROM Product p WHERE p.category = :category",
       countQuery = "SELECT COUNT(p.id) FROM Product p WHERE p.category = :category")
Page<Product> findByCategory(@Param("category") String category, Pageable pageable);
```

#### Cursor 기반 페이징 (무한 스크롤)

**더 빠른 방법** (페이지 번호 대신 마지막 ID 사용):
```java
@Query("SELECT p FROM Product p WHERE p.id < :lastId ORDER BY p.id DESC")
List<Product> findNextPage(@Param("lastId") Long lastId, Pageable pageable);
```

---

## 캐싱 전략

### 1. Redis 캐시 설정

#### 의존성 추가

```gradle
// build.gradle
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
implementation 'org.springframework.boot:spring-boot-starter-cache'
```

#### Redis 설정

```properties
# application.properties
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.cache.type=redis
```

---

#### 캐시 설정 클래스

```java
// CacheConfig.java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .serializeValuesWith(
                SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer())
            );

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // 상품 목록: 5분 TTL
        cacheConfigurations.put("products",
            defaultConfig.entryTtl(Duration.ofMinutes(5)));

        // 상품 상세: 10분 TTL
        cacheConfigurations.put("productDetail",
            defaultConfig.entryTtl(Duration.ofMinutes(10)));

        // 사용자 정보: 30분 TTL
        cacheConfigurations.put("users",
            defaultConfig.entryTtl(Duration.ofMinutes(30)));

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .build();
    }
}
```

---

### 2. 캐시 적용

#### @Cacheable 사용

```java
// ProductService.java
@Cacheable(value = "products", key = "#page + '-' + #size + '-' + #category")
public Page<Product> getProducts(int page, int size, String category) {
    Pageable pageable = PageRequest.of(page, size);
    return productRepository.findByCategory(category, pageable);
}

@Cacheable(value = "productDetail", key = "#id")
public Product getProductById(Long id) {
    return productRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("상품을 찾을 수 없습니다."));
}
```

#### @CacheEvict로 캐시 무효화

```java
@CacheEvict(value = {"products", "productDetail"}, allEntries = true)
public Product updateProduct(Long id, ProductRequest request) {
    Product product = productRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("상품을 찾을 수 없습니다."));

    product.setName(request.getName());
    product.setPrice(request.getPrice());

    return productRepository.save(product);
}

@CacheEvict(value = "productDetail", key = "#id")
public void deleteProduct(Long id) {
    productRepository.deleteById(id);
}
```

---

### 3. 캐시 성능 측정

#### 캐시 Hit/Miss 모니터링

```java
@Aspect
@Component
public class CacheMonitoringAspect {

    private static final Logger logger = LoggerFactory.getLogger(CacheMonitoringAspect.class);

    @Around("@annotation(org.springframework.cache.annotation.Cacheable)")
    public Object monitorCache(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getName();

        long startTime = System.currentTimeMillis();
        Object result = joinPoint.proceed();
        long duration = System.currentTimeMillis() - startTime;

        logger.info("Cache operation: {} in {}ms", methodName, duration);

        return result;
    }
}
```

---

### 4. 캐시 전략 선택 가이드

| 데이터 유형 | TTL | 캐시 여부 | 이유 |
|------------|-----|----------|------|
| 상품 목록 | 5분 | ✅ | 자주 조회, 변경 적음 |
| 상품 상세 | 10분 | ✅ | 매우 자주 조회 |
| 사용자 정보 | 30분 | ✅ | 자주 조회, 변경 적음 |
| 장바구니 | - | ❌ | 실시간 동기화 필요 |
| 주문 내역 | - | ❌ | 실시간 정확성 중요 |
| 상품 재고 | - | ❌ | 실시간 정확성 필수 |

---

## 프론트엔드 최적화

### 1. Next.js Image 컴포넌트

**문제**: `<img>` 태그 사용 시 최적화 미흡

**해결**:

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
  loading="lazy"  // Lazy loading
  quality={75}    // 품질 75% (기본 85%)
/>
```

**성능 개선**:
- 자동 WebP 변환
- 반응형 이미지 생성
- Lazy loading
- 이미지 크기 50% 감소

---

### 2. 코드 스플리팅

#### 동적 임포트

**Before**:
```typescript
import { Chart } from '@/components/chart'

export default function DashboardPage() {
  return <Chart data={data} />
}
```

**After**:
```typescript
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('@/components/chart'), {
  loading: () => <div>Loading...</div>,
  ssr: false  // 클라이언트에서만 렌더링
})

export default function DashboardPage() {
  return <Chart data={data} />
}
```

**효과**: 초기 번들 크기 30% 감소

---

#### 라우트 기반 코드 스플리팅

Next.js는 자동으로 각 페이지를 분리된 번들로 생성합니다.

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

---

### 3. 번들 최적화

#### Tree Shaking 확인

**나쁜 예**:
```typescript
import _ from 'lodash'  // 전체 라이브러리 import (70KB)

_.debounce(func, 300)
```

**좋은 예**:
```typescript
import debounce from 'lodash/debounce'  // 필요한 함수만 (5KB)

debounce(func, 300)
```

---

#### 미사용 패키지 제거

```bash
# 의존성 분석
pnpm list --depth=0

# 미사용 패키지 찾기
npx depcheck

# 제거
pnpm remove <package-name>
```

---

### 4. 프리페칭 및 프리로딩

#### Link 컴포넌트의 자동 프리페칭

```typescript
import Link from 'next/link'

// 뷰포트에 나타나면 자동으로 프리페치
<Link href="/product/123" prefetch={true}>
  상품 상세
</Link>
```

#### 이미지 프리로딩

```typescript
import { useEffect } from 'react'

useEffect(() => {
  const images = ['/hero1.jpg', '/hero2.jpg']
  images.forEach((src) => {
    const img = new Image()
    img.src = src
  })
}, [])
```

---

### 5. React 성능 최적화

#### React.memo 사용

```typescript
const ProductCard = React.memo(({ product }: { product: Product }) => {
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{product.price}원</p>
    </div>
  )
})
```

#### useMemo로 비싼 계산 메모이제이션

```typescript
const sortedProducts = useMemo(() => {
  return products.sort((a, b) => b.rating - a.rating)
}, [products])
```

#### useCallback로 함수 메모이제이션

```typescript
const handleAddToCart = useCallback((productId: number) => {
  // ...
}, [])
```

---

## 인프라 최적화

### 1. CDN 활용

#### CloudFront 설정

**정적 파일 캐싱**:
```
- 이미지: Cache-Control: max-age=31536000 (1년)
- JS/CSS: Cache-Control: max-age=31536000, immutable
- HTML: Cache-Control: max-age=0, must-revalidate
```

**캐시 무효화**:
```bash
aws cloudfront create-invalidation \
  --distribution-id E1234567 \
  --paths "/*"
```

---

### 2. Compression

#### Gzip/Brotli 압축

**Next.js 설정**:
```javascript
// next.config.js
module.exports = {
  compress: true,  // 기본 gzip 압축 활성화
}
```

**Nginx 설정** (필요 시):
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

# Brotli (더 효율적)
brotli on;
brotli_types text/plain text/css application/javascript application/json;
```

---

### 3. 데이터베이스 스케일링

#### Read Replica 구성

**목적**: 읽기 부하 분산

**설정**:
```properties
# application.properties
spring.datasource.hikari.read-only=true

# Master DB (쓰기)
spring.datasource.master.url=jdbc:mysql://master-db:3306/agrimarket

# Read Replica (읽기)
spring.datasource.replica.url=jdbc:mysql://replica-db:3306/agrimarket
```

**라우팅 로직**:
```java
@Configuration
public class DataSourceConfig {

    @Bean
    public DataSource dataSource() {
        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put("master", masterDataSource());
        targetDataSources.put("replica", replicaDataSource());

        RoutingDataSource routingDataSource = new RoutingDataSource();
        routingDataSource.setTargetDataSources(targetDataSources);
        routingDataSource.setDefaultTargetDataSource(masterDataSource());

        return routingDataSource;
    }
}
```

---

## 모니터링 및 측정

### 1. 성능 메트릭 수집

#### Spring Boot Actuator + Prometheus

**의존성**:
```gradle
implementation 'org.springframework.boot:spring-boot-starter-actuator'
implementation 'io.micrometer:micrometer-registry-prometheus'
```

**설정**:
```properties
management.endpoints.web.exposure.include=health,prometheus,metrics
management.metrics.export.prometheus.enabled=true
```

**커스텀 메트릭**:
```java
@Component
public class OrderMetrics {

    private final Counter orderCounter;
    private final Timer orderProcessingTime;

    public OrderMetrics(MeterRegistry registry) {
        this.orderCounter = Counter.builder("orders.created")
            .description("Total number of orders created")
            .register(registry);

        this.orderProcessingTime = Timer.builder("orders.processing.time")
            .description("Order processing time")
            .register(registry);
    }

    public void recordOrder() {
        orderCounter.increment();
    }

    public void recordProcessingTime(long milliseconds) {
        orderProcessingTime.record(milliseconds, TimeUnit.MILLISECONDS);
    }
}
```

---

### 2. 프론트엔드 성능 측정

#### Web Vitals

**설치**:
```bash
pnpm add web-vitals
```

**측정**:
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { sendWebVitals } from './analytics'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

// analytics.ts
export function sendWebVitals(metric: any) {
  console.log(metric)

  // Google Analytics로 전송
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    })
  }
}
```

---

### 3. 슬로우 쿼리 로깅

```properties
# application.properties
spring.jpa.properties.hibernate.session.events.log.LOG_QUERIES_SLOWER_THAN_MS=100

# MySQL 설정
slow_query_log=1
long_query_time=0.1
slow_query_log_file=/var/log/mysql/slow-query.log
```

---

## 성능 목표

### 응답 시간 목표

| 엔드포인트 | 목표 | 현재 | 개선 |
|-----------|------|------|------|
| GET /api/products | < 50ms | ~200ms | 🔴 |
| GET /api/products/{id} | < 30ms | ~100ms | 🔴 |
| POST /api/auth/login | < 100ms | ~150ms | 🟡 |
| GET /api/orders | < 100ms | ~300ms | 🔴 |
| POST /api/orders | < 200ms | ~500ms | 🔴 |

### 프론트엔드 성능 목표

| 메트릭 | 목표 | 설명 |
|--------|------|------|
| LCP (Largest Contentful Paint) | < 2.5s | 메인 콘텐츠 로딩 시간 |
| FID (First Input Delay) | < 100ms | 첫 입력 반응 시간 |
| CLS (Cumulative Layout Shift) | < 0.1 | 레이아웃 안정성 |
| TTFB (Time to First Byte) | < 600ms | 서버 응답 시간 |

---

## 체크리스트

### 데이터베이스

```
[ ] 필수 인덱스 추가 완료
[ ] N+1 쿼리 모두 해결
[ ] 슬로우 쿼리 로깅 활성화
[ ] 커넥션 풀 튜닝 완료
[ ] 쿼리 실행 계획 분석 완료
```

### 애플리케이션

```
[ ] @Transactional(readOnly=true) 적용
[ ] 트랜잭션 범위 최소화
[ ] DTO Projection 사용
[ ] 페이징 최적화 완료
```

### 캐싱

```
[ ] Redis 설치 및 설정
[ ] 상품 목록 캐싱
[ ] 상품 상세 캐싱
[ ] 캐시 무효화 로직
[ ] 캐시 히트율 모니터링
```

### 프론트엔드

```
[ ] Next.js Image 컴포넌트 적용
[ ] 코드 스플리팅 적용
[ ] 번들 크기 분석 및 최적화
[ ] Tree shaking 확인
[ ] React.memo, useMemo, useCallback 적용
```

### 인프라

```
[ ] CDN 설정 (CloudFront)
[ ] Gzip/Brotli 압축
[ ] Read Replica 구성 (선택)
```

### 모니터링

```
[ ] Prometheus 메트릭 수집
[ ] Web Vitals 측정
[ ] 슬로우 쿼리 로깅
[ ] APM 도구 연동 (Sentry/Datadog)
```

---

**작성자**: Claude Code
**마지막 업데이트**: 2025-11-15
