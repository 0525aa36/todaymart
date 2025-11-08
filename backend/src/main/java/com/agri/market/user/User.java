package com.agri.market.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(name = "address_line1", nullable = false)
    private String addressLine1;

    @Column(name = "address_line2")
    private String addressLine2;

    @Column(length = 10)
    private String postcode;

    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Column(length = 10)
    private String gender; // 성별: "male" 또는 "female"

    @Column(nullable = false, length = 20)
    private String role = "USER"; // Default role (ROLE_ prefix is added automatically by Spring Security)

    @Column(nullable = false)
    private Boolean enabled = true; // 사용자 활성화 상태

    @Column(name = "marketing_consent", nullable = false)
    private Boolean marketingConsent = false; // 마케팅 정보 수신 동의 여부

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}