package com.agri.market.dto;

import com.agri.market.user.User;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class UserProfileResponse {
    private Long id;
    private String email;
    private String name;
    private String phone;
    private String addressLine1;
    private String addressLine2;
    private String postcode;
    private LocalDate birthDate;
    private String gender;
    private String role;
    private String provider;
    private LocalDateTime createdAt;

    public static UserProfileResponse from(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setPhone(user.getPhone());
        response.setAddressLine1(user.getAddressLine1());
        response.setAddressLine2(user.getAddressLine2());
        response.setPostcode(user.getPostcode());
        response.setBirthDate(user.getBirthDate());
        response.setGender(user.getGender());
        response.setRole(user.getRole());
        response.setProvider(user.getProvider());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }
}
