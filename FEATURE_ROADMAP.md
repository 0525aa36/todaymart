# 기능 개발 로드맵

**최종 업데이트**: 2025-11-15
**대상 프로젝트**: Korean Agricultural Products E-commerce Platform

---

## 목차

1. [Phase 1: Critical (즉시 수행)](#phase-1-critical-즉시-수행-1-2주)
2. [Phase 2: High Priority (1-2개월)](#phase-2-high-priority-1-2개월)
3. [Phase 3: Medium Priority (3-6개월)](#phase-3-medium-priority-3-6개월)
4. [Phase 4: Low Priority (6개월+)](#phase-4-low-priority-6개월)
5. [참고: 구현 완료된 기능](#구현-완료된-기능)

---

## Phase 1: Critical (즉시 수행, 1-2주)

### 1. 재고 관리 시스템 🔴

**우선순위**: CRITICAL
**예상 작업 시간**: 8시간
**비즈니스 가치**: ⭐⭐⭐⭐⭐

#### 문제점
- 현재 재고 관리 기능이 없어 품절 상품도 주문 가능
- 동시 주문 시 초과 판매 위험
- 재고 부족 알림 없음

#### 구현 사항

**1. 데이터베이스 스키마**:
```sql
-- ProductOption 테이블에 재고 필드 추가
ALTER TABLE product_options ADD COLUMN stock_quantity INT DEFAULT 0;
ALTER TABLE product_options ADD COLUMN low_stock_threshold INT DEFAULT 10;

-- Product 테이블에 재고 필드 추가 (옵션이 없는 상품용)
ALTER TABLE products ADD COLUMN stock_quantity INT DEFAULT 0;
ALTER TABLE products ADD COLUMN low_stock_threshold INT DEFAULT 10;
```

**2. InventoryService 구현**:
```java
@Service
@Transactional
public class InventoryService {

    /**
     * 재고 차감 (Pessimistic Lock으로 동시성 제어)
     */
    public void decreaseStock(Long productOptionId, int quantity) {
        ProductOption option = productOptionRepository
            .findByIdWithLock(productOptionId)
            .orElseThrow(() -> new NotFoundException("상품 옵션을 찾을 수 없습니다."));

        if (option.getStockQuantity() < quantity) {
            throw new InsufficientStockException(
                String.format("재고 부족: 요청 %d개, 재고 %d개", quantity, option.getStockQuantity())
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
            .orElseThrow(() -> new NotFoundException("상품 옵션을 찾을 수 없습니다."));

        option.setStockQuantity(option.getStockQuantity() + quantity);
        productOptionRepository.save(option);
    }

    /**
     * 재고 부족 상품 조회
     */
    public List<ProductOption> getLowStockProducts() {
        return productOptionRepository.findLowStockProducts();
    }
}
```

**3. 프론트엔드 재고 표시**:
```typescript
// components/product-card.tsx
{product.stockQuantity === 0 ? (
  <Badge variant="destructive">품절</Badge>
) : product.stockQuantity <= product.lowStockThreshold ? (
  <Badge variant="warning">재고 {product.stockQuantity}개</Badge>
) : (
  <Badge variant="success">재고 있음</Badge>
)}
```

**4. 관리자 대시보드 - 재고 알림**:
- 재고 부족 상품 목록 표시
- 재고 현황 차트
- 재고 일괄 수정 기능

#### 검증 체크리스트
```
[ ] Pessimistic Lock으로 동시성 제어 확인
[ ] 주문 생성 시 재고 차감 테스트
[ ] 주문 취소 시 재고 복구 테스트
[ ] 품절 상품 주문 시도 시 에러 발생 확인
[ ] 관리자 대시보드에 재고 알림 표시 확인
```

---

### 2. 배송비 계산 로직 구현 🔴

**우선순위**: CRITICAL
**예상 작업 시간**: 4시간
**비즈니스 가치**: ⭐⭐⭐⭐⭐

#### 문제점
- 현재 배송비가 0원으로 하드코딩됨
- 판매자별 합포장 배송비 계산 필요
- 무료 배송 조건 미구현

#### 구현 사항

**1. ShippingPolicy 엔티티**:
```java
@Entity
@Table(name = "shipping_policies")
public class ShippingPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal freeShippingThreshold = new BigDecimal("50000");  // 5만원 이상 무료배송
    private BigDecimal defaultShippingFee = new BigDecimal("3000");      // 기본 배송비
    private BigDecimal jejuShippingFee = new BigDecimal("5000");         // 제주 추가 배송비
    private BigDecimal islandShippingFee = new BigDecimal("5000");       // 도서산간 추가 배송비
}
```

**2. ShippingService 구현**:
```java
@Service
public class ShippingService {

    public BigDecimal calculateShippingFee(List<CartItem> items, String postcode) {
        // 판매자별 그룹핑
        Map<Seller, List<CartItem>> sellerGroups = items.stream()
            .collect(Collectors.groupingBy(item -> item.getProduct().getSeller()));

        BigDecimal totalFee = BigDecimal.ZERO;

        for (Map.Entry<Seller, List<CartItem>> entry : sellerGroups.entrySet()) {
            BigDecimal subtotal = calculateSubtotal(entry.getValue());

            // 무료배송 조건 체크
            if (subtotal.compareTo(freeShippingThreshold) >= 0) {
                continue;  // 무료배송
            }

            // 기본 배송비
            BigDecimal fee = entry.getKey().getShippingFee();

            // 지역별 추가 배송비
            if (isJeju(postcode)) {
                fee = fee.add(jejuShippingFee);
            } else if (isIsland(postcode)) {
                fee = fee.add(islandShippingFee);
            }

            totalFee = totalFee.add(fee);
        }

        return totalFee;
    }

    private boolean isJeju(String postcode) {
        return postcode.startsWith("63");
    }

    private boolean isIsland(String postcode) {
        // 도서산간 우편번호 리스트
        List<String> islandPrefixes = List.of("59", "40", "23");  // 예시
        return islandPrefixes.stream().anyMatch(postcode::startsWith);
    }
}
```

**3. 프론트엔드 배송비 표시**:
```typescript
// components/order-summary.tsx
<div className="shipping-fee">
  <span>배송비</span>
  <span>{shippingFee > 0 ? `${shippingFee.toLocaleString()}원` : '무료'}</span>
</div>
{subtotal < 50000 && (
  <p className="text-sm text-muted-foreground">
    {(50000 - subtotal).toLocaleString()}원 더 구매하시면 무료배송입니다.
  </p>
)}
```

#### 검증 체크리스트
```
[ ] 판매자별 배송비 계산 테스트
[ ] 무료배송 조건 (5만원 이상) 테스트
[ ] 제주/도서산간 추가 배송비 테스트
[ ] 합포장 배송비 계산 테스트
```

---

## Phase 2: High Priority (1-2개월)

### 1. 교환/반품 시스템 🟡

**우선순위**: HIGH
**예상 작업 시간**: 12시간
**비즈니스 가치**: ⭐⭐⭐⭐⭐

#### 이유
- 전자상거래법 요구사항
- 고객 만족도 향상
- 신뢰도 증가

#### 구현 사항

**1. 데이터베이스 스키마**:
```sql
CREATE TABLE exchange_returns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    type ENUM('EXCHANGE', 'RETURN') NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED') DEFAULT 'REQUESTED',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    admin_note TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

**2. ExchangeReturnService 구현**:
```java
@Service
@Transactional
public class ExchangeReturnService {

    public ExchangeReturn requestExchange(Long orderId, ExchangeReturnRequest request) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new NotFoundException("주문을 찾을 수 없습니다."));

        // 주문 완료 후 7일 이내만 교환 가능
        if (order.getCompletedAt().plusDays(7).isBefore(LocalDateTime.now())) {
            throw new BusinessException("교환 가능 기간이 지났습니다.");
        }

        ExchangeReturn exchangeReturn = ExchangeReturn.builder()
            .order(order)
            .type(ExchangeReturnType.EXCHANGE)
            .reason(request.getReason())
            .description(request.getDescription())
            .status(ExchangeReturnStatus.REQUESTED)
            .build();

        return exchangeReturnRepository.save(exchangeReturn);
    }

    public void approveExchangeReturn(Long id, String adminNote) {
        ExchangeReturn exchangeReturn = exchangeReturnRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("교환/반품 요청을 찾을 수 없습니다."));

        exchangeReturn.setStatus(ExchangeReturnStatus.APPROVED);
        exchangeReturn.setApprovedAt(LocalDateTime.now());
        exchangeReturn.setAdminNote(adminNote);

        // 알림 발송
        notificationService.sendExchangeApprovedNotification(exchangeReturn);
    }
}
```

**3. 프론트엔드 UI**:
- 주문 상세 페이지에 "교환 요청" 버튼 추가
- 교환/반품 사유 입력 폼
- 교환/반품 진행 상태 표시
- 관리자 대시보드에서 요청 승인/거부

#### 검증 체크리스트
```
[ ] 주문 완료 후 7일 이내만 요청 가능
[ ] 교환 요청 시 알림 발송
[ ] 관리자 승인/거부 기능
[ ] 교환 완료 시 재고 처리
```

---

### 2. 쿠폰 시스템 확장 🟡

**우선순위**: HIGH
**예상 작업 시간**: 10시간
**비즈니스 가치**: ⭐⭐⭐⭐

#### 현재 상태
- 쿠폰 시스템은 구현되어 있으나 기능 제한적

#### 추가 기능

**1. 쿠폰 유형 확장**:
- 정률 할인 (10%, 20% 등)
- 정액 할인 (5,000원, 10,000원 등)
- 무료배송 쿠폰
- 특정 카테고리 전용 쿠폰
- 신규 가입 쿠폰

**2. 자동 발급 시스템**:
```java
@Service
public class CouponIssueService {

    /**
     * 신규 가입 시 자동 발급
     */
    @EventListener
    public void onUserRegistered(UserRegisteredEvent event) {
        Coupon welcomeCoupon = couponRepository.findByCode("WELCOME2025")
            .orElseThrow(() -> new NotFoundException("웰컴 쿠폰을 찾을 수 없습니다."));

        UserCoupon userCoupon = UserCoupon.builder()
            .user(event.getUser())
            .coupon(welcomeCoupon)
            .issuedAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusDays(30))
            .build();

        userCouponRepository.save(userCoupon);
    }

    /**
     * 첫 구매 완료 시 자동 발급
     */
    @EventListener
    public void onFirstOrderCompleted(OrderCompletedEvent event) {
        if (orderRepository.countByUserId(event.getUser().getId()) == 1) {
            // 첫 구매 감사 쿠폰 발급
            issueCoupon(event.getUser(), "THANKYOU5000");
        }
    }
}
```

**3. 프론트엔드 쿠폰함**:
- 마이페이지에 "내 쿠폰" 메뉴
- 사용 가능/사용 불가 구분
- 쿠폰 코드 입력 기능
- 주문 시 쿠폰 선택 UI

---

### 3. 정산 시스템 자동화 🟡

**우선순위**: HIGH
**예상 작업 시간**: 12시간
**비즈니스 가치**: ⭐⭐⭐⭐

#### 문제점
- 현재 수동으로 정산 작업 수행
- 판매자별 정산 내역 관리 필요

#### 구현 사항

**1. Settlement 엔티티**:
```java
@Entity
@Table(name = "settlements")
public class Settlement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "seller_id")
    private Seller seller;

    @Column(nullable = false)
    private LocalDate settlementDate;  // 정산 날짜

    private BigDecimal totalSales;     // 총 매출
    private BigDecimal totalRefunds;   // 총 환불
    private BigDecimal platformFee;    // 플랫폼 수수료 (3%)
    private BigDecimal paymentFee;     // 결제 수수료 (1.5%)
    private BigDecimal netAmount;      // 순 정산액

    @Enumerated(EnumType.STRING)
    private SettlementStatus status;   // PENDING, COMPLETED

    private LocalDateTime processedAt;
}
```

**2. SettlementScheduler 구현**:
```java
@Component
public class SettlementScheduler {

    @Autowired
    private SettlementService settlementService;

    /**
     * 매일 오전 1시에 전날 정산 처리
     */
    @Scheduled(cron = "0 0 1 * * *")
    public void processDailySettlement() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        settlementService.processSettlement(yesterday);
    }
}
```

**3. Excel 정산 리포트 생성**:
```java
public class SettlementExcelService {

    public ByteArrayInputStream generateSettlementReport(LocalDate date) {
        List<Settlement> settlements = settlementRepository.findBySettlementDate(date);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("정산내역");

            // 헤더
            Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("판매자");
            headerRow.createCell(1).setCellValue("총 매출");
            headerRow.createCell(2).setCellValue("플랫폼 수수료");
            headerRow.createCell(3).setCellValue("순 정산액");

            // 데이터
            int rowIdx = 1;
            for (Settlement settlement : settlements) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(settlement.getSeller().getBusinessName());
                row.createCell(1).setCellValue(settlement.getTotalSales().doubleValue());
                row.createCell(2).setCellValue(settlement.getPlatformFee().doubleValue());
                row.createCell(3).setCellValue(settlement.getNetAmount().doubleValue());
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
```

---

## Phase 3: Medium Priority (3-6개월)

### 1. 주문 배송 추적 시스템 🟢

**우선순위**: MEDIUM
**예상 작업 시간**: 8시간
**비즈니스 가치**: ⭐⭐⭐⭐

#### 구현 사항

**1. 택배사 API 연동**:
- CJ대한통운 API
- 한진택배 API
- 롯데택배 API

**2. TrackingService 구현**:
```java
@Service
public class TrackingService {

    public TrackingInfo getTrackingInfo(String courierCompany, String trackingNumber) {
        switch (courierCompany) {
            case "CJ":
                return getCJTracking(trackingNumber);
            case "HANJIN":
                return getHanjinTracking(trackingNumber);
            default:
                throw new BusinessException("지원하지 않는 택배사입니다.");
        }
    }

    private TrackingInfo getCJTracking(String trackingNumber) {
        // CJ대한통운 API 호출
        String url = "https://www.cjlogistics.com/api/tracking?number=" + trackingNumber;
        // ...
    }
}
```

**3. 프론트엔드 배송 추적**:
```typescript
// app/mypage/orders/[id]/tracking/page.tsx
export default function TrackingPage({ params }: { params: { id: string } }) {
  const { data: tracking } = useQuery(['tracking', params.id], () =>
    apiFetch(`/api/orders/${params.id}/tracking`, { auth: true })
  )

  return (
    <div className="tracking-timeline">
      {tracking.events.map((event) => (
        <div key={event.time} className="tracking-event">
          <div className="time">{event.time}</div>
          <div className="status">{event.status}</div>
          <div className="location">{event.location}</div>
        </div>
      ))}
    </div>
  )
}
```

---

### 2. 리뷰 시스템 강화 🟢

**우선순위**: MEDIUM
**예상 작업 시간**: 6시간
**비즈니스 가치**: ⭐⭐⭐

#### 추가 기능

**1. 이미지 리뷰**:
- 최대 5장까지 이미지 업로드
- 이미지 리사이징 및 최적화
- 썸네일 생성

**2. 리뷰 도움됨/신고**:
```java
@Entity
@Table(name = "review_helpfulness")
public class ReviewHelpfulness {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Review review;

    @ManyToOne
    private User user;

    private boolean helpful;  // true: 도움됨, false: 도움안됨
}
```

**3. 베스트 리뷰 자동 선정**:
- 높은 평점 + 많은 도움됨 + 이미지 있음 = 베스트 리뷰

**4. 리뷰 작성 포인트 지급**:
- 텍스트 리뷰: 100 포인트
- 이미지 리뷰: 300 포인트

---

### 3. 재입고 알림 🟢

**우선순위**: MEDIUM
**예상 작업 시간**: 4시간
**비즈니스 가치**: ⭐⭐⭐

#### 구현 사항

**1. RestockNotification 엔티티**:
```sql
CREATE TABLE restock_notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_option_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified BOOLEAN DEFAULT FALSE,
    notified_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_option_id) REFERENCES product_options(id),
    UNIQUE KEY (user_id, product_option_id)
);
```

**2. 재입고 알림 발송**:
```java
@EventListener
public void onStockIncreased(StockIncreasedEvent event) {
    List<RestockNotification> notifications = restockNotificationRepository
        .findByProductOptionIdAndNotifiedFalse(event.getProductOptionId());

    for (RestockNotification notification : notifications) {
        // 이메일 발송
        emailService.sendRestockNotification(
            notification.getUser().getEmail(),
            event.getProduct().getName()
        );

        // 알림 상태 업데이트
        notification.setNotified(true);
        notification.setNotifiedAt(LocalDateTime.now());
    }

    restockNotificationRepository.saveAll(notifications);
}
```

**3. 프론트엔드 UI**:
```typescript
// 품절 상품 페이지
{product.stockQuantity === 0 && (
  <Button onClick={() => subscribeRestock(product.id)}>
    재입고 알림 신청
  </Button>
)}
```

---

## Phase 4: Low Priority (6개월+)

### 1. 포인트/적립금 시스템 🔵

**우선순위**: LOW
**예상 작업 시간**: 10시간
**비즈니스 가치**: ⭐⭐⭐

#### 구현 사항

**1. Point 엔티티**:
```java
@Entity
@Table(name = "points")
public class Point {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User user;

    private Integer amount;  // 적립/사용 금액 (음수: 사용, 양수: 적립)

    @Enumerated(EnumType.STRING)
    private PointType type;  // EARNED, USED, EXPIRED

    private String description;  // "주문 #12345 적립", "주문 #12345 사용"

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;  // 적립금 만료일 (1년)
}
```

**2. 적립 규칙**:
- 구매 금액의 1% 적립
- 리뷰 작성 시 추가 적립
- 출석 체크 이벤트 포인트
- 친구 추천 포인트

**3. 사용 규칙**:
- 1,000포인트 이상부터 사용 가능
- 최대 결제 금액의 50%까지 사용
- 배송비에는 사용 불가

---

### 2. 위시리스트 공유 기능 🔵

**우선순위**: LOW
**예상 작업 시간**: 4시간
**비즈니스 가치**: ⭐⭐

#### 구현 사항

**1. 위시리스트 공유 링크 생성**:
```java
@Service
public class WishlistService {

    public String generateShareLink(Long userId) {
        String shareToken = UUID.randomUUID().toString();

        WishlistShare share = WishlistShare.builder()
            .userId(userId)
            .shareToken(shareToken)
            .expiresAt(LocalDateTime.now().plusDays(7))
            .build();

        wishlistShareRepository.save(share);

        return "https://todaymart.co.kr/wishlist/share/" + shareToken;
    }
}
```

**2. 프론트엔드**:
- 위시리스트 페이지에 "공유하기" 버튼
- 공유 링크 복사
- 카카오톡, 페이스북 공유

---

### 3. 상품 비교 기능 🔵

**우선순위**: LOW
**예상 작업 시간**: 6시간
**비즈니스 가치**: ⭐⭐

#### 구현 사항

**1. 최대 3개 상품 비교**:
```typescript
// components/product-compare.tsx
export function ProductCompare() {
  const [compareList, setCompareList] = useState<Product[]>([])

  const addToCompare = (product: Product) => {
    if (compareList.length >= 3) {
      toast.error('최대 3개까지 비교 가능합니다.')
      return
    }
    setCompareList([...compareList, product])
  }

  return (
    <div className="compare-grid">
      {compareList.map((product) => (
        <div key={product.id} className="compare-item">
          <Image src={product.imageUrl} />
          <h3>{product.name}</h3>
          <p>가격: {product.price.toLocaleString()}원</p>
          <p>평점: {product.rating}점</p>
          <p>리뷰: {product.reviewCount}개</p>
        </div>
      ))}
    </div>
  )
}
```

---

### 4. 상품 Q&A 게시판 🔵

**우선순위**: LOW
**예상 작업 시간**: 8시간
**비즈니스 가치**: ⭐⭐

#### 구현 사항

**1. ProductQna 엔티티**:
```java
@Entity
@Table(name = "product_qnas")
public class ProductQna {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Product product;

    @ManyToOne
    private User user;

    @Column(nullable = false)
    private String question;

    private String answer;

    private LocalDateTime answeredAt;

    private boolean isSecret;  // 비밀글 여부

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
```

**2. 기능**:
- 로그인 사용자만 질문 작성 가능
- 판매자 또는 관리자만 답변 가능
- 비밀글 옵션 (작성자와 판매자만 조회)
- 답변 알림 발송

---

## 구현 완료된 기능

### 인증 및 사용자 관리
- [x] 회원가입/로그인
- [x] JWT 기반 인증
- [x] 리프레시 토큰 시스템
- [x] OAuth2 소셜 로그인 (네이버, 카카오, 구글)
- [x] 비밀번호 찾기/재설정
- [x] 프로필 수정
- [x] 배송지 관리

### 상품 관리
- [x] 상품 목록/상세 조회
- [x] 상품 검색
- [x] 상품 옵션 시스템
- [x] 상품 이미지 다중 업로드
- [x] 카테고리별 조회

### 주문 및 결제
- [x] 장바구니
- [x] 주문 생성
- [x] Toss Payments 결제 연동
- [x] 주문 취소
- [x] 주문 내역 조회

### 리뷰 시스템
- [x] 리뷰 작성/수정/삭제
- [x] 별점 평가
- [x] 상품별 평균 평점 계산

### 위시리스트
- [x] 찜하기/찜 해제
- [x] 위시리스트 조회

### 관리자 기능
- [x] 대시보드 (통계)
- [x] 상품 관리 (CRUD)
- [x] 주문 관리
- [x] Excel 내보내기
- [x] 크롤러 관리

### 기타
- [x] 파일 업로드/다운로드
- [x] SSE 기반 실시간 알림
- [x] 고객센터 (공지사항, FAQ, 1:1 문의)

---

## 우선순위 매트릭스

```
High Value, High Effort:
- 교환/반품 시스템
- 정산 시스템 자동화

High Value, Low Effort:
- 재고 관리 시스템 ⭐
- 배송비 계산 로직 ⭐
- 쿠폰 시스템 확장

Low Value, High Effort:
- 포인트/적립금 시스템
- 상품 Q&A 게시판

Low Value, Low Effort:
- 재입고 알림
- 위시리스트 공유
- 상품 비교
```

---

**작성자**: Claude Code
**마지막 업데이트**: 2025-11-15
