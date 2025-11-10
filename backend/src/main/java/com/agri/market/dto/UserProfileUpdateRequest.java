package com.agri.market.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UserProfileUpdateRequest {
    @NotBlank(message = "이름은 필수입니다.")
    @Size(max = 100, message = "이름은 최대 100자입니다.")
    private String name;

    @NotBlank(message = "전화번호는 필수입니다.")
    @Pattern(regexp = "^\\d{2,3}-\\d{3,4}-\\d{4}$", message = "올바른 전화번호 형식이 아닙니다.")
    private String phone;

    @NotBlank(message = "주소는 필수입니다.")
    private String addressLine1;

    private String addressLine2;

    @Size(max = 10, message = "우편번호는 최대 10자입니다.")
    private String postcode;

    private LocalDate birthDate;

    @Pattern(regexp = "^(male|female)?$", message = "성별은 male 또는 female이어야 합니다.")
    private String gender;
}
