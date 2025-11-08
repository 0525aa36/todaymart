package com.agri.market.coupon;

import com.agri.market.order.Order;
import com.agri.market.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 사용자별 쿠폰 보유 엔티티
 */
@Entity
@Table(name = "user_coupons")
@Getter
@Setter
public class UserCoupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 쿠폰을 보유한 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 쿠폰 정보
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    /**
     * 발급일시
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime issuedAt;

    /**
     * 사용일시 (null이면 미사용)
     */
    @Column
    private LocalDateTime usedAt;

    /**
     * 사용된 주문 (nullable)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    /**
     * 만료일
     */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        issuedAt = LocalDateTime.now();
    }

    /**
     * 쿠폰이 사용되었는지 확인
     */
    public boolean isUsed() {
        return usedAt != null;
    }

    /**
     * 쿠폰이 만료되었는지 확인
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * 쿠폰 사용 가능 여부 확인
     */
    public boolean isAvailable() {
        return !isUsed()
                && !isExpired()
                && coupon.isValid();
    }

    /**
     * 쿠폰 사용 처리
     */
    public void use(Order order) {
        if (isUsed()) {
            throw new IllegalStateException("이미 사용된 쿠폰입니다.");
        }
        if (isExpired()) {
            throw new IllegalStateException("만료된 쿠폰입니다.");
        }
        if (!coupon.isValid()) {
            throw new IllegalStateException("유효하지 않은 쿠폰입니다.");
        }

        this.usedAt = LocalDateTime.now();
        this.order = order;
    }
}
