package com.agri.market.admin;

import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * 사용자 목록 조회 (페이지네이션, 검색, 역할 필터)
     */
    @GetMapping
    public ResponseEntity<Page<User>> getAllUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<User> users;

        if (role != null && !role.trim().isEmpty()) {
            users = userRepository.findByRole(role, pageable);
        } else if (keyword != null && !keyword.trim().isEmpty()) {
            users = userRepository.searchUsers(keyword, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        return ResponseEntity.ok(users);
    }

    /**
     * 사용자 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + id));
        return ResponseEntity.ok(user);
    }

    /**
     * 사용자 역할 변경
     */
    @PutMapping("/{id}/role")
    public ResponseEntity<User> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + id));

        String newRole = request.get("role");
        if (newRole == null || newRole.trim().isEmpty()) {
            throw new RuntimeException("역할 값이 필요합니다.");
        }

        // 유효한 역할인지 검증
        if (!newRole.equals("USER") && !newRole.equals("ADMIN")) {
            throw new RuntimeException("유효하지 않은 역할입니다. USER 또는 ADMIN만 가능합니다.");
        }

        user.setRole(newRole);
        User updatedUser = userRepository.save(user);

        return ResponseEntity.ok(updatedUser);
    }

    /**
     * 사용자 통계
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        long totalUsers = userRepository.count();
        long adminUsers = userRepository.findByRole("ADMIN", Pageable.unpaged()).getTotalElements();
        long normalUsers = userRepository.findByRole("USER", Pageable.unpaged()).getTotalElements();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("adminUsers", adminUsers);
        stats.put("normalUsers", normalUsers);

        return ResponseEntity.ok(stats);
    }
}
