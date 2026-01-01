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

    @Value("${slack.webhook.inquiry.url:}")
    private String slackInquiryWebhookUrl;

    @Value("${slack.notification.enabled:true}")
    private boolean notificationEnabled;

    public SlackNotificationService(RestTemplate restTemplate, OrderRepository orderRepository, InquiryRepository inquiryRepository) {
        this.restTemplate = restTemplate;
        this.orderRepository = orderRepository;
        this.inquiryRepository = inquiryRepository;
    }

    /**
     * 결제 완료 알림을 Slack으로 전송 (Order ID로 조회)
     * 지수 백오프 재시도 로직 적용 (500ms × attempt, 최대 3회)
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

        // 재시도 로직 (네트워크 오류 등 대비)
        int maxRetries = 3;
        int baseDelayMs = 500;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // 새로운 트랜잭션에서 Order 조회 (OrderItems 포함)
                Order order = orderRepository.findById(orderId)
                        .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

                Map<String, Object> payload = buildPaymentNotificationPayload(order, amount);
                sendSlackMessage(payload);
                logger.info("Payment notification sent to Slack for order: {}", order.getOrderNumber());
                return; // 성공하면 종료
            } catch (Exception e) {
                logger.warn("Failed to send payment notification (attempt {}/{}): {}", attempt, maxRetries, e.getMessage());
                if (attempt < maxRetries) {
                    try {
                        Thread.sleep(baseDelayMs * attempt); // 지수 백오프
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                } else {
                    logger.error("Failed to send Slack notification for orderId after {} attempts: {}", maxRetries, orderId, e);
                }
            }
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

        // 상품 목록 생성 (LazyInitializationException 방지)
        String productList = order.getOrderItems().stream()
                .map(item -> {
                    String productName = item.getProduct() != null ? item.getProduct().getName() : "상품";
                    String optionInfo = "";
                    try {
                        if (item.getProductOption() != null) {
                            String optName = item.getProductOption().getOptionName();
                            String optValue = item.getProductOption().getOptionValue();
                            // 옵션명과 옵션값이 모두 있으면 "옵션명: 옵션값", 아니면 옵션명만
                            if (optValue != null && !optValue.isBlank()) {
                                optionInfo = " (" + optName + ": " + optValue + ")";
                            } else if (optName != null && !optName.isBlank()) {
                                optionInfo = " (" + optName + ")";
                            }
                        }
                    } catch (Exception e) {
                        // LazyInitializationException 무시
                    }
                    return "• " + productName + optionInfo + " x " + item.getQuantity() + "개";
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
     * Slack 웹훅으로 메시지 전송 (기본 URL)
     */
    private void sendSlackMessage(Map<String, Object> payload) {
        sendSlackMessageToUrl(payload, slackWebhookUrl);
    }

    /**
     * Slack 웹훅으로 메시지 전송 (지정된 URL)
     */
    private void sendSlackMessageToUrl(Map<String, Object> payload, String webhookUrl) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                webhookUrl,
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
        // 문의용 webhook URL이 없으면 기본 URL 사용
        String webhookUrl = (slackInquiryWebhookUrl != null && !slackInquiryWebhookUrl.isBlank())
                ? slackInquiryWebhookUrl : slackWebhookUrl;

        if (!notificationEnabled || webhookUrl == null || webhookUrl.isBlank()) {
            logger.debug("Slack notification is disabled or webhook URL is not configured");
            return;
        }

        logger.info("Sending inquiry notification for inquiryId: {}", inquiryId);

        // 재시도 로직 (네트워크 오류 등 대비)
        int maxRetries = 3;
        int baseDelayMs = 500;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                Inquiry inquiry = inquiryRepository.findById(inquiryId).orElse(null);
                if (inquiry == null) {
                    logger.error("Inquiry not found: {}", inquiryId);
                    return;
                }

                logger.info("Found inquiry: id={}, title={}", inquiry.getId(), inquiry.getTitle());

                Map<String, Object> payload = buildInquiryNotificationPayload(inquiry);
                sendSlackMessageToUrl(payload, webhookUrl);
                logger.info("Inquiry notification sent to Slack for inquiry: {}", inquiryId);
                return; // 성공하면 종료
            } catch (Exception e) {
                logger.warn("Failed to send inquiry notification (attempt {}/{}): {}", attempt, maxRetries, e.getMessage());
                if (attempt < maxRetries) {
                    try {
                        Thread.sleep(baseDelayMs * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                } else {
                    logger.error("Failed to send Slack notification for inquiryId after {} attempts: {}", maxRetries, inquiryId, e);
                }
            }
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
