package com.agri.market.dto;

import com.agri.market.user.address.UserAddress;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UserAddressResponse {
    private Long id;
    private String label;
    private String recipient;
    private String phone;
    private String postcode;
    private String addressLine1;
    private String addressLine2;
    private boolean isDefault;
    private LocalDateTime createdAt;

    public static UserAddressResponse from(UserAddress address) {
        UserAddressResponse response = new UserAddressResponse();
        response.setId(address.getId());
        response.setLabel(address.getLabel());
        response.setRecipient(address.getRecipient());
        response.setPhone(address.getPhone());
        response.setPostcode(address.getPostcode());
        response.setAddressLine1(address.getAddressLine1());
        response.setAddressLine2(address.getAddressLine2());
        response.setDefault(address.isDefault());
        response.setCreatedAt(address.getCreatedAt());
        return response;
    }
}
