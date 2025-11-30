package com.agri.market.delivery;

import com.agri.market.dto.DeliveryTrackingResponse;
import com.agri.market.notification.NotificationService;
import com.agri.market.notification.NotificationType;
import com.agri.market.order.Order;
import com.agri.market.order.OrderRepository;
import com.agri.market.order.OrderService;
import com.agri.market.order.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 배송 상태 자동 동기화 스케줄러
 * 스마트택배 API를 주기적으로 호출하여 배송 완료 여부를 확인하고,
 * 배송이 완료되면(level=6) 자동으로 주문 상태를 DELIVERED로 변경
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "delivery.tracking.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class DeliveryStatusScheduler {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final DeliveryTrackingService deliveryTrackingService;
    private final NotificationService notificationService;

    @Value("${delivery.tracking.scheduler.delay:1000}")
    private long apiCallDelay;

    /**
     * 배송 상태 동기화 작업
     * 매일 오전 9시, 오후 12시, 오후 3시, 오후 6시에 실행 (한국 시간 기준)
     *
     * Cron 표현식: 초 분 시 일 월 요일
     * "0 0 9,12,15,18 * * *" = 매일 9시, 12시, 15시, 18시 정각에 실행
     */
    @Transactional
    @Scheduled(cron = "0 0 9,12,15,18 * * *", zone = "Asia/Seoul")
    public void syncDeliveryStatus() {
        log.info("========== 배송 상태 동기화 시작 ==========");

        // 1. SHIPPED 상태이면서 송장번호와 택배사코드가 있는 주문 조회
        List<Order> shippedOrders = orderRepository.findByOrderStatusWithTracking(OrderStatus.SHIPPED);

        if (shippedOrders.isEmpty()) {
            log.info("배송중인 주문이 없습니다.");
            log.info("========== 배송 상태 동기화 완료 ==========");
            return;
        }

        log.info("배송 상태 확인 대상: {}건", shippedOrders.size());

        int successCount = 0;
        int deliveredCount = 0;
        int failCount = 0;

        for (Order order : shippedOrders) {
            try {
                // 2. 스마트택배 API 호출
                DeliveryTrackingResponse tracking = deliveryTrackingService.trackDelivery(
                    order.getCourierCode(),
                    order.getTrackingNumber()
                );

                // 3. 배송완료(level=6)이면 주문 상태 변경
                if (tracking.isSuccess() && tracking.getLevel() >= 6) {
                    orderService.updateOrderStatus(order.getId(), OrderStatus.DELIVERED);

                    // 4. 사용자에게 알림 발송
                    notificationService.sendToUserAsync(
                        order.getUser().getEmail(),
                        "배송이 완료되었습니다",
                        "주문번호 " + order.getOrderNumber() + " 상품이 배송 완료되었습니다.",
                        NotificationType.ORDER_STATUS_CHANGED
                    );

                    log.info("주문 {} 배송 완료 처리됨 (orderNumber: {})", order.getId(), order.getOrderNumber());
                    deliveredCount++;
                }

                successCount++;

            } catch (Exception e) {
                log.error("주문 {} 배송 상태 확인 실패: {}", order.getId(), e.getMessage());
                failCount++;
            }

            // 5. API 호출 간 딜레이 (Rate Limit 대응)
            try {
                Thread.sleep(apiCallDelay);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("스케줄러 중단됨");
                break;
            }
        }

        log.info("========== 배송 상태 동기화 완료 ==========");
        log.info("처리 결과 - 성공: {}건, 배송완료 처리: {}건, 실패: {}건", successCount, deliveredCount, failCount);
    }
}
