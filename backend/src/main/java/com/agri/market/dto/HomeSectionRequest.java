package com.agri.market.dto;

import com.agri.market.home.HomeSection;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HomeSectionRequest {
    private HomeSection.SectionType sectionType;
    private String title;
    private String description;
    private Integer displayOrder;
    private Boolean isActive;
    private Map<String, Object> config;
}
