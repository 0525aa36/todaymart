package com.agri.market.category;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
@Getter
@Setter
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code; // vegetables, fruits, seafood 등

    @Column(nullable = false)
    private String name; // 채소, 과일, 수산물

    @Column
    private String description;

    @Column
    private String iconName; // 아이콘 이름 또는 이모지

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent; // 하위 카테고리 지원

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Category> children = new ArrayList<>();

    @Column(nullable = false)
    private Integer displayOrder = 0; // 정렬 순서

    @Column(nullable = false)
    private Boolean isVisible = true; // 숨김 처리

    @Column(nullable = false)
    private Boolean isEvent = false; // 이벤트 카테고리 여부

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}