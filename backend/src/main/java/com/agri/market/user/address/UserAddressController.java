package com.agri.market.user.address;

import com.agri.market.dto.UserAddressRequest;
import com.agri.market.dto.UserAddressResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
public class UserAddressController {

    private final UserAddressService userAddressService;

    public UserAddressController(UserAddressService userAddressService) {
        this.userAddressService = userAddressService;
    }

    @GetMapping
    public ResponseEntity<List<UserAddressResponse>> getAddresses(Authentication authentication) {
        String email = getEmail(authentication);
        return ResponseEntity.ok(userAddressService.getAddresses(email));
    }

    @PostMapping
    public ResponseEntity<UserAddressResponse> createAddress(
            @Valid @RequestBody UserAddressRequest request,
            Authentication authentication) {
        String email = getEmail(authentication);
        return ResponseEntity.ok(userAddressService.createAddress(email, request));
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<UserAddressResponse> updateAddress(
            @PathVariable Long addressId,
            @Valid @RequestBody UserAddressRequest request,
            Authentication authentication) {
        String email = getEmail(authentication);
        return ResponseEntity.ok(userAddressService.updateAddress(email, addressId, request));
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            @PathVariable Long addressId,
            Authentication authentication) {
        String email = getEmail(authentication);
        userAddressService.deleteAddress(email, addressId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{addressId}/default")
    public ResponseEntity<UserAddressResponse> setDefaultAddress(
            @PathVariable Long addressId,
            Authentication authentication) {
        String email = getEmail(authentication);
        return ResponseEntity.ok(userAddressService.setDefaultAddress(email, addressId));
    }

    private String getEmail(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return userDetails.getUsername();
    }
}
