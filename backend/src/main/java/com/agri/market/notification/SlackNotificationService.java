package com.agri.market.notification;

import com.agri.market.inquiry.Inquiry;
import com.agri.market.inquiry.InquiryRepository;
import com.agri.market.order.Order;
import com.agri.market.order.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SlackNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(SlackNotificationService.class);

    private final RestTemplate restTemplate;
    private final OrderRepository orderRepository;
    private final InquiryRepository inquiryRepository;

    @Value("${slack.webhook.url:}")
    private String slackWebhookUrl;

    @Value("${slack.notification.enabled:true}")
    private boolean notificationEnabled;

    public SlackNotificationService(RestTemplate restTemplate, OrderRepository orderRepository, InquiryRepository inquiryRepository) {
        this.restTemplate = restTemplate;
        this.orderRepository = orderRepository;
        this.inquiryRepository = inquiryRepository;
    }

    /**
     * 결제 완료 알림을 Slack으로 전송 (Order ID로 조회)
     * @param orderId 주문 ID
     * @param amount 결제 금액
     */
    @Async
    @Transactional(readOnly = true)
    public void sendPaymentNotification(Long orderId, BigDecimal amount) {
        if (!notificationEnabled || slackWebhookUrl == null || slackWebhookUrl.isBlank()) {
            logger.debug("Slack notification is disabled or webhook URL is not configured");
            return;
        }

        try {
            // 새로운 트랜잭션에서 Order 조회 (OrderItems 포함)
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

            Map<String, Object> payload = buildPaymentNotificationPayload(order, amount);
            sendSlackMessage(payload);
            logger.info("Payment notification sent to Slack for order: {}", order.getOrderNumber());
        } catch (Exception e) {
            logger.error("Failed to send Slack notification for orderId: {}", orderId, e);
        }
    }

    /**
     * 결제 완료 알림 메시지 구성 (Block Kit 형식)
     */
    private Map<String, Object> buildPaymentNotificationPayload(Order order, BigDecimal amount) {
        NumberFormat currencyFormat = NumberFormat.getNumberInstance(Locale.KOREA);
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        String formattedAmount = currencyFormat.format(amount) + "원";
        String orderTime = LocalDateTime.now().format(dateFormatter);

        // 상품 목록 생성
        String productList = order.getOrderItems().stream()
                .map(item -> {
                    String productName = item.getProduct() != null ? item.getProduct().getName() : "상품";
                    String optionName = item.getProductOption() != null ?
                            " (" + item.getProductOption().getOptionName() + ")" : "";
                    return "• " + productName + optionName + " x " + item.getQuantity() + "개";
                })
                .collect(Collectors.joining("\n"));

        List<Map<String, Object>> blocks = new ArrayList<>();

        // 헤더
        blocks.add(Map.of(
                "type", "header",
                "text", Map.of(
                        "type", "plain_text",
                        "text", "💰 새로운 결제가 완료되었습니다!",
                        "emoji", true
                )
        ));

        // 구분선
        blocks.add(Map.of("type", "divider"));

        // 주문 정보 섹션
        blocks.add(Map.of(
                "type", "section",
                "fields", Arrays.asList(
                        Map.of("type", "mrkdwn", "text", "*주문번호:*\n" + order.getOrderNumber()),
                        Map.of("type", "mrkdwn", "text", "*결제금액:*\n" + formattedAmount),
                        Map.of("type", "mrkdwn", "text", "*주문자:*\n" + order.getRecipientName()),
                        Map.of("type", "mrkdwn", "text", "*연락처:*\n" + order.getRecipientPhone()),
                        Map.of("type", "mrkdwn", "text", "*결제시간:*\n" + orderTime)
                )
        ));

        // 상품 목록
        blocks.add(Map.of(
                "type", "section",
                "text", Map.of(
                        "type", "mrkdwn",
                        "text", "*주문 상품:*\n" + productList
                )
        ));

        // 배송지 정보
        String address = order.getShippingAddressLine1();
        if (order.getShippingAddressLine2() != null && !order.getShippingAddressLine2().isBlank()) {
            address += " " + order.getShippingAddressLine2();
        }

        blocks.add(Map.of(
                "type", "section",
                "text", Map.of(
                        "type", "mrkdwn",
                        "text", "*배송지:*\n" + address
                )
        ));

        // 배송 메모가 있으면 추가
        if (order.getDeliveryMessage() != null && !order.getDeliveryMessage().isBlank()) {
            blocks.add(Map.of(
                    "type", "section",
                    "text", Map.of(
                            "type", "mrkdwn",
                            "text", "*배송메모:*\n" + order.getDeliveryMessage()
                    )
            ));
        }

        // 구분선
        blocks.add(Map.of("type", "divider"));

        // 관리자 페이지 링크 버튼
        blocks.add(Map.of(
                "type", "actions",
                "elements", List.of(
                        Map.of(
                                "type", "button",
                                "text", Map.of(
                                        "type", "plain_text",
                                        "text", "📋 주문 상세보기",
                                        "emoji", true
                                ),
                                "url", "https://todaymart.co.kr/admin/orders/" + order.getId(),
                                "action_id", "view_order"
                        )
                )
        ));

        return Map.of("blocks", blocks);
    }

    /**
     * Slack 웹훅으로 메시지 전송
     */
    private void sendSlackMessage(Map<String, Object> payload) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                slackWebhookUrl,
                entity,
                String.class
        );

        if (response.getStatusCode() != HttpStatus.OK) {
            throw new RuntimeException("Slack API returned status: " + response.getStatusCode());
        }
    }

    /**
     * 테스트용: 간단한 메시지 전송
     */
    public void sendTestMessage(String message) {
        if (slackWebhookUrl == null || slackWebhookUrl.isBlank()) {
            logger.warn("Slack webhook URL is not configured");
            return;
        }

        try {
            Map<String, Object> payload = Map.of("text", message);
            sendSlackMessage(payload);
            logger.info("Test message sent to Slack");
        } catch (Exception e) {
            logger.error("Failed to send test message to Slack", e);
        }
    }

    /**
     * 고객 문의 알림을 Slack으로 전송
     * @param inquiryId 문의 ID
     */
    @Async
    @Transactional(readOnly = true)
    public void sendInquiryNotification(Long inquiryId) {
        if (!notificationEnabled || slackWebhookUrl == null || slackWebhookUrl.isBlank()) {
            logger.debug("Slack notification is disabled or webhook URL is not configured");
            return;
        }

        try {
            Inquiry inquiry = inquiryRepository.findById(inquiryId)
                    .orElseThrow(() -> new RuntimeException("Inquiry not found: " + inquiryId));

            Map<String, Object> payload = buildInquiryNotificationPayload(inquiry);
            sendSlackMessage(payload);
            logger.info("Inquiry notification sent to Slack for inquiry: {}", inquiryId);
        } catch (Exception e) {
            logger.error("Failed to send Slack notification for inquiryId: {}", inquiryId, e);
        }
    }

    /**
     * 고객 문의 알림 메시지 구성 (Block Kit 형식)
     */
    private Map<String, Object> buildInquiryNotificationPayload(Inquiry inquiry) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        String createdTime = inquiry.getCreatedAt().format(dateFormatter);
        String customerName = inquiry.getUser() != null ? inquiry.getUser().getName() : "고객";

        // 문의 내용 미리보기 (100자 제한)
        String contentPreview = inquiry.getContent();
        if (contentPreview.length() > 100) {
            contentPreview = contentPreview.substring(0, 100) + "...";
        }

        List<Map<String, Object>> blocks = new ArrayList<>();

        // 헤더
        blocks.add(Map.of(
                "type", "header",
                "text", Map.of(
                        "type", "plain_text",
                        "text", "새로운 고객 문의",
                        "emoji", false
                )
        ));

        // 구분선
        blocks.add(Map.of("type", "divider"));

        // 문의 정보 섹션
        blocks.add(Map.of(
                "type", "section",
                "fields", Arrays.asList(
                        Map.of("type", "mrkdwn", "text", "*카테고리:*\n" + inquiry.getCategory()),
                        Map.of("type", "mrkdwn", "text", "*고객:*\n" + customerName),
                        Map.of("type", "mrkdwn", "text", "*등록:*\n" + createdTime)
                )
        ));

        // 제목
        blocks.add(Map.of(
                "type", "section",
                "text", Map.of(
                        "type", "mrkdwn",
                        "text", "*제목:*\n" + inquiry.getTitle()
                )
        ));

        // 내용 미리보기
        blocks.add(Map.of(
                "type", "section",
                "text", Map.of(
                        "type", "mrkdwn",
                        "text", "*내용:*\n" + contentPreview
                )
        ));

        // 구분선
        blocks.add(Map.of("type", "divider"));

        // 관리자 페이지 링크 버튼
        blocks.add(Map.of(
                "type", "actions",
                "elements", List.of(
                        Map.of(
                                "type", "button",
                                "text", Map.of(
                                        "type", "plain_text",
                                        "text", "문의 확인하기",
                                        "emoji", false
                                ),
                                "url", "https://todaymart.co.kr/admin/help/inquiries",
                                "action_id", "view_inquiry"
                        )
                )
        ));

        return Map.of("blocks", blocks);
    }
}
