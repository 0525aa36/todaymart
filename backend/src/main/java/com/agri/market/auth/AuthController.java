package com.agri.market.auth;

import com.agri.market.dto.JwtResponse;
import com.agri.market.dto.LoginRequest;
import com.agri.market.dto.RegisterRequest;
import com.agri.market.dto.ForgotPasswordRequest;
import com.agri.market.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Tag(name = "Authentication", description = "사용자 인증 및 회원가입 API")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "회원가입", description = "새로운 사용자를 등록합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "회원가입 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (이메일 중복, 유효성 검증 실패 등)")
    })
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok("회원가입이 완료되었습니다.");
    }

    @Operation(summary = "로그인", description = "이메일과 비밀번호로 로그인하고 JWT 토큰을 발급받습니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "로그인 성공",
                    content = @Content(schema = @Schema(implementation = JwtResponse.class))),
            @ApiResponse(responseCode = "401", description = "인증 실패 (잘못된 이메일 또는 비밀번호)")
    })
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest,
                                               jakarta.servlet.http.HttpServletResponse response) {
        // 리프레시 토큰을 포함한 인증
        AuthService.AuthTokens tokens = authService.authenticateWithRefreshToken(loginRequest);

        UserDetails userDetails = (UserDetails) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        User user = authService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        // 리프레시 토큰을 httpOnly 쿠키로 설정
        jakarta.servlet.http.Cookie refreshTokenCookie = new jakarta.servlet.http.Cookie("refreshToken", tokens.refreshToken);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(false); // 로컬 개발 환경에서는 false, 프로덕션에서는 true
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(30 * 24 * 60 * 60); // 30일
        // Lax: CSRF 방어 + 크로스 사이트 호환성
        refreshTokenCookie.setAttribute("SameSite", "Lax");
        response.addCookie(refreshTokenCookie);

        // 액세스 토큰만 응답 본문에 포함 (리프레시 토큰은 제외)
        JwtResponse jwtResponse = new JwtResponse(
                tokens.accessToken,
                null, // refreshToken은 쿠키로 전송되므로 null
                "Bearer",
                user.getId(),
                user.getEmail(),
                user.getName(),
                roles,
                tokens.accessTokenExpiresIn,
                tokens.refreshTokenExpiresIn
        );

        return ResponseEntity.ok(jwtResponse);
    }

    @Operation(summary = "현재 사용자 정보 조회", description = "JWT 토큰을 사용하여 현재 로그인한 사용자의 정보를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "사용자 정보 조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body("인증되지 않은 사용자입니다.");
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        User user = authService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("name", user.getName());
        response.put("phone", user.getPhone());
        response.put("role", roles.isEmpty() ? null : roles.get(0));
        response.put("roles", roles);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "관리자 권한 검증", description = "JWT 토큰을 사용하여 현재 로그인한 사용자가 관리자 권한을 가지고 있는지 검증합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "관리자 권한 보유"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음")
    })
    @GetMapping("/validate-admin")
    public ResponseEntity<?> validateAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(Map.of("message", "인증되지 않은 사용자입니다.", "isAdmin", false));
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // ROLE_ADMIN 권한 확인
        boolean isAdmin = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equals("ROLE_ADMIN"));

        if (!isAdmin) {
            return ResponseEntity.status(403).body(Map.of("message", "관리자 권한이 없습니다.", "isAdmin", false));
        }

        User user = authService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Map<String, Object> response = new HashMap<>();
        response.put("isAdmin", true);
        response.put("email", user.getEmail());
        response.put("name", user.getName());

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "비밀번호 찾기", description = "이메일로 임시 비밀번호를 발송합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "임시 비밀번호 발송 성공"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    })
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.resetPassword(request.getEmail());

        Map<String, String> response = new HashMap<>();
        response.put("message", "임시 비밀번호가 이메일로 전송되었습니다. 이메일을 확인해주세요.");

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "액세스 토큰 갱신", description = "리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "토큰 갱신 성공"),
            @ApiResponse(responseCode = "401", description = "유효하지 않거나 만료된 리프레시 토큰")
    })
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(jakarta.servlet.http.HttpServletRequest request) {
        // 쿠키에서 리프레시 토큰 추출
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "리프레시 토큰이 없습니다."));
        }

        try {
            // 새로운 액세스 토큰 발급
            String newAccessToken = authService.refreshAccessToken(refreshToken);

            Map<String, Object> response = new HashMap<>();
            response.put("token", newAccessToken);
            response.put("type", "Bearer");
            response.put("accessTokenExpiresIn", 3600000L); // 1시간

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @Operation(summary = "로그아웃", description = "리프레시 토큰을 삭제하여 로그아웃합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "로그아웃 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    @PostMapping("/logout")
    public ResponseEntity<?> logout(jakarta.servlet.http.HttpServletRequest request,
                                     jakarta.servlet.http.HttpServletResponse response) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated() && !authentication.getPrincipal().equals("anonymousUser")) {
            // 쿠키에서 리프레시 토큰 추출
            String refreshToken = null;
            if (request.getCookies() != null) {
                for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                    if ("refreshToken".equals(cookie.getName())) {
                        refreshToken = cookie.getValue();
                        break;
                    }
                }
            }

            // DB에서 리프레시 토큰 삭제
            if (refreshToken != null) {
                authService.logoutByToken(refreshToken);
            }
        }

        // 리프레시 토큰 쿠키 삭제
        jakarta.servlet.http.Cookie refreshTokenCookie = new jakarta.servlet.http.Cookie("refreshToken", "");
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(false);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(0); // 쿠키 삭제
        refreshTokenCookie.setAttribute("SameSite", "Lax");
        response.addCookie(refreshTokenCookie);

        return ResponseEntity.ok(Map.of("message", "로그아웃되었습니다."));
    }
}