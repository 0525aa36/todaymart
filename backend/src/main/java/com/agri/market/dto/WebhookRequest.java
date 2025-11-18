package com.agri.market.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WebhookRequest {
    private Long orderId;
    private String transactionId;
    private String status; // e.g., "PAID", "FAILED", "CANCELLED"
    private String cancellationReason; // 취소 사유 (토스에서 제공)
    // Add other relevant fields from the payment gateway webhook
}