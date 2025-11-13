package com.agri.market.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductOptionRequest {
    @NotBlank(message = "옵션명은 필수입니다")
    @Size(max = 100, message = "옵션명은 최대 100자입니다")
    private String optionName;

    @NotBlank(message = "옵션값은 필수입니다")
    @Size(max = 200, message = "옵션값은 최대 200자입니다")
    private String optionValue;

    @NotNull(message = "추가 가격은 필수입니다")
    @DecimalMin(value = "0.0", message = "추가 가격은 0 이상이어야 합니다")
    private BigDecimal additionalPrice;

    @NotNull(message = "재고는 필수입니다")
    @Min(value = 0, message = "재고는 0 이상이어야 합니다")
    private Integer stock;

    @NotNull(message = "사용 가능 여부는 필수입니다")
    private Boolean isAvailable;
}
