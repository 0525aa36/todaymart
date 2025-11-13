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
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        String jwt = authService.authenticateUser(loginRequest);

        UserDetails userDetails = (UserDetails) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        User user = authService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        return ResponseEntity.ok(new JwtResponse(jwt, "Bearer", user.getId(), userDetails.getUsername(), user.getName(), roles));
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
}