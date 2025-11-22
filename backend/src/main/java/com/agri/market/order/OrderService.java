package com.agri.market.order;

import com.agri.market.cart.Cart;
import com.agri.market.cart.CartItem;
import com.agri.market.cart.CartRepository;
import com.agri.market.coupon.Coupon;
import com.agri.market.coupon.UserCoupon;
import com.agri.market.coupon.UserCouponService;
import com.agri.market.dto.OrderRequest;
import com.agri.market.dto.OrderResponse;
import com.agri.market.exception.BusinessException;
import com.agri.market.exception.ForbiddenException;
import com.agri.market.notification.NotificationService;
import com.agri.market.notification.NotificationType;
import com.agri.market.payment.Payment;
import com.agri.market.payment.PaymentRepository;
import com.agri.market.product.Product;
import com.agri.market.product.ProductOption;
import com.agri.market.product.ProductOptionRepository;
import com.agri.market.product.ProductRepository;
import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductOptionRepository productOptionRepository;
    private final CartRepository cartRepository;
    private final PaymentRepository paymentRepository;

    private final NotificationService notificationService;
    private final UserCouponService userCouponService;
    private com.agri.market.payment.PaymentService paymentService;

    public OrderService(OrderRepository orderRepository, OrderItemRepository orderItemRepository,
                        UserRepository userRepository, ProductRepository productRepository,
                        ProductOptionRepository productOptionRepository,
                        CartRepository cartRepository, PaymentRepository paymentRepository,
                        NotificationService notificationService, UserCouponService userCouponService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.productOptionRepository = productOptionRepository;
        this.cartRepository = cartRepository;
        this.paymentRepository = paymentRepository;
        this.notificationService = notificationService;
        this.userCouponService = userCouponService;
    }

    /**
     * PaymentService 의존성 주입 (순환 참조 방지를 위한 Setter Injection + @Lazy)
     */
    @org.springframework.beans.factory.annotation.Autowired
    public void setPaymentService(@org.springframework.context.annotation.Lazy com.agri.market.payment.PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @RateLimiter(name = "order")
    @Transactional
    public Order createOrder(String userEmail, OrderRequest orderRequest) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        Order order = new Order();
        order.setUser(user);
        order.setOrderNumber("ORDER_" + System.currentTimeMillis());
        order.setRecipientName(orderRequest.getRecipientName());
        order.setRecipientPhone(orderRequest.getRecipientPhone());
        order.setShippingAddressLine1(orderRequest.getShippingAddressLine1());
        order.setShippingAddressLine2(orderRequest.getShippingAddressLine2());
        order.setShippingPostcode(orderRequest.getShippingPostcode());
        
        // 송하인 정보 설정 (기본값은 주문자와 동일)
        order.setSenderName(orderRequest.getSenderName() != null ? orderRequest.getSenderName() : user.getName());
        order.setSenderPhone(orderRequest.getSenderPhone() != null ? orderRequest.getSenderPhone() : user.getPhone());
        
        // 배송 메시지 설정
        order.setDeliveryMessage(orderRequest.getDeliveryMessage());

        order.setOrderStatus(OrderStatus.PENDING_PAYMENT);

        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalShippingFee = BigDecimal.ZERO;
        Set<OrderItem> orderItems = new HashSet<>();

        for (OrderRequest.OrderItemRequest itemRequest : orderRequest.getItems()) {
            // Pessimistic Lock을 사용하여 동시성 제어
            Product product = productRepository.findByIdWithLock(itemRequest.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + itemRequest.getProductId()));

            // 최소 주문 수량 검증
            if (product.getMinOrderQuantity() != null && itemRequest.getQuantity() < product.getMinOrderQuantity()) {
                throw new RuntimeException(product.getName() + " 상품의 최소 주문 수량은 " + product.getMinOrderQuantity() + "개입니다.");
            }

            // 최대 주문 수량 검증
            if (product.getMaxOrderQuantity() != null && itemRequest.getQuantity() > product.getMaxOrderQuantity()) {
                throw new RuntimeException(product.getName() + " 상품의 최대 주문 수량은 " + product.getMaxOrderQuantity() + "개입니다.");
            }

            if (product.getStock() < itemRequest.getQuantity()) {
                throw new RuntimeException("Not enough stock for product: " + product.getName());
            }

            // 옵션 처리
            ProductOption productOption = null;
            if (itemRequest.getProductOptionId() != null) {
                productOption = productOptionRepository.findById(itemRequest.getProductOptionId())
                        .orElseThrow(() -> new RuntimeException("Product option not found with id: " + itemRequest.getProductOptionId()));

                // 옵션이 해당 상품에 속하는지 검증
                if (!productOption.getProduct().getId().equals(product.getId())) {
                    throw new RuntimeException("Product option does not belong to this product");
                }

                // 옵션 재고 확인
                if (productOption.getStock() < itemRequest.getQuantity()) {
                    throw new RuntimeException("Not enough stock for option: " + productOption.getName());
                }
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setProductOption(productOption);
            orderItem.setQuantity(itemRequest.getQuantity());

            // 가격 계산: 할인된 가격 + 옵션 추가 가격
            BigDecimal itemPrice = product.getDiscountedPrice();
            System.out.println("[OrderService] Product: " + product.getName() +
                             ", Original Price: " + product.getPrice() +
                             ", Discounted Price: " + product.getDiscountedPrice());
            if (productOption != null && productOption.getAdditionalPrice() != null) {
                System.out.println("[OrderService] Option: " + productOption.getName() +
                                 ", Additional Price: " + productOption.getAdditionalPrice());
                itemPrice = itemPrice.add(productOption.getAdditionalPrice());
            }
            System.out.println("[OrderService] Final Item Price: " + itemPrice);
            orderItem.setPrice(itemPrice);
            orderItems.add(orderItem);

            totalAmount = totalAmount.add(itemPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity())));

            // 합포장 배송비 계산
            BigDecimal itemShippingFee = BigDecimal.ZERO;
            if (product.getShippingFee() != null && product.getShippingFee().compareTo(BigDecimal.ZERO) > 0) {
                // 합포장 가능 여부 확인 (null-safe)
                Boolean canCombine = product.getCanCombineShipping();
                Integer combineUnit = product.getCombineShippingUnit();

                if (Boolean.TRUE.equals(canCombine) && combineUnit != null && combineUnit > 0) {
                    // 합포장 가능한 경우: 박스 수 계산
                    int boxes = (int) Math.ceil((double) itemRequest.getQuantity() / combineUnit);
                    itemShippingFee = product.getShippingFee().multiply(BigDecimal.valueOf(boxes));
                } else {
                    // 합포장 불가능한 경우: 각 개별로 배송비
                    itemShippingFee = product.getShippingFee().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
                }
            }
            totalShippingFee = totalShippingFee.add(itemShippingFee);

            // 재고 차감은 결제 완료 후에 수행 (주문 생성 시에는 하지 않음)
        }

        order.setOrderItems(orderItems);
        order.setTotalAmount(totalAmount);
        order.setShippingFee(totalShippingFee);

        // 쿠폰 적용 로직
        BigDecimal couponDiscountAmount = BigDecimal.ZERO;
        UserCoupon appliedUserCoupon = null;

        if (orderRequest.getCouponId() != null) {
            // UserCoupon 조회 및 검증
            appliedUserCoupon = userCouponService.getUserCouponById(orderRequest.getCouponId());

            // 쿠폰 사용 가능 여부 확인
            if (!appliedUserCoupon.isAvailable()) {
                if (appliedUserCoupon.isUsed()) {
                    throw new BusinessException("이미 사용된 쿠폰입니다.", "COUPON_ALREADY_USED");
                }
                if (appliedUserCoupon.isExpired()) {
                    throw new BusinessException("만료된 쿠폰입니다.", "COUPON_EXPIRED");
                }
                throw new BusinessException("사용할 수 없는 쿠폰입니다.", "COUPON_UNAVAILABLE");
            }

            // 쿠폰 소유자 확인
            if (!appliedUserCoupon.getUser().getId().equals(user.getId())) {
                throw new BusinessException("본인의 쿠폰만 사용할 수 있습니다.", "COUPON_OWNER_MISMATCH");
            }

            Coupon coupon = appliedUserCoupon.getCoupon();

            // 최소 주문 금액 확인
            if (!coupon.meetsMinOrderAmount(totalAmount)) {
                throw new BusinessException(
                    String.format("최소 주문 금액 %,d원 이상부터 사용 가능합니다.", coupon.getMinOrderAmount().intValue()),
                    "COUPON_MIN_ORDER_AMOUNT_NOT_MET"
                );
            }

            // 할인 금액 계산
            couponDiscountAmount = coupon.calculateDiscount(totalAmount);
            order.setAppliedCoupon(coupon);
            order.setCouponDiscountAmount(couponDiscountAmount);
        }

        // 최종 금액 계산 (상품 금액 - 쿠폰 할인 + 배송비)
        BigDecimal finalAmount = totalAmount.subtract(couponDiscountAmount).add(order.getShippingFee());
        order.setFinalAmount(finalAmount);

        Order savedOrder = orderRepository.save(order);
        orderItemRepository.saveAll(orderItems);

        // 쿠폰 사용 처리
        if (appliedUserCoupon != null) {
            userCouponService.useCoupon(appliedUserCoupon.getId(), savedOrder);
        }

        // 주문 생성 시에는 장바구니를 비우지 않음 (결제 완료 후에 비움)

        // 알림 발송 (비동기 처리로 트랜잭션 성능 향상)
        // 사용자에게 주문 완료 알림
        notificationService.sendToUserAsync(
            user.getEmail(),
            "주문이 완료되었습니다",
            "주문번호 " + savedOrder.getId() + "번 주문이 성공적으로 접수되었습니다.",
            NotificationType.ORDER_STATUS_CHANGED
        );

        // 관리자에게 새 주문 알림
        notificationService.sendToAllAdminsAsync(
            "새로운 주문이 접수되었습니다",
            "주문번호 " + savedOrder.getId() + "번 (" + user.getName() + "님)",
            NotificationType.NEW_ORDER
        );

        // 장바구니는 결제 완료 후에만 삭제 (주문 생성 시점에는 삭제하지 않음)
        // cartRepository.findByUser(user).ifPresent(cartRepository::delete);

        return savedOrder;
    }

    public Optional<Order> getOrderById(Long orderId) {
        return orderRepository.findById(orderId);
    }

    /**
     * 주문 조회 (권한 검증 포함)
     * @param orderId 주문 ID
     * @param userEmail 사용자 이메일
     * @param authentication 인증 정보
     * @return 주문 정보
     */
    @Transactional(readOnly = true)
    public Optional<Order> getOrderByIdWithAuth(Long orderId, String userEmail, Authentication authentication) {
        Optional<Order> orderOpt = orderRepository.findByIdWithItems(orderId);

        if (orderOpt.isEmpty()) {
            return Optional.empty();
        }

        Order order = orderOpt.get();

        // ADMIN 권한이 있으면 모든 주문 조회 가능
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            // Lazy loading 초기화
            order.getUser().getName();
            order.getOrderItems().forEach(item -> {
                item.getProduct().getName();
            });
            // Initialize appliedCoupon if present
            if (order.getAppliedCoupon() != null) {
                order.getAppliedCoupon().getName();
            }
            return Optional.of(order);
        }

        // 일반 사용자는 본인 주문만 조회 가능
        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new ForbiddenException("You are not authorized to view this order");
        }

        // Lazy loading 초기화
        order.getUser().getName();
        order.getOrderItems().forEach(item -> {
            item.getProduct().getName();
        });
        // Initialize appliedCoupon if present
        if (order.getAppliedCoupon() != null) {
            order.getAppliedCoupon().getName();
        }

        return Optional.of(order);
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        List<Order> orders = orderRepository.findByUserWithItems(user);

        // Lazy loading 초기화 (이미 eager loading되었지만 안전을 위해 유지)
        orders.forEach(order -> {
            order.getUser().getName(); // User 초기화
            if (order.getOrderItems() != null) {
                order.getOrderItems().size(); // OrderItems 초기화
                order.getOrderItems().forEach(item -> {
                    item.getProduct().getName(); // Product 초기화
                });
            }
            // Initialize appliedCoupon if present
            if (order.getAppliedCoupon() != null) {
                order.getAppliedCoupon().getName();
            }
        });

        return orders;
    }

    /**
     * 사용자의 주문 목록을 OrderResponse DTO로 반환 (트랜잭션 내에서 변환)
     * @param userEmail 사용자 이메일
     * @return OrderResponse 리스트
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrderResponsesByUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        List<Order> orders = orderRepository.findByUserWithItems(user);

        // 트랜잭션 내에서 모든 연관 엔티티를 초기화하고 DTO로 변환
        return orders.stream()
                .map(order -> {
                    // Lazy loading 초기화
                    order.getUser().getName();
                    if (order.getOrderItems() != null) {
                        order.getOrderItems().forEach(item -> {
                            if (item.getProduct() != null) {
                                item.getProduct().getName();
                                item.getProduct().getImageUrl();
                            }
                            if (item.getProductOption() != null) {
                                item.getProductOption().getName();
                            }
                        });
                    }
                    if (order.getAppliedCoupon() != null) {
                        order.getAppliedCoupon().getName();
                    }

                    // DTO로 변환 (트랜잭션 내에서)
                    return OrderResponse.from(order);
                })
                .collect(Collectors.toList());
    }

    /**
     * 주문 취소 또는 결제 실패 시 재고 복구
     * @param orderId 주문 ID
     */
    @Transactional
    public void restoreStock(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        for (OrderItem orderItem : order.getOrderItems()) {
            Product product = orderItem.getProduct();
            // Pessimistic Lock으로 동시성 제어
            Product lockedProduct = productRepository.findByIdWithLock(product.getId())
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + product.getId()));

            // 재고 복구
            lockedProduct.setStock(lockedProduct.getStock() + orderItem.getQuantity());
            productRepository.save(lockedProduct);
        }
    }

    /**
     * 주문 취소
     * @param orderId 주문 ID
     * @param userEmail 사용자 이메일 (권한 확인용)
     * @param cancellationReason 취소 사유
     * @return 취소된 주문
     */
    @Transactional
    public Order cancelOrder(Long orderId, String userEmail, String cancellationReason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        // 본인 주문인지 확인
        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized: This order does not belong to you");
        }

        // 취소 가능 상태 검증
        if (order.getOrderStatus() == OrderStatus.SHIPPED ||
            order.getOrderStatus() == OrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot cancel order: Order already shipped or delivered");
        }

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new RuntimeException("Order is already cancelled");
        }

        // 재고 복구
        restoreStock(orderId);

        // 쿠폰 사용 취소
        if (order.getAppliedCoupon() != null) {
            // 주문에 사용된 UserCoupon 찾기
            UserCoupon userCoupon = userCouponService.findByOrder(order);
            if (userCoupon != null && userCoupon.isUsed()) {
                userCouponService.cancelCouponUsage(userCoupon.getId());
            }
        }

        // 결제 완료된 경우 환불 처리 (실제 Toss Payments API 호출)
        if (order.getOrderStatus() == OrderStatus.PAID ||
            order.getOrderStatus() == OrderStatus.PREPARING ||
            order.getOrderStatus() == OrderStatus.SHIPPED) {
            Payment payment = paymentRepository.findByOrder(order)
                    .orElse(null);

            if (payment != null && payment.getRefundAmount() == null) {
                try {
                    // Toss Payments 취소 API 호출
                    String paymentKey = payment.getTransactionId();
                    java.util.Map<String, Object> cancelResult =
                        paymentService.callTossCancelApiPublic(paymentKey, payment.getAmount(), cancellationReason);

                    // 환불 처리
                    payment.setRefundAmount(payment.getAmount());
                    payment.setRefundedAt(LocalDateTime.now());
                    payment.setRefundTransactionId((String) cancelResult.get("transactionKey"));
                    payment.setRefundReason(cancellationReason);
                    payment.setStatus(PaymentStatus.FAILED);
                    paymentRepository.save(payment);
                } catch (Exception e) {
                    // Toss API 호출 실패 시에도 주문 상태는 취소 처리 (수동 환불 필요)
                    throw new RuntimeException("주문 취소는 완료되었으나 자동 환불 처리 실패: " + e.getMessage() +
                                             ". 관리자에게 문의하여 수동 환불을 요청하세요.", e);
                }
            }
        }

        // 주문 상태 변경
        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(cancellationReason);
        order.setCancelledAt(LocalDateTime.now());

        return orderRepository.save(order);
    }

    /**
     * 구매 확정 (사용자가 배송 완료 확인)
     * @param orderId 주문 ID
     * @param userEmail 사용자 이메일 (권한 확인용)
     * @return 구매 확정된 주문
     */
    @Transactional
    public Order confirmOrder(Long orderId, String userEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        // 본인 주문인지 확인
        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized: This order does not belong to you");
        }

        // 배송 완료 상태에서만 구매 확정 가능
        if (order.getOrderStatus() != OrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot confirm order: Order is not delivered yet");
        }

        // 이미 확정된 경우
        if (order.getConfirmedAt() != null) {
            throw new RuntimeException("Order is already confirmed");
        }

        // 구매 확정
        order.setConfirmedAt(java.time.LocalDateTime.now());

        return orderRepository.save(order);
    }

    // ==================== 관리자 전용 메서드 ====================

    /**
     * 모든 주문 조회 (페이징, 필터링)
     * @param orderStatus 주문 상태 필터 (null이면 전체)
     * @param startDate 시작 날짜 (null이면 제한 없음)
     * @param endDate 종료 날짜 (null이면 제한 없음)
     * @param sellerId 판매자 ID 필터 (null이면 전체)
     * @param pageable 페이징 정보
     * @return 주문 페이지
     */
    @Transactional(readOnly = true)
    public Page<Order> getAllOrders(
            OrderStatus orderStatus,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Long sellerId,
            Pageable pageable) {

        Page<Order> orders;

        // 필터가 하나도 없으면 전체 조회
        if (orderStatus == null && startDate == null && endDate == null && sellerId == null) {
            orders = orderRepository.findAllByOrderByCreatedAtDesc(pageable);
        } else {
            // 필터링 조회
            orders = orderRepository.findOrdersWithFilters(orderStatus, startDate, endDate, sellerId, pageable);
        }

        // Manually initialize lazy-loaded collections to avoid LazyInitializationException
        orders.forEach(order -> {
            order.getUser().getName(); // Initialize user
            order.getOrderItems().size(); // Initialize orderItems
            // Initialize product for each order item
            order.getOrderItems().forEach(item -> {
                item.getProduct().getName(); // Initialize product
                // Initialize seller
                if (item.getProduct().getSeller() != null) {
                    item.getProduct().getSeller().getName(); // Initialize seller
                }
            });
            // Initialize appliedCoupon if present
            if (order.getAppliedCoupon() != null) {
                order.getAppliedCoupon().getName();
            }
        });

        return orders;
    }

    /**
     * 주문 상태 변경 (관리자용)
     * @param orderId 주문 ID
     * @param newStatus 새로운 주문 상태
     * @return 변경된 주문
     */
    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        OrderStatus oldStatus = order.getOrderStatus();
        order.setOrderStatus(newStatus);

        // 상태별 타임스탬프 업데이트
        if (newStatus == OrderStatus.SHIPPED && oldStatus != OrderStatus.SHIPPED) {
            order.setShippedAt(LocalDateTime.now());
        } else if (newStatus == OrderStatus.DELIVERED && oldStatus != OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
        }

        return orderRepository.save(order);
    }

    /**
     * 송장 번호 등록 (관리자용)
     * @param orderId 주문 ID
     * @param trackingNumber 송장 번호
     * @return 업데이트된 주문
     */
    @Transactional
    public Order updateTrackingNumber(Long orderId, String trackingNumber) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        order.setTrackingNumber(trackingNumber);

        // 송장 번호 등록 시 자동으로 SHIPPED 상태로 변경
        if (order.getOrderStatus() == OrderStatus.PAID) {
            order.setOrderStatus(OrderStatus.SHIPPED);
            order.setShippedAt(LocalDateTime.now());
        }

        return orderRepository.save(order);
    }

    @Transactional
    public void completePayment(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        // 재고 차감 (Pessimistic Lock으로 동시성 제어)
        for (OrderItem item : order.getOrderItems()) {
            // Pessimistic Write Lock을 사용하여 재고 차감 시 동시성 문제 방지
            Product product = productRepository.findByIdWithLock(item.getProduct().getId())
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + item.getProduct().getId()));

            // 재고 부족 체크
            if (product.getStock() < item.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName() +
                        " (requested: " + item.getQuantity() + ", available: " + product.getStock() + ")");
            }

            product.setStock(product.getStock() - item.getQuantity());
            productRepository.save(product);
        }
        
        // 장바구니 비우기
        cartRepository.findByUser(order.getUser()).ifPresent(cart -> {
            cart.getCartItems().clear();
            cartRepository.save(cart);
        });
        
        // 주문 상태를 PAID로 변경
        order.setOrderStatus(OrderStatus.PAID);
        orderRepository.save(order);
    }

    /**
     * 여러 주문의 상태를 일괄 변경 (관리자용)
     * @param orderIds 변경할 주문 ID 목록
     * @param newStatus 새로운 주문 상태
     * @return 성공한 주문 ID 목록과 실패한 주문 정보를 담은 Map
     */
    @Transactional
    public Map<String, Object> bulkUpdateOrderStatus(List<Long> orderIds, OrderStatus newStatus) {
        List<Long> successIds = new ArrayList<>();
        List<Map<String, Object>> failedOrders = new ArrayList<>();

        for (Long orderId : orderIds) {
            try {
                updateOrderStatus(orderId, newStatus);
                successIds.add(orderId);
            } catch (Exception e) {
                Map<String, Object> failedOrder = new HashMap<>();
                failedOrder.put("orderId", orderId);
                failedOrder.put("error", e.getMessage());
                failedOrders.add(failedOrder);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("successCount", successIds.size());
        result.put("failureCount", failedOrders.size());
        result.put("successIds", successIds);
        result.put("failedOrders", failedOrders);

        return result;
    }
}