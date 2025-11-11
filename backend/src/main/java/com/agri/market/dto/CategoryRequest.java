package com.agri.market.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryRequest {
    @NotBlank(message = "카테고리 코드는 필수입니다")
    private String code;

    @NotBlank(message = "카테고리명은 필수입니다")
    private String name;

    private String description;
    private String iconName;
    private Long parentId; // 부모 카테고리 ID

    @NotNull(message = "표시 순서는 필수입니다")
    private Integer displayOrder = 0;

    @NotNull(message = "표시 여부는 필수입니다")
    private Boolean isVisible = true;

    @NotNull(message = "이벤트 여부는 필수입니다")
    private Boolean isEvent = false;
}