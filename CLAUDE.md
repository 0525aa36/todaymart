# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Korean agricultural products e-commerce platform with separate backend (Spring Boot) and frontend (Next.js).

**Backend**: Spring Boot 3.5.7 + Java 21 + MySQL + JWT authentication
**Frontend**: Next.js 15.2.4 + TypeScript + Tailwind CSS + shadcn/ui
**Ports**: Backend on 8081, Frontend on 3000

## Essential Commands

### Development Servers

```bash
# Backend (Spring Boot) - run from project root
cd backend && ./gradlew bootRun

# Frontend (Next.js) - run from project root
cd frontend && pnpm dev

# Kill port if needed
lsof -ti:8081 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
```

### Build & Test

```bash
# Backend build
cd backend && ./gradlew clean build

# Backend tests
cd backend && ./gradlew test

# Frontend build
cd frontend && pnpm build

# Frontend lint
cd frontend && pnpm lint
```

### Database

```bash
# Access MySQL
mysql -u agrimarket -p
use agrimarket;

# Database config in: backend/src/main/resources/application.properties
# Default credentials: user=agrimarket, pass=agripass
```

## Architecture & Key Patterns

### Backend Architecture

**Package Structure**: `/backend/src/main/java/com/agri/market/`
- `config/` - Spring Security, CORS, TossPayments, HikariCP connection pool settings
- `security/` - JWT token provider, authentication filter, user details service
- `auth/` - Login/register controllers
- `user/` - User management, profiles, addresses
- `product/` - Products with options (`ProductOption`) and images (`ProductImage`)
- `order/` - Orders with order items, status tracking, cancellation
- `payment/` - Toss Payments integration, webhooks
- `cart/` - Shopping cart with cart items
- `review/` - Product reviews with ratings
- `wishlist/` - User wishlist functionality
- `admin/` - Admin dashboard statistics, Excel export
- `crawler/` - Product crawler service for onong.co.kr
- `file/` - File upload/storage for product images
- `notification/` - SSE-based real-time notifications
- `dto/` - Request/response DTOs
- `exception/` - Custom exceptions (UnauthorizedException, ForbiddenException, etc.)

**Security Model**:
- JWT-based stateless authentication (HS512)
- Token stored in localStorage, sent via Authorization header
- Public endpoints: `/api/auth/**`, `/api/products/**`, `/api/reviews/product/**`, `/api/files/**`
- Authenticated endpoints: Most user actions (cart, orders, wishlist, profile)
- Admin endpoints: `/api/admin/**` requires ROLE_ADMIN

**Key Design Patterns**:
1. **Product Options**: Products have many ProductOptions (size, weight variants) stored in separate table with cascade delete
2. **Product Images**: Multiple images per product with display order, main imageUrl field maintained for backward compatibility
3. **Order Items**: Orders contain OrderItems linking to ProductOptions (not Products directly)
4. **Jackson Annotations**: Uses @JsonManagedReference/@JsonBackReference to prevent circular serialization in bidirectional relationships
5. **Connection Pool**: HikariCP with leak detection (10s threshold), max 5 connections, validation on borrow
6. **Transaction Management**: @Transactional on service methods, open-in-view=false to prevent lazy loading issues

### Frontend Architecture

**App Structure**: `/frontend/app/` (Next.js App Router)
- `page.tsx` - Homepage with featured products
- `login/`, `register/` - Authentication pages
- `product/[id]/` - Product detail with options selector, reviews, wishlist
- `cart/` - Shopping cart
- `checkout/` - Order creation with address input
- `payment/` - Toss Payments integration
- `search/` - Product search with filters
- `mypage/` - User dashboard
  - `orders/` - Order history and details
  - `reviews/` - Review management
  - `wishlist/` - Saved products
  - `addresses/` - Shipping addresses
  - `settings/` - Profile and password change
- `admin/` - Admin dashboard
  - `page.tsx` - Statistics dashboard with charts (Recharts)
  - `products/` - Product management
  - `orders/` - Order management, Excel export

**API Client Pattern** (`/frontend/lib/api-client.ts`):
- Centralized `apiFetch()` wrapper around fetch
- Auto-adds JWT from localStorage when `auth: true`
- Strips "Bearer " prefix if present in stored token
- Custom `ApiError` class with status and payload
- Supports json/text/blob/none response parsing

**Component Patterns**:
- Server Components for data fetching where possible
- "use client" for interactive components (forms, modals, charts)
- shadcn/ui components in `/frontend/components/ui/`
- Custom components: header, footer, product-card, add-to-cart-modal, error-boundary, loading-spinner
- React Hook Form + Zod for form validation

### Crawler System

**Purpose**: Scrapes products from onong.co.kr to populate database

**Components**:
- `ProductCrawlerService` - Main crawler logic with Jsoup
- `CrawlerController` - Admin API to toggle/trigger crawls
- `CrawlerScheduler` - Scheduled daily crawls at 2 AM (disabled by default)
- `CrawlerConfig` - Configuration from application.properties

**Configuration** (`application.properties`):
```properties
crawler.enabled=false  # Must enable to use
crawler.target-url=https://www.onong.co.kr/
crawler.request-delay=2000
crawler.timeout=10000
crawler.product-card-selector=a[href^='/Goods/Detail/']
```

**Features**:
- Parses product name, prices, discount rates, images
- Extracts product options (size/weight variants) from detail pages
- Downloads and stores images locally
- Creates ProductImage entities with display order

### Payment Integration

**Toss Payments**:
- SDK: `@tosspayments/payment-widget-sdk` (frontend)
- Config: `TossPaymentsConfig.java` (backend)
- Flow: Request payment → Toss widget → Redirect with paymentKey/orderId/amount → Backend confirms
- Endpoints:
  - `POST /api/payments/{orderId}/request` - Initialize payment
  - `POST /api/payments/confirm` - Confirm after Toss redirect
  - `POST /api/payments/webhook` - Handle Toss webhooks
- Webhook security: HMAC signature validation with `payment.webhook.secret`

**Environment Variables** (`.env.example`):
```
TOSS_PAYMENTS_CLIENT_KEY=test_ck_xxx
TOSS_PAYMENTS_SECRET_KEY=test_sk_xxx
WEBHOOK_SECRET=your-webhook-secret
JWT_SECRET=512-bit-secret-here
DB_PASSWORD=agripass
```

## Common Development Workflows

### Adding a New Entity

1. Create Entity class in appropriate package (e.g., `product/NewEntity.java`)
2. Add Lombok @Getter/@Setter, JPA annotations
3. Create Repository interface extending JpaRepository
4. Create Service with @Transactional methods
5. Create Controller with REST endpoints
6. Create Request/Response DTOs in `dto/`
7. Update SecurityConfig if new endpoints need special permissions
8. Frontend: Add API calls in page/component using apiFetch

### Modifying Security Rules

Edit `/backend/src/main/java/com/agri/market/config/SecurityConfig.java`:
- Public endpoints: `.requestMatchers("/api/path/**").permitAll()`
- Auth required: `.anyRequest().authenticated()`
- Admin only: `.requestMatchers("/api/admin/**").hasRole("ADMIN")`

Note: Spring Security expects role without "ROLE_" prefix in hasRole(), but stores as "ROLE_ADMIN" in DB.

### Working with Product Options

**Backend**:
- ProductOption entity links to Product via @ManyToOne
- Always cascade operations via Product entity
- OrderItem references ProductOption (not Product) to preserve historical pricing

**Frontend**:
- Fetch options via `GET /api/products/{id}/options` (public endpoint)
- Display as dropdown/selector in product detail page
- Include `productOptionId` in cart/order requests

### Database Schema Updates

1. Modify Entity classes (JPA annotations)
2. Set `spring.jpa.hibernate.ddl-auto=update` (already configured)
3. Restart backend - Hibernate auto-migrates
4. For production: Use `ddl-auto=validate` and manual migrations

**Sample Data**: `/backend/src/main/resources/sample-options.sql`

### Frontend Data Fetching

**Authenticated Request**:
```typescript
import { apiFetch } from '@/lib/api-client'

const data = await apiFetch('/api/orders', { auth: true })
```

**Public Request**:
```typescript
const products = await apiFetch('/api/products?page=0&size=10')
```

**POST with JSON**:
```typescript
await apiFetch('/api/orders', {
  auth: true,
  method: 'POST',
  body: JSON.stringify(orderRequest)
})
```

### Testing Admin Features

1. Use admin credentials (configured in database or create via register + manual role update)
2. Login at `/login`
3. Admin button appears in header if user has ROLE_ADMIN
4. Access dashboard at `/admin`
5. Test Excel export, order status updates, product CRUD

### Running the Crawler

**Via API** (requires ADMIN role):
```bash
# Get admin token first
TOKEN="eyJhbG..."

# Enable crawler
curl -X PUT "http://localhost:8081/api/admin/crawler/toggle?enabled=true" \
  -H "Authorization: Bearer $TOKEN"

# Trigger crawl
curl -X POST "http://localhost:8081/api/admin/crawler/run" \
  -H "Authorization: Bearer $TOKEN"
```

**Via Scheduler**:
- Set `crawler.enabled=true` in application.properties
- Runs daily at 2 AM (configured in `CrawlerScheduler`)

## Git Workflow

Follows trunk-based development with feature branches:

**Branch Naming**:
- `feat/<feature-name>` - New features
- `fix/<issue-name>` - Bug fixes
- `hotfix/<issue>` - Urgent fixes

**Commit Convention** (Conventional Commits):
```
<type>(<scope>): <subject>

Types: feat, fix, refactor, style, docs, test, chore, perf, ci
Scope: user, product, order, payment, crawler, admin, etc.
```

**Examples**:
```bash
feat(product): 상품 옵션 관리 기능 추가
fix(order): 총액 계산 반올림 오류 수정
chore(deps): Gradle 플러그인 버전 업데이트
```

**Merging**: Squash merge to main for clean history

**Releases**: SemVer tags (v1.0.0) with CHANGELOG updates

## Troubleshooting

### Common Issues

**401 Unauthorized on authenticated endpoints**:
- Check localStorage has 'token' key
- Verify token not expired (24hr expiry)
- Ensure Authorization header format: "Bearer <token>"
- Check endpoint not in permitAll() list in SecurityConfig

**Connection pool exhausted**:
- Check for unclosed transactions or queries
- Review HikariCP leak detection logs (10s threshold)
- Verify `spring.jpa.open-in-view=false` to prevent lazy loading issues

**Product options not showing**:
- Verify ProductOption entities created with cascade from Product
- Check `GET /api/products/{id}/options` endpoint is public
- Frontend: Ensure using ProductOptionResponse DTO structure

**CORS errors**:
- Backend allows localhost:3000 in SecurityConfig corsConfigurationSource()
- For production: Update allowed origins in SecurityConfig

**JSON circular reference**:
- Use @JsonManagedReference/@JsonBackReference on bidirectional relations
- Or @JsonIgnore on back-reference side

### Log Locations

**Backend**: Console output from `./gradlew bootRun`
- JWT validation logs in JwtAuthenticationFilter
- Crawler logs in ProductCrawlerService
- SQL logs when `spring.jpa.show-sql=true`

**Frontend**: Browser console (F12) and Next.js terminal
- API errors logged by ApiError class
- Network tab for request/response inspection

## Key Files Reference

**Backend Config**:
- `backend/src/main/resources/application.properties` - All backend configuration
- `backend/src/main/java/com/agri/market/config/SecurityConfig.java` - Security rules
- `backend/src/main/java/com/agri/market/config/TossPaymentsConfig.java` - Payment config

**Frontend Config**:
- `frontend/lib/api-client.ts` - API client setup, base URL
- `frontend/app/layout.tsx` - Root layout with theme provider
- `frontend/package.json` - Dependencies and scripts

**Database Schema**: Auto-generated by Hibernate from Entity classes

**Sample Data**: `backend/src/main/resources/sample-options.sql`
- ## 1. Toss Payments 결제 시스템 및 이중 처리 방지
- **Payment Widget SDK** 연동하여 결제 프로세스 구현
- **결제 이중 처리 방지**:
  - `paymentKey` 기반 멱등성 체크 (중복 결제 요청 시 `already_processed` 반환)
  - JPA Optimistic Lock 활용 (`@Version` 컬럼으로 동시성 제어)
  - `ObjectOptimisticLockingFailureException` catch하여 동시 결제 감지
- **HMAC-SHA256 웹훅 서명 검증**으로 보안 강화:
  - Payload + Timestamp 기반 서명 계산
  - Constant-time 비교로 Timing Attack 방지
  - Replay Attack 방지 (타임스탬프 5분 이내만 허용)
- 결제 승인 → 주문 생성 → 재고 차감을 **단일 트랜잭션**으로 묶어 데이터 일관성 보장
- 결제 취소 API 구현 (부분 환불 / 전액 환불 지원)

구현기능 관련 기술 블로그를 작성하려고 하는데 우아한 기술블로그 처럼 작성해줘
https://techblog.woowahan.com/
- ## 1. Toss Payments 결제 시스템 및 이중 처리 방지
- **Payment Widget SDK** 연동하여 결제 프로세스 구현
- **결제 이중 처리 방지**:
  - `paymentKey` 기반 멱등성 체크 (중복 결제 요청 시 `already_processed` 반환)
  - JPA Optimistic Lock 활용 (`@Version` 컬럼으로 동시성 제어)
  - `ObjectOptimisticLockingFailureException` catch하여 동시 결제 감지
- **HMAC-SHA256 웹훅 서명 검증**으로 보안 강화:
  - Payload + Timestamp 기반 서명 계산
  - Constant-time 비교로 Timing Attack 방지
  - Replay Attack 방지 (타임스탬프 5분 이내만 허용)
- 결제 승인 → 주문 생성 → 재고 차감을 **단일 트랜잭션**으로 묶어 데이터 일관성 보장
- 결제 취소 API 구현 (부분 환불 / 전액 환불 지원)

구현기능 관련 기술 블로그를 작성하려고 하는데 우아한 기술블로그 처럼 작성해줘
https://techblog.woowahan.com/
- ## 1. Toss Payments 결제 시스템 및 이중 처리 방지
- **Payment Widget SDK** 연동하여 결제 프로세스 구현
- **결제 이중 처리 방지**:
  - `paymentKey` 기반 멱등성 체크 (중복 결제 요청 시 `already_processed` 반환)
  - JPA Optimistic Lock 활용 (`@Version` 컬럼으로 동시성 제어)
  - `ObjectOptimisticLockingFailureException` catch하여 동시 결제 감지
- **HMAC-SHA256 웹훅 서명 검증**으로 보안 강화:
  - Payload + Timestamp 기반 서명 계산
  - Constant-time 비교로 Timing Attack 방지
  - Replay Attack 방지 (타임스탬프 5분 이내만 허용)
- 결제 승인 → 주문 생성 → 재고 차감을 **단일 트랜잭션**으로 묶어 데이터 일관성 보장
- 결제 취소 API 구현 (부분 환불 / 전액 환불 지원)

구현기능 관련 기술 블로그를 작성하려고 하는데 우아한 기술블로그 처럼 작성해줘
https://techblog.woowahan.com/
- 1. Toss Payments 결제 시스템 및 이중 처리 방지
- **Payment Widget SDK** 연동하여 결제 프로세스 구현
- **결제 이중 처리 방지**:
  - `paymentKey` 기반 멱등성 체크 (중복 결제 요청 시 `already_processed` 반환)
  - JPA Optimistic Lock 활용 (`@Version` 컬럼으로 동시성 제어)
  - `ObjectOptimisticLockingFailureException` catch하여 동시 결제 감지
- **HMAC-SHA256 웹훅 서명 검증**으로 보안 강화:
  - Payload + Timestamp 기반 서명 계산
  - Constant-time 비교로 Timing Attack 방지
  - Replay Attack 방지 (타임스탬프 5분 이내만 허용)
- 결제 승인 → 주문 생성 → 재고 차감을 **단일 트랜잭션**으로 묶어 데이터 일관성 보장
- 결제 취소 API 구현 (부분 환불 / 전액 환불 지원)

구현기능 관련 기술 블로그를 작성하려고 하는데 우아한 기술블로그 처럼 작성해줘
https://techblog.woowahan.com/