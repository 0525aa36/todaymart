package com.agri.market.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class RegisterRequest {
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    @NotBlank(message = "이메일은 필수 입력 항목입니다.")
    private String email;  // 아이디 (이메일)

    @NotBlank(message = "비밀번호는 필수 입력 항목입니다.")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
    private String password;

    @NotBlank(message = "이름은 필수 입력 항목입니다.")
    private String name;

    @NotBlank(message = "전화번호는 필수 입력 항목입니다.")
    private String phone;

    @NotBlank(message = "주소는 필수 입력 항목입니다.")
    private String addressLine1;

    private String addressLine2;

    @NotBlank(message = "우편번호는 필수 입력 항목입니다.")
    private String postcode;

    @NotNull(message = "생년월일은 필수 입력 항목입니다.")
    private LocalDate birthDate;

    private String gender; // 성별: "male" 또는 "female"

    private Boolean marketingConsent = false; // 마케팅 정보 수신 동의 (선택)
}