// ========== Product Types ==========

export interface Product {
  id: number
  name: string
  category: string
  origin: string
  description?: string
  price: number
  discountRate: number | null
  discountedPrice: number
  stock: number
  imageUrl: string

  // 새로 추가된 필드
  supplyPrice?: number  // 공급가 (도매가)
  shippingFee: number  // 배송비
  canCombineShipping: boolean  // 합포장 가능 여부
  combineShippingUnit?: number  // 합포장 단위
  courierCompany?: string  // 택배사
  minOrderQuantity: number  // 최소 주문 수량
  maxOrderQuantity?: number  // 최대 주문 수량

  createdAt: string
  updatedAt?: string
  averageRating?: number
  reviewCount?: number
  optionCount?: number

  // Relations
  images?: ProductImage[]
  options?: ProductOption[]
  seller?: Seller
}

export interface ProductImage {
  id: number
  imageUrl: string
  displayOrder: number
}

export interface ProductOption {
  id: number
  optionName: string
  optionValue: string
  additionalPrice: number | null
  stock: number
  isAvailable: boolean
}

export interface Seller {
  id: number
  name: string
  businessNumber?: string
  contactEmail?: string
  contactPhone?: string
}

// ========== Order Types ==========

// 통합된 주문 상태
export type OrderStatus =
  | 'PENDING_PAYMENT'  // 결제 대기
  | 'PAYMENT_FAILED'   // 결제 실패
  | 'PAID'             // 결제 완료
  | 'PREPARING'        // 상품 준비중
  | 'SHIPPED'          // 배송중
  | 'DELIVERED'        // 배송 완료
  | 'CANCELLED'        // 주문 취소

export const OrderStatusLabel: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '결제 대기',
  PAYMENT_FAILED: '결제 실패',
  PAID: '결제 완료',
  PREPARING: '상품 준비중',
  SHIPPED: '배송중',
  DELIVERED: '배송 완료',
  CANCELLED: '주문 취소',
}

export interface Order {
  id: number
  orderNumber: string
  user: {
    id: number
    name: string
    email: string
  }
  orderItems: OrderItem[]
  totalAmount: number
  orderStatus: OrderStatus  // 통합된 상태
  createdAt: string
  updatedAt: string

  // Shipping information
  recipientName: string
  recipientPhone: string
  shippingAddressLine1: string
  shippingAddressLine2?: string
  shippingPostcode: string
  senderName?: string
  senderPhone?: string
  deliveryMessage?: string

  // Delivery information
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  confirmedAt?: string

  // Cancellation information
  cancellationReason?: string
  cancelledAt?: string
}

export interface OrderItem {
  id: number
  product: Product
  productOption?: ProductOption
  quantity: number
  price: number
}

// ========== Cart Types ==========

export interface Cart {
  id: number
  user: {
    id: number
    email: string
  }
  cartItems: CartItem[]
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  id: number
  product: Product
  productOption?: ProductOption
  quantity: number
  price: number
}

// ========== User Types ==========

export interface User {
  id: number
  email: string
  name: string
  phone?: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  updatedAt: string
}

// ========== Review Types ==========

export interface Review {
  id: number
  user: {
    id: number
    name: string
  }
  product: {
    id: number
    name: string
  }
  rating: number
  content: string
  createdAt: string
  updatedAt: string
}

// ========== Wishlist Types ==========

export interface WishlistItem {
  id: number
  product: Product
  createdAt: string
}

// ========== Request/Response DTOs ==========

export interface AddToCartRequest {
  productId: number
  productOptionId?: number
  quantity: number
}

export interface OrderRequest {
  items: {
    productId: number
    quantity: number
  }[]
  recipientName: string
  recipientPhone: string
  shippingAddressLine1: string
  shippingAddressLine2?: string
  shippingPostcode: string
  senderName?: string
  senderPhone?: string
  deliveryMessage?: string
}

export interface ProductRequest {
  name: string
  category: string
  origin: string
  description?: string
  price: number
  discountRate?: number
  stock: number
  imageUrl?: string

  // 새로 추가된 필드
  supplyPrice?: number
  shippingFee: number
  canCombineShipping: boolean
  combineShippingUnit?: number
  courierCompany?: string
  minOrderQuantity: number
  maxOrderQuantity?: number

  sellerId?: number
}

// ========== API Response Types ==========

export interface ApiError {
  message: string
  status: number
  payload?: unknown
}

export interface PaginatedResponse<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
  }
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}
