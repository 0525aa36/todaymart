package com.agri.market.returnrequest;

import com.agri.market.exception.BadRequestException;
import com.agri.market.exception.NotFoundException;
import com.agri.market.notification.NotificationService;
import com.agri.market.notification.NotificationType;
import com.agri.market.order.Order;
import com.agri.market.order.OrderItem;
import com.agri.market.order.OrderStatus;
import com.agri.market.payment.PaymentService;
import com.agri.market.product.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 반품 관리 서비스 (관리자용)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminReturnService {

    private final ReturnRequestRepository returnRequestRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;

    /**
     * 모든 반품 요청 조회 (페이징)
     */
    public Page<ReturnRequest> getAllReturnRequests(Pageable pageable) {
        return returnRequestRepository.findAllWithOrder(pageable);
    }

    /**
     * 상태별 반품 요청 조회
     */
    public Page<ReturnRequest> getReturnRequestsByStatus(ReturnStatus status, Pageable pageable) {
        return returnRequestRepository.findByStatus(status, pageable);
    }

    /**
     * 필터링된 반품 요청 조회
     */
    public Page<ReturnRequest> getFilteredReturnRequests(
            ReturnStatus status,
            ReturnReasonCategory reasonCategory,
            String keyword,
            Pageable pageable
    ) {
        return returnRequestRepository.findByFilters(status, reasonCategory, keyword, pageable);
    }

    /**
     * 대기 중인 반품 요청 개수
     */
    public long getPendingReturnCount() {
        return returnRequestRepository.countByStatus(ReturnStatus.REQUESTED);
    }

    /**
     * 반품 요청 상세 조회 (관리자용)
     */
    public ReturnRequest getReturnRequest(Long returnRequestId) {
        return returnRequestRepository.findByIdWithAll(returnRequestId)
            .orElseThrow(() -> new NotFoundException("반품 요청을 찾을 수 없습니다."));
    }

    /**
     * 반품 승인
     */
    @Transactional
    public ReturnRequest approveReturn(Long returnRequestId, String adminNote, Authentication authentication) {
        ReturnRequest returnRequest = returnRequestRepository.findByIdWithAll(returnRequestId)
            .orElseThrow(() -> new NotFoundException("반품 요청을 찾을 수 없습니다."));

        // REQUESTED 상태에서만 승인 가능
        if (returnRequest.getStatus() != ReturnStatus.REQUESTED) {
            throw new BadRequestException("대기 중인 반품 요청만 승인할 수 있습니다.");
        }

        // 반품 승인
        returnRequest.approve(adminNote);

        // 주문 상태 업데이트
        Order order = returnRequest.getOrder();
        order.setOrderStatus(OrderStatus.RETURN_APPROVED);

        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        // 사용자에게 알림 저장
        notificationService.saveNotificationForUser(
            order.getUser().getEmail(),
            "반품 승인",
            "주문번호 " + order.getOrderNumber() + "의 반품이 승인되었습니다. 상품을 반송해주세요.",
            NotificationType.RETURN_APPROVED
        );

        return saved;
    }

    /**
     * 반품 거부
     */
    @Transactional
    public ReturnRequest rejectReturn(Long returnRequestId, String rejectionReason, Authentication authentication) {
        ReturnRequest returnRequest = returnRequestRepository.findByIdWithAll(returnRequestId)
            .orElseThrow(() -> new NotFoundException("반품 요청을 찾을 수 없습니다."));

        // REQUESTED 상태에서만 거부 가능
        if (returnRequest.getStatus() != ReturnStatus.REQUESTED) {
            throw new BadRequestException("대기 중인 반품 요청만 거부할 수 있습니다.");
        }

        // 반품 거부
        returnRequest.reject(rejectionReason);

        // 주문 상태 복원
        Order order = returnRequest.getOrder();
        order.setOrderStatus(OrderStatus.DELIVERED);

        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        // 사용자에게 알림 저장
        notificationService.saveNotificationForUser(
            order.getUser().getEmail(),
            "반품 거부",
            "주문번호 " + order.getOrderNumber() + "의 반품이 거부되었습니다. 사유: " + rejectionReason,
            NotificationType.RETURN_REJECTED
        );

        return saved;
    }

    /**
     * 반품 완료 처리
     * - 재고 복원
     * - 실제 환불 처리 (Toss Payments API 호출)
     * - 주문 상태 업데이트
     */
    @Transactional
    public ReturnRequest completeReturn(Long returnRequestId, Authentication authentication) {
        ReturnRequest returnRequest = returnRequestRepository.findByIdWithAll(returnRequestId)
            .orElseThrow(() -> new NotFoundException("반품 요청을 찾을 수 없습니다."));

        // APPROVED 상태에서만 완료 처리 가능
        if (returnRequest.getStatus() != ReturnStatus.APPROVED) {
            throw new BadRequestException("승인된 반품 요청만 완료 처리할 수 있습니다.");
        }

        Order order = returnRequest.getOrder();

        // 1. 재고 복원
        List<ReturnItem> returnItems = returnRequest.getReturnItems();
        for (ReturnItem returnItem : returnItems) {
            OrderItem orderItem = returnItem.getOrderItem();

            // Product의 재고 증가
            Product product = orderItem.getProduct();
            int newStock = product.getStock() + returnItem.getQuantity();
            product.setStock(newStock);
        }

        // 2. 실제 환불 처리 (Toss Payments API 호출)
        String refundReason = returnRequest.getReasonCategory() + ": " + returnRequest.getDetailedReason();
        paymentService.processRefund(
            order.getId(),
            returnRequest.getTotalRefundAmount(),
            refundReason,
            authentication
        );

        // 3. 반품 상태 업데이트
        returnRequest.complete();
        returnRequest.setRefundedAt(LocalDateTime.now());

        // 4. 주문 상태 업데이트
        boolean isFullReturn = returnItems.size() == order.getOrderItems().size();
        boolean isAllItemsFullyReturned = returnItems.stream()
            .allMatch(returnItem ->
                returnItem.getQuantity().equals(returnItem.getOrderItem().getQuantity())
            );

        if (isFullReturn && isAllItemsFullyReturned) {
            // 전체 반품
            order.setOrderStatus(OrderStatus.RETURN_COMPLETED);
        } else {
            // 부분 반품
            order.setOrderStatus(OrderStatus.PARTIALLY_RETURNED);
        }

        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        // 5. 사용자에게 알림 저장
        notificationService.saveNotificationForUser(
            order.getUser().getEmail(),
            "반품 완료 및 환불 처리",
            "주문번호 " + order.getOrderNumber() + "의 반품이 완료되었습니다. 환불 금액: " +
            returnRequest.getTotalRefundAmount() + "원",
            NotificationType.RETURN_COMPLETED
        );

        return saved;
    }

    /**
     * 기간별 반품 통계
     */
    public List<ReturnRequest> getReturnRequestsByDateRange(
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        return returnRequestRepository.findByRequestedAtBetween(startDate, endDate);
    }
}
