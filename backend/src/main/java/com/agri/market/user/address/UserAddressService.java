package com.agri.market.user.address;

import com.agri.market.dto.UserAddressRequest;
import com.agri.market.dto.UserAddressResponse;
import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserAddressService {

    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;

    public UserAddressService(UserRepository userRepository, UserAddressRepository userAddressRepository) {
        this.userRepository = userRepository;
        this.userAddressRepository = userAddressRepository;
    }

    @Transactional(readOnly = true)
    public List<UserAddressResponse> getAddresses(String email) {
        User user = getUser(email);
        return userAddressRepository.findByUserOrderByIsDefaultDescCreatedAtDesc(user)
                .stream()
                .map(UserAddressResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserAddressResponse createAddress(String email, UserAddressRequest request) {
        User user = getUser(email);

        boolean shouldBeDefault = Boolean.TRUE.equals(request.getIsDefault())
                || !userAddressRepository.existsByUser(user);

        if (shouldBeDefault) {
            unsetDefaultAddress(user, null);
        }

        UserAddress address = new UserAddress();
        address.setUser(user);
        applyRequest(address, request);
        address.setDefault(shouldBeDefault);

        UserAddress saved = userAddressRepository.save(address);
        return UserAddressResponse.from(saved);
    }

    @Transactional
    public UserAddressResponse updateAddress(String email, Long addressId, UserAddressRequest request) {
        User user = getUser(email);
        UserAddress address = getAddressForUser(addressId, user);

        applyRequest(address, request);
        boolean requestedDefault = Boolean.TRUE.equals(request.getIsDefault());
        boolean wasDefault = address.isDefault();

        if (requestedDefault) {
            unsetDefaultAddress(user, address.getId());
            address.setDefault(true);
        } else {
            address.setDefault(false);
        }

        UserAddress saved = userAddressRepository.save(address);

        if (wasDefault && !requestedDefault) {
            ensureDefaultExists(user);
        }

        return UserAddressResponse.from(saved);
    }

    @Transactional
    public void deleteAddress(String email, Long addressId) {
        User user = getUser(email);
        UserAddress address = getAddressForUser(addressId, user);

        boolean wasDefault = address.isDefault();
        userAddressRepository.delete(address);

        if (wasDefault) {
            ensureDefaultExists(user);
        }
    }

    @Transactional
    public UserAddressResponse setDefaultAddress(String email, Long addressId) {
        User user = getUser(email);
        UserAddress address = getAddressForUser(addressId, user);

        unsetDefaultAddress(user, address.getId());
        address.setDefault(true);

        return UserAddressResponse.from(userAddressRepository.save(address));
    }

    private void applyRequest(UserAddress address, UserAddressRequest request) {
        address.setLabel(request.getLabel());
        address.setRecipient(request.getRecipient());
        address.setPhone(request.getPhone());
        address.setPostcode(request.getPostcode());
        address.setAddressLine1(request.getAddressLine1());
        address.setAddressLine2(request.getAddressLine2());
    }

    private void unsetDefaultAddress(User user, Long excludeId) {
        userAddressRepository.findByUserAndIsDefaultTrue(user)
                .ifPresent(existing -> {
                    if (excludeId == null || !existing.getId().equals(excludeId)) {
                        existing.setDefault(false);
                        userAddressRepository.save(existing);
                    }
                });
    }

    private void ensureDefaultExists(User user) {
        if (userAddressRepository.findByUserAndIsDefaultTrue(user).isPresent()) {
            return;
        }
        userAddressRepository.findFirstByUserOrderByCreatedAtAsc(user)
                .ifPresent(address -> {
                    address.setDefault(true);
                    userAddressRepository.save(address);
                });
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new com.agri.market.exception.BusinessException("사용자를 찾을 수 없습니다: " + email, "USER_NOT_FOUND"));
    }

    private UserAddress getAddressForUser(Long addressId, User user) {
        return userAddressRepository.findByIdAndUser(addressId, user)
                .orElseThrow(() -> new com.agri.market.exception.BusinessException("주소를 찾을 수 없습니다", "ADDRESS_NOT_FOUND"));
    }
}
