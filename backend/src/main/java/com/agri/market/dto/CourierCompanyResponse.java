package com.agri.market.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 택배사 정보 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourierCompanyResponse {

    /**
     * 택배사 코드
     */
    private String code;

    /**
     * 택배사 이름
     */
    private String name;
}
