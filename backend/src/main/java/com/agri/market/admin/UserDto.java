package com.agri.market.admin;

import com.agri.market.user.User;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 사용자 목록용 DTO
 */
@Getter
@Setter
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private boolean enabled;
    private LocalDateTime createdAt;

    // 통계
    private Long orderCount;
    private BigDecimal totalSpent;

    public UserDto(User user, Long orderCount, BigDecimal totalSpent) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.phone = user.getPhone();
        this.role = user.getRole();
        this.enabled = user.getEnabled();
        this.createdAt = user.getCreatedAt();
        this.orderCount = orderCount;
        this.totalSpent = totalSpent;
    }
}
