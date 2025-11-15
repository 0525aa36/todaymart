package com.agri.market.returnrequest;

import com.agri.market.order.OrderItem;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 반품 아이템 엔티티
 * 개별 상품 선택 반품을 지원
 */
@Entity
@Table(name = "return_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReturnItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 반품 요청
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_request_id", nullable = false)
    @JsonBackReference
    private ReturnRequest returnRequest;

    /**
     * 주문 아이템 (원본)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    /**
     * 반품 수량
     */
    @Column(nullable = false)
    private Integer quantity;

    /**
     * 이 아이템의 환불 금액
     */
    @Column(precision = 10, scale = 2)
    private BigDecimal refundAmount;

    /**
     * 아이템별 반품 사유 (선택사항)
     */
    @Column(columnDefinition = "TEXT")
    private String itemReason;

    /**
     * 환불 금액 계산
     */
    public void calculateRefundAmount() {
        if (orderItem != null && quantity != null) {
            this.refundAmount = orderItem.getPrice()
                .multiply(new BigDecimal(quantity));
        }
    }
}
