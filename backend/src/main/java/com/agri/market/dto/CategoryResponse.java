package com.agri.market.dto;

import com.agri.market.category.Category;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
public class CategoryResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String iconName;
    private Long parentId;
    private String parentName;
    private Integer displayOrder;
    private Boolean isVisible;
    private Boolean isEvent;
    private List<CategoryResponse> children;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CategoryResponse from(Category category) {
        CategoryResponse response = new CategoryResponse();
        response.setId(category.getId());
        response.setCode(category.getCode());
        response.setName(category.getName());
        response.setDescription(category.getDescription());
        response.setIconName(category.getIconName());

        if (category.getParent() != null) {
            response.setParentId(category.getParent().getId());
            response.setParentName(category.getParent().getName());
        }

        response.setDisplayOrder(category.getDisplayOrder());
        response.setIsVisible(category.getIsVisible());
        response.setIsEvent(category.getIsEvent());

        if (category.getChildren() != null && !category.getChildren().isEmpty()) {
            response.setChildren(category.getChildren().stream()
                    .map(CategoryResponse::from)
                    .collect(Collectors.toList()));
        } else {
            response.setChildren(new ArrayList<>());
        }

        response.setCreatedAt(category.getCreatedAt());
        response.setUpdatedAt(category.getUpdatedAt());

        return response;
    }
}