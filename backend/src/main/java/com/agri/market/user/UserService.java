package com.agri.market.user;

import com.agri.market.dto.PasswordChangeRequest;
import com.agri.market.dto.UserProfileUpdateRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    @Transactional
    public User updateProfile(String email, UserProfileUpdateRequest request) {
        User user = getUserByEmail(email);

        // OAuth 사용자(카카오, 네이버)는 이름, 전화번호, 성별 수정 불가
        if ("KAKAO".equals(user.getProvider()) || "NAVER".equals(user.getProvider())) {
            // 이름 변경 시도 검증
            if (!user.getName().equals(request.getName())) {
                throw new RuntimeException("소셜 로그인 회원은 이름을 변경할 수 없습니다.");
            }
            // 전화번호 변경 시도 검증
            if (!user.getPhone().equals(request.getPhone())) {
                throw new RuntimeException("소셜 로그인 회원은 전화번호를 변경할 수 없습니다.");
            }
        }

        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setAddressLine1(request.getAddressLine1());
        user.setAddressLine2(request.getAddressLine2());
        user.setPostcode(request.getPostcode());

        // 생년월일 수정 검증: 카카오 회원만 한 번 수정 가능 (null -> 값 설정만 허용)
        if (request.getBirthDate() != null) {
            if ("KAKAO".equals(user.getProvider())) {
                // 카카오 회원은 기존 생년월일이 null인 경우에만 설정 가능
                if (user.getBirthDate() == null) {
                    user.setBirthDate(request.getBirthDate());
                } else if (!user.getBirthDate().equals(request.getBirthDate())) {
                    // 기존 값과 다른 값으로 변경하려는 경우 에러
                    throw new RuntimeException("생년월일은 최초 설정 이후 변경할 수 없습니다.");
                }
                // 기존 값과 동일한 경우는 아무 작업도 하지 않음 (허용)
            } else {
                // 네이버, 로컬 회원은 생년월일 수정 불가
                if (user.getBirthDate() == null || !user.getBirthDate().equals(request.getBirthDate())) {
                    throw new RuntimeException("생년월일은 변경할 수 없습니다.");
                }
                // 기존 값과 동일한 경우는 아무 작업도 하지 않음 (허용)
            }
        }
        // 성별 수정 검증: OAuth 사용자는 수정 불가
        if (request.getGender() != null) {
            if ("KAKAO".equals(user.getProvider()) || "NAVER".equals(user.getProvider())) {
                // 기존 성별과 다른 값으로 변경하려는 경우 에러
                if (user.getGender() == null || !user.getGender().equals(request.getGender())) {
                    throw new RuntimeException("소셜 로그인 회원은 성별을 변경할 수 없습니다.");
                }
            }
            user.setGender(request.getGender());
        }

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(String email, PasswordChangeRequest request) {
        User user = getUserByEmail(email);

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
        }

        // Verify new password confirmation
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
        }

        // Encode and save new password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
