package com.agri.market.dto;

import com.agri.market.home.HomeSection;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeSectionResponse {
    private Long id;
    private HomeSection.SectionType sectionType;
    private String title;
    private String description;
    private Integer displayOrder;
    private Boolean isActive;
    private Map<String, Object> config;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static HomeSectionResponse from(HomeSection section) {
        return HomeSectionResponse.builder()
                .id(section.getId())
                .sectionType(section.getSectionType())
                .title(section.getTitle())
                .description(section.getDescription())
                .displayOrder(section.getDisplayOrder())
                .isActive(section.getIsActive())
                .config(section.getConfig())
                .createdAt(section.getCreatedAt())
                .updatedAt(section.getUpdatedAt())
                .build();
    }
}
