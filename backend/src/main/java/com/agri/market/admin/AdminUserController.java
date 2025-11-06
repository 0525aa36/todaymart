package com.agri.market.admin;

import com.agri.market.dto.ApiResponse;
import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 관리자 사용자 관리 컨트롤러
 */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;
    private final AdminUserService adminUserService;

    public AdminUserController(UserRepository userRepository, AdminUserService adminUserService) {
        this.userRepository = userRepository;
        this.adminUserService = adminUserService;
    }

    /**
     * 사용자 목록 조회 (페이징)
     */
    @GetMapping
    public ResponseEntity<Page<UserDto>> getAllUsers(Pageable pageable) {
        Page<UserDto> users = adminUserService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }

    /**
     * 사용자 검색 (이름, 이메일)
     */
    @GetMapping("/search")
    public ResponseEntity<Page<UserDto>> searchUsers(
            @RequestParam String query,
            Pageable pageable) {
        Page<UserDto> users = adminUserService.searchUsers(query, pageable);
        return ResponseEntity.ok(users);
    }

    /**
     * 사용자 상세 조회 (구매 이력 포함)
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserDetailDto> getUserDetail(@PathVariable Long userId) {
        UserDetailDto userDetail = adminUserService.getUserDetail(userId);
        return ResponseEntity.ok(userDetail);
    }

    /**
     * 사용자 활성화/비활성화
     */
    @PutMapping("/{userId}/status")
    public ResponseEntity<ApiResponse<Void>> updateUserStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> request) {
        boolean enabled = request.get("enabled");
        adminUserService.updateUserStatus(userId, enabled);
        return ResponseEntity.ok(ApiResponse.success("사용자 상태가 변경되었습니다.", null));
    }

    /**
     * 사용자 역할 변경 (일반 사용자 <-> 관리자)
     */
    @PutMapping("/{userId}/role")
    public ResponseEntity<ApiResponse<Void>> updateUserRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        String role = request.get("role");
        adminUserService.updateUserRole(userId, role);
        return ResponseEntity.ok(ApiResponse.success("사용자 역할이 변경되었습니다.", null));
    }

    /**
     * 사용자 통계 조회
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getUserStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // 전체 사용자 수
        long totalUsers = userRepository.count();

        // 오늘 가입한 사용자
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        long todayNewUsers = userRepository.countByCreatedAtBetween(todayStart, LocalDateTime.now());

        // 이번 달 가입한 사용자
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        long monthNewUsers = userRepository.countByCreatedAtBetween(monthStart, LocalDateTime.now());

        stats.put("totalUsers", totalUsers);
        stats.put("todayNewUsers", todayNewUsers);
        stats.put("monthNewUsers", monthNewUsers);

        return ResponseEntity.ok(stats);
    }
}
