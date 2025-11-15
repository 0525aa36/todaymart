package com.agri.market.returnrequest;

import com.agri.market.exception.BadRequestException;
import com.agri.market.exception.ForbiddenException;
import com.agri.market.exception.NotFoundException;
import com.agri.market.notification.NotificationService;
import com.agri.market.notification.NotificationType;
import com.agri.market.order.Order;
import com.agri.market.order.OrderItem;
import com.agri.market.order.OrderRepository;
import com.agri.market.order.OrderStatus;
import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 반품 서비스 (사용자용)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReturnService {

    private final ReturnRequestRepository returnRequestRepository;
    private final ReturnItemRepository returnItemRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * 반품 가능 여부 확인
     * - 배송 완료된 주문만 가능
     * - 배송 완료 후 7일 이내
     * - 이미 반품 요청이 없어야 함
     */
    public ReturnEligibilityResponse checkReturnEligibility(Long orderId, Authentication authentication) {
        String userEmail = authentication.getName();

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new NotFoundException("주문을 찾을 수 없습니다."));

        // 본인 주문인지 확인
        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new ForbiddenException("본인의 주문만 반품 요청할 수 있습니다.");
        }

        ReturnEligibilityResponse response = new ReturnEligibilityResponse();
        response.setOrderId(orderId);
        response.setEligible(false);

        // 배송 완료 상태 확인
        if (order.getOrderStatus() != OrderStatus.DELIVERED) {
            response.setReason("배송 완료된 주문만 반품 가능합니다.");
            return response;
        }

        // 배송 완료 날짜 확인
        LocalDateTime deliveredAt = order.getDeliveredAt();
        if (deliveredAt == null) {
            response.setReason("배송 완료 정보가 없습니다.");
            return response;
        }

        // 7일 이내 확인
        LocalDateTime returnDeadline = deliveredAt.plusDays(7);
        if (LocalDateTime.now().isAfter(returnDeadline)) {
            response.setReason("반품 가능 기간(배송 완료 후 7일)이 지났습니다.");
            response.setDeliveredAt(deliveredAt);
            response.setReturnDeadline(returnDeadline);
            return response;
        }

        // 이미 반품 요청이 있는지 확인
        Optional<ReturnRequest> existingReturn = returnRequestRepository.findByOrderId(orderId);
        if (existingReturn.isPresent()) {
            ReturnRequest returnRequest = existingReturn.get();
            response.setReason("이미 반품 요청이 존재합니다. (상태: " + returnRequest.getStatus() + ")");
            return response;
        }

        // 모든 조건 통과
        response.setEligible(true);
        response.setDeliveredAt(deliveredAt);
        response.setReturnDeadline(returnDeadline);
        response.setReason("반품 가능합니다.");

        return response;
    }

    /**
     * 반품 요청 생성
     */
    @Transactional
    public ReturnRequest createReturnRequest(CreateReturnRequestDto dto, Authentication authentication) {
        String userEmail = authentication.getName();

        // 주문 조회 및 권한 확인
        Order order = orderRepository.findById(dto.getOrderId())
            .orElseThrow(() -> new NotFoundException("주문을 찾을 수 없습니다."));

        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new ForbiddenException("본인의 주문만 반품 요청할 수 있습니다.");
        }

        // 반품 가능 여부 확인
        ReturnEligibilityResponse eligibility = checkReturnEligibility(dto.getOrderId(), authentication);
        if (!eligibility.isEligible()) {
            throw new BadRequestException(eligibility.getReason());
        }

        // 반품 요청 생성
        ReturnRequest returnRequest = new ReturnRequest();
        returnRequest.setOrder(order);
        returnRequest.setStatus(ReturnStatus.REQUESTED);
        returnRequest.setReasonCategory(dto.getReasonCategory());
        returnRequest.setDetailedReason(dto.getDetailedReason());
        // 증빙 이미지 URL 리스트를 콤마로 구분된 문자열로 변환
        if (dto.getProofImageUrls() != null && !dto.getProofImageUrls().isEmpty()) {
            returnRequest.setProofImageUrls(String.join(",", dto.getProofImageUrls()));
        }
        returnRequest.setRequestedAt(LocalDateTime.now());

        // 반품 아이템 생성 및 환불 금액 계산
        List<ReturnItem> returnItems = new ArrayList<>();
        BigDecimal totalItemsRefund = BigDecimal.ZERO;

        for (Map.Entry<Long, Integer> entry : dto.getReturnItems().entrySet()) {
            Long orderItemId = entry.getKey();
            Integer returnQuantity = entry.getValue();

            // 주문 아이템 조회
            OrderItem orderItem = order.getOrderItems().stream()
                .filter(item -> item.getId().equals(orderItemId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("주문 아이템을 찾을 수 없습니다: " + orderItemId));

            // 수량 검증
            if (returnQuantity <= 0 || returnQuantity > orderItem.getQuantity()) {
                throw new BadRequestException("반품 수량이 올바르지 않습니다. (주문 수량: " + orderItem.getQuantity() + ")");
            }

            // 반품 아이템 생성
            ReturnItem returnItem = new ReturnItem();
            returnItem.setReturnRequest(returnRequest);
            returnItem.setOrderItem(orderItem);
            returnItem.setQuantity(returnQuantity);
            returnItem.calculateRefundAmount(); // 환불 금액 계산

            returnItems.add(returnItem);
            totalItemsRefund = totalItemsRefund.add(returnItem.getRefundAmount());
        }

        returnRequest.setReturnItems(returnItems);
        returnRequest.setItemsRefundAmount(totalItemsRefund);

        // 배송비 환불 여부 결정 (판매자 귀책 시에만)
        BigDecimal shippingRefund = BigDecimal.ZERO;
        if (dto.getReasonCategory().isSellerFault()) {
            shippingRefund = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
        }
        returnRequest.setShippingRefundAmount(shippingRefund);

        // 총 환불 금액
        BigDecimal totalRefund = totalItemsRefund.add(shippingRefund);
        returnRequest.setTotalRefundAmount(totalRefund);

        // 주문 상태 업데이트
        order.setOrderStatus(OrderStatus.RETURN_REQUESTED);

        // 저장
        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        // 관리자에게 알림 발송
        notificationService.sendToAllAdminsAsync(
            "새로운 반품 요청",
            "주문번호: " + order.getOrderNumber() + ", 사유: " + dto.getReasonCategory(),
            NotificationType.RETURN_REQUESTED
        );

        return saved;
    }

    /**
     * 사용자의 반품 요청 목록 조회
     */
    public List<ReturnRequest> getUserReturnRequests(Authentication authentication) {
        String userEmail = authentication.getName();
        return returnRequestRepository.findByUserEmail(userEmail);
    }

    /**
     * 반품 요청 상세 조회
     */
    public ReturnRequest getReturnRequest(Long returnRequestId, Authentication authentication) {
        String userEmail = authentication.getName();

        ReturnRequest returnRequest = returnRequestRepository.findById(returnRequestId)
            .orElseThrow(() -> new NotFoundException("반품 요청을 찾을 수 없습니다."));

        // 본인 요청인지 확인
        if (!returnRequest.getOrder().getUser().getEmail().equals(userEmail)) {
            throw new ForbiddenException("본인의 반품 요청만 조회할 수 있습니다.");
        }

        return returnRequest;
    }

    /**
     * 반품 요청 취소 (REQUESTED 상태에서만 가능)
     */
    @Transactional
    public void cancelReturnRequest(Long returnRequestId, Authentication authentication) {
        String userEmail = authentication.getName();

        ReturnRequest returnRequest = returnRequestRepository.findById(returnRequestId)
            .orElseThrow(() -> new NotFoundException("반품 요청을 찾을 수 없습니다."));

        // 본인 요청인지 확인
        if (!returnRequest.getOrder().getUser().getEmail().equals(userEmail)) {
            throw new ForbiddenException("본인의 반품 요청만 취소할 수 있습니다.");
        }

        // REQUESTED 상태에서만 취소 가능
        if (returnRequest.getStatus() != ReturnStatus.REQUESTED) {
            throw new BadRequestException("대기 중인 반품 요청만 취소할 수 있습니다.");
        }

        // 반품 요청 삭제
        returnRequestRepository.delete(returnRequest);

        // 주문 상태 복원
        Order order = returnRequest.getOrder();
        order.setOrderStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);
    }
}
