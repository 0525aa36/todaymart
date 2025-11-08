# Database ERD - Korean Agri Shop

이 다이어그램은 프로젝트의 데이터베이스 구조를 시각화한 것입니다.

## How to View

1. https://mermaid.js.org/에 방문
2. 아래의 Mermaid 코드를 복사해서 붙여넣기
3. 또는 GitHub에서 이 파일을 열면 자동으로 렌더링됩니다

## ERD Diagram

```mermaid
erDiagram
    users ||--o{ orders : "places"
    users ||--|| carts : "has"
    users ||--o{ payments : "makes"
    users ||--o{ reviews : "writes"
    users ||--o{ wishlist_items : "saves"
    users ||--o{ notifications : "receives"
    users ||--o{ user_addresses : "has"

    products ||--o{ product_images : "has"
    products ||--o{ product_options : "has"
    products }o--|| sellers : "sold by"
    products ||--o{ order_items : "included in"
    products ||--o{ cart_items : "added to"
    products ||--o{ reviews : "receives"
    products ||--o{ wishlist_items : "favorited in"

    orders ||--o{ order_items : "contains"
    orders ||--|| payments : "paid by"

    carts ||--o{ cart_items : "contains"

    cart_items }o--o| product_options : "may have"

    sellers ||--o{ settlements : "receives"

    users {
        bigint id PK
        varchar email UK "NOT NULL"
        varchar passwordHash "NOT NULL"
        varchar name "NOT NULL"
        varchar phone "NOT NULL"
        varchar addressLine1 "NOT NULL"
        varchar addressLine2
        varchar postcode
        date birthDate "NOT NULL"
        varchar gender
        varchar role "DEFAULT USER"
        boolean enabled "DEFAULT true"
        timestamp createdAt
        timestamp updatedAt
    }

    products {
        bigint id PK
        bigint seller_id FK
        varchar name "NOT NULL"
        varchar category "NOT NULL"
        varchar origin "NOT NULL"
        text description
        decimal price "NOT NULL"
        decimal discountRate
        int stock "NOT NULL"
        varchar imageUrl "deprecated"
        timestamp createdAt
        timestamp updatedAt
    }

    product_options {
        bigint id PK
        bigint product_id FK "NOT NULL"
        varchar name "NOT NULL"
        decimal additionalPrice "DEFAULT 0"
        int stock "DEFAULT 0"
        boolean isRequired "DEFAULT false"
        varchar optionName "legacy"
        varchar optionValue "legacy"
        boolean isAvailable "DEFAULT true"
    }

    product_images {
        bigint id PK
        bigint product_id FK "NOT NULL"
        varchar imageUrl "NOT NULL"
        enum imageType "MAIN/DETAIL/THUMBNAIL"
        int displayOrder "DEFAULT 0"
        timestamp createdAt
    }

    orders {
        bigint id PK
        bigint user_id FK "NOT NULL"
        varchar orderNumber UK "NOT NULL"
        decimal totalAmount "NOT NULL"
        enum orderStatus "PENDING/PAID/SHIPPED/DELIVERED/CANCELLED"
        enum paymentStatus "PENDING/PAID/FAILED"
        varchar recipientName "NOT NULL"
        varchar recipientPhone "NOT NULL"
        varchar shippingAddressLine1 "NOT NULL"
        varchar shippingAddressLine2
        varchar shippingPostcode "NOT NULL"
        varchar senderName
        varchar senderPhone
        varchar deliveryMessage
        varchar cancellationReason
        varchar trackingNumber
        timestamp cancelledAt
        timestamp shippedAt
        timestamp deliveredAt
        timestamp confirmedAt
        timestamp createdAt
        timestamp updatedAt
    }

    order_items {
        bigint id PK
        bigint order_id FK "NOT NULL"
        bigint product_id FK "NOT NULL"
        int quantity "NOT NULL"
        decimal price "NOT NULL, snapshot"
    }

    payments {
        bigint id PK
        bigint order_id FK "NOT NULL, unique"
        bigint user_id FK
        decimal amount "NOT NULL"
        enum status "PENDING/PAID/FAILED"
        varchar transactionId "paymentKey"
        varchar method
        timestamp approvedAt
        decimal refundAmount
        timestamp refundedAt
        varchar refundTransactionId
        varchar refundReason
        timestamp paymentDate
    }

    carts {
        bigint id PK
        bigint user_id FK "NOT NULL, unique"
        timestamp createdAt
        timestamp updatedAt
    }

    cart_items {
        bigint id PK
        bigint cart_id FK "NOT NULL"
        bigint product_id FK "NOT NULL"
        bigint product_option_id FK "nullable"
        int quantity "NOT NULL"
        decimal price "NOT NULL, snapshot"
    }

    reviews {
        bigint id PK
        bigint product_id FK "NOT NULL"
        bigint user_id FK "NOT NULL"
        int rating "1-5 stars, NOT NULL"
        varchar title "NOT NULL"
        text content
        timestamp createdAt
        timestamp updatedAt
    }

    wishlist_items {
        bigint id PK
        bigint user_id FK "NOT NULL"
        bigint product_id FK "NOT NULL"
        timestamp createdAt
    }

    notifications {
        bigint id PK
        bigint user_id FK "nullable, for admin"
        varchar title "NOT NULL"
        text message "NOT NULL"
        enum type "ORDER/PAYMENT/DELIVERY/etc"
        boolean isRead "DEFAULT false"
        timestamp createdAt
    }

    user_addresses {
        bigint id PK
        bigint user_id FK "NOT NULL"
        varchar label "NOT NULL"
        varchar recipient "NOT NULL"
        varchar phone "NOT NULL"
        varchar postcode "NOT NULL"
        varchar addressLine1 "NOT NULL"
        varchar addressLine2
        boolean isDefault "NOT NULL"
        timestamp createdAt
        timestamp updatedAt
    }

    sellers {
        bigint id PK
        varchar name "NOT NULL"
        varchar businessNumber UK "NOT NULL"
        varchar representative "NOT NULL"
        varchar phone "NOT NULL"
        varchar email "NOT NULL"
        varchar address "NOT NULL"
        varchar bankName
        varchar accountNumber
        varchar accountHolder
        decimal commissionRate "DEFAULT 10.0"
        boolean isActive "DEFAULT true"
        text memo
        timestamp createdAt
        timestamp updatedAt
    }

    settlements {
        bigint id PK
        bigint seller_id FK "NOT NULL"
        date startDate "NOT NULL"
        date endDate "NOT NULL"
        int orderCount "DEFAULT 0"
        decimal totalSales "DEFAULT 0"
        decimal commissionRate "DEFAULT 0"
        decimal commissionAmount "DEFAULT 0"
        decimal netAmount "DEFAULT 0"
        enum status "PENDING/APPROVED/PAID/CANCELLED"
        date paymentDate
        varchar paymentMethod
        text memo
        timestamp createdAt
        timestamp updatedAt
    }

    banners {
        bigint id PK
        varchar title "NOT NULL"
        varchar description
        varchar imageUrl
        varchar linkUrl
        int displayOrder "DEFAULT 0"
        boolean isActive "DEFAULT true"
        varchar backgroundColor
        varchar textColor
        timestamp createdAt
        timestamp updatedAt
    }
```

## Entity Descriptions

### Core Entities

- **users**: 회원 정보 (이메일 로그인, JWT 인증)
- **products**: 상품 정보 (농산물 상품)
- **product_options**: 상품 옵션 (크기, 무게 변형)
- **product_images**: 상품 이미지 (메인, 상세, 썸네일)

### Order & Payment

- **orders**: 주문 정보 (배송지, 주문 상태 관리)
- **order_items**: 주문 상품 목록 (가격 스냅샷)
- **payments**: 결제 정보 (Toss Payments 연동, 환불 정보)

### Shopping

- **carts**: 장바구니 (사용자당 1개)
- **cart_items**: 장바구니 상품 목록

### User Interaction

- **reviews**: 상품 리뷰 (별점 1-5)
- **wishlist_items**: 위시리스트 (찜 기능)
- **notifications**: 알림 (주문, 결제, 배송 알림)
- **user_addresses**: 배송지 관리

### Seller & Settlement

- **sellers**: 판매자/농가 정보
- **settlements**: 판매자 정산 관리

### Marketing

- **banners**: 배너 관리 (메인 페이지 배너)

## Key Relationships

1. **User ↔ Cart**: 1:1 관계, 사용자당 하나의 장바구니
2. **Product ↔ ProductOption**: 1:N, 상품은 여러 옵션 가질 수 있음
3. **Order ↔ Payment**: 1:1, 주문당 하나의 결제
4. **Product ↔ Seller**: N:1, 상품은 하나의 판매자에 속함
5. **Seller ↔ Settlement**: 1:N, 판매자는 여러 정산 기록 가능

## Notes

- **Price Snapshots**: `order_items`와 `cart_items`는 가격 스냅샷 저장 (가격 변동에도 주문 당시 가격 유지)
- **Soft Delete**: 대부분 엔티티는 물리 삭제, 필요시 isActive 플래그 사용
- **Timestamps**: 모든 엔티티는 `createdAt`, 주요 엔티티는 `updatedAt` 자동 관리
- **Enums**: OrderStatus, PaymentStatus, SettlementStatus, ImageType, NotificationType

## Tech Stack

- **ORM**: Spring Data JPA + Hibernate
- **Database**: MySQL 8.0
- **Connection Pool**: HikariCP
- **Auto DDL**: `hibernate.ddl-auto=update` (개발 환경)
