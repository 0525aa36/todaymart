package com.agri.market.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserAddressRequest {

    @NotBlank(message = "배송지명은 필수입니다.")
    private String label;

    @NotBlank(message = "받는 사람은 필수입니다.")
    private String recipient;

    @NotBlank(message = "전화번호는 필수입니다.")
    @Pattern(regexp = "^\\d{2,3}-\\d{3,4}-\\d{4}$", message = "올바른 전화번호 형식이 아닙니다.")
    private String phone;

    @NotBlank(message = "우편번호는 필수입니다.")
    private String postcode;

    @NotBlank(message = "기본 주소는 필수입니다.")
    private String addressLine1;

    private String addressLine2;

    private Boolean isDefault = false;
}
