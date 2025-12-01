package com.agri.market.order;

import com.agri.market.product.Product;
import com.agri.market.product.ProductOption;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_items")
@Getter
@Setter
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonBackReference
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "images", "options"})
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_option_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "product"})
    private ProductOption productOption;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price; // Price at the time of order

    // 송장 정보 (상품별 개별 배송 추적용)
    private String trackingNumber;

    @Column(length = 50)
    private String courierCompany; // 택배사명 (CJ대한통운, 로젠택배 등)

    @Column(length = 10)
    private String courierCode; // 택배사 코드 (스마트택배 API용)

    private LocalDateTime shippedAt; // 배송 시작 시간
}