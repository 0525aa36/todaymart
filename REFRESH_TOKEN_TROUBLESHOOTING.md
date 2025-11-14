# 리프레시 토큰 시스템 트러블슈팅 가이드

## 개요

이 문서는 리프레시 토큰 시스템 구현 과정에서 발생한 문제들과 해결 방법을 정리합니다.

### 시스템 구성
- **프론트엔드**: Next.js (http://localhost:3000)
- **백엔드**: Spring Boot (http://localhost:8081)
- **액세스 토큰**: 1시간 만료, localStorage 저장
- **리프레시 토큰**: 30일 만료, httpOnly 쿠키 저장, DB 추적

---

## 문제 1: 리프레시 토큰 쿠키가 브라우저에 저장되지 않음

### 증상
```
브라우저 쿠키 (http://localhost:8081):
- JSESSIONID만 존재
- refreshToken 쿠키가 보이지 않음
```

로그인 요청은 200 OK 응답을 받지만, `refreshToken` httpOnly 쿠키가 브라우저에 저장되지 않는 문제.

### 원인

**SameSite=Strict 정책 문제**

```java
// 문제가 있는 코드
refreshTokenCookie.setAttribute("SameSite", "Strict");
```

`SameSite=Strict`는 **완전히 같은 사이트**에서만 쿠키를 전송합니다. 하지만:
- 프론트엔드: `localhost:3000`
- 백엔드: `localhost:8081`

**다른 포트 = 크로스 사이트**로 간주되어 쿠키가 차단됩니다.

### 해결 방법

**SameSite=Lax로 변경**

```java
// AuthController.java - 로그인 엔드포인트
jakarta.servlet.http.Cookie refreshTokenCookie =
    new jakarta.servlet.http.Cookie("refreshToken", tokens.refreshToken);
refreshTokenCookie.setHttpOnly(true);
refreshTokenCookie.setSecure(false); // 로컬 개발: false, 프로덕션: true
refreshTokenCookie.setPath("/");
refreshTokenCookie.setMaxAge(30 * 24 * 60 * 60); // 30일
refreshTokenCookie.setAttribute("SameSite", "Lax"); // ✅ Strict → Lax
response.addCookie(refreshTokenCookie);
```

**SameSite 정책 비교:**

| 설정 | 동작 | 보안 | 호환성 |
|------|------|------|--------|
| `Strict` | 완전히 같은 사이트만 | 최고 | 낮음 (다른 포트 차단) |
| `Lax` | GET 요청 허용, POST는 제한 | 높음 | 높음 (권장) |
| `None` | 모든 요청 허용 (HTTPS 필수) | 낮음 | 최고 |

### 검증 방법

```bash
# 로그인 API 테스트
curl -v -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"email":"test@example.com","password":"password"}' \
  2>&1 | grep -i "set-cookie"

# 기대 결과:
# Set-Cookie: refreshToken=...; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax
```

---

## 문제 2: CORS 설정으로 인한 쿠키 전송 실패

### 증상

백엔드 로그에서 `Set-Cookie` 헤더가 정상 전송되지만, 브라우저가 쿠키를 저장하지 않음.

### 원인

**CORS 설정에서 와일드카드(`*`) 사용**

```java
// 문제가 있는 코드
configuration.setAllowedHeaders(List.of("*")); // ❌
configuration.setAllowCredentials(true);       // credentials=true와 충돌!
```

`setAllowCredentials(true)`와 `setAllowedHeaders("*")`는 함께 사용할 수 없습니다.

### 해결 방법

**명시적 헤더 목록 지정 + Set-Cookie 노출**

```java
// SecurityConfig.java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();

    List<String> origins = Arrays.asList(allowedOrigins.split(","));
    configuration.setAllowedOrigins(origins);

    configuration.setAllowedMethods(Arrays.asList(
        "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
    ));

    // ✅ 와일드카드 제거, 명시적 헤더 목록
    configuration.setAllowedHeaders(Arrays.asList(
        "Authorization",
        "Content-Type",
        "Accept",
        "X-Requested-With",
        "Cache-Control"
    ));

    // ✅ Set-Cookie 헤더 노출
    configuration.setExposedHeaders(Arrays.asList(
        "Set-Cookie",
        "Authorization"
    ));

    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

### 검증 방법

브라우저 개발자 도구 (F12) → Network 탭:
```
Request Headers:
  Origin: http://localhost:3000

Response Headers:
  Access-Control-Allow-Credentials: true
  Access-Control-Expose-Headers: Set-Cookie, Authorization
  Set-Cookie: refreshToken=...; HttpOnly; SameSite=Lax
```

---

## 문제 3: 로그아웃 시 쿠키가 삭제되지 않음

### 증상

로그아웃 API 호출 후에도 `refreshToken` 쿠키가 브라우저에 남아있음.

### 원인

**쿠키 삭제 시 속성 불일치**

쿠키를 삭제하려면 **생성할 때와 동일한 속성**(Path, SameSite)을 설정해야 합니다.

```java
// 문제가 있는 코드
Cookie cookie = new Cookie("refreshToken", null); // 또는 ""
cookie.setPath("/");
cookie.setMaxAge(0);
// ❌ SameSite 속성 누락!
response.addCookie(cookie);
```

### 해결 방법

**생성 시와 동일한 속성으로 쿠키 삭제**

```java
// AuthController.java - 로그아웃 엔드포인트
@PostMapping("/logout")
public ResponseEntity<?> logout(HttpServletRequest request,
                                 HttpServletResponse response) {
    // ... DB에서 리프레시 토큰 삭제 로직 ...

    // ✅ 쿠키 삭제 (생성 시와 동일한 속성 설정)
    jakarta.servlet.http.Cookie refreshTokenCookie =
        new jakarta.servlet.http.Cookie("refreshToken", "");
    refreshTokenCookie.setHttpOnly(true);
    refreshTokenCookie.setSecure(false);
    refreshTokenCookie.setPath("/");
    refreshTokenCookie.setMaxAge(0); // 쿠키 삭제
    refreshTokenCookie.setAttribute("SameSite", "Lax"); // ✅ 생성 시와 동일
    response.addCookie(refreshTokenCookie);

    return ResponseEntity.ok(Map.of("message", "로그아웃되었습니다."));
}
```

### 검증 방법

1. 로그인 후 쿠키 확인
2. 로그아웃 API 호출
3. F12 → Application → Cookies → `http://localhost:8081`
4. `refreshToken` 쿠키가 사라졌는지 확인

---

## 문제 4: OAuth2 소셜 로그인 시 리프레시 토큰 미생성

### 증상

- 일반 로그인: `refreshToken` 생성 ✅
- 네이버/카카오 소셜 로그인: `refreshToken` 미생성 ❌

### 원인

OAuth2 로그인은 별도의 `OAuth2AuthenticationSuccessHandler`를 사용하며, 이 핸들러가 리프레시 토큰 생성 로직을 포함하지 않았음.

### 해결 방법

**OAuth2AuthenticationSuccessHandler에 리프레시 토큰 로직 추가**

```java
// OAuth2AuthenticationSuccessHandler.java
@Component
public class OAuth2AuthenticationSuccessHandler
    extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService; // ✅ 추가
    private final UserRepository userRepository;           // ✅ 추가

    @Value("${frontend.url}")
    private String frontendUrl;

    public OAuth2AuthenticationSuccessHandler(
            JwtTokenProvider jwtTokenProvider,
            RefreshTokenService refreshTokenService,  // ✅ 추가
            UserRepository userRepository) {           // ✅ 추가
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.userRepository = userRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
                                        throws IOException, ServletException {
        if (response.isCommitted()) {
            return;
        }

        // ✅ 액세스 토큰 생성 (1시간)
        String accessToken = jwtTokenProvider.generateAccessToken(authentication);

        // ✅ 사용자 정보 조회
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // ✅ 리프레시 토큰 생성 및 DB 저장 (30일)
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        // ✅ 리프레시 토큰을 httpOnly 쿠키로 설정
        jakarta.servlet.http.Cookie refreshTokenCookie =
            new jakarta.servlet.http.Cookie("refreshToken", refreshToken.getToken());
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(false);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(30 * 24 * 60 * 60); // 30일
        refreshTokenCookie.setAttribute("SameSite", "Lax");
        response.addCookie(refreshTokenCookie);

        // 프론트엔드 리다이렉트 (액세스 토큰은 쿼리 파라미터)
        String targetUrl = UriComponentsBuilder
            .fromUriString(frontendUrl + "/oauth2/redirect")
            .queryParam("token", accessToken)
            .build()
            .toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
```

### 검증 방법

1. 네이버 또는 카카오로 로그인
2. 로그인 성공 후 리다이렉트
3. F12 → Application → Cookies → `http://localhost:8081`
4. `refreshToken` 쿠키 확인

---

## 문제 5: 프론트엔드에서 401 에러 발생 시 자동 갱신 실패

### 증상

액세스 토큰 만료(1시간 후) 시 API 요청이 401 에러로 실패하고 자동 갱신되지 않음.

### 원인

프론트엔드 API 클라이언트가 401 에러를 단순 에러로 처리하고 리프레시 토큰 갱신 로직이 없음.

### 해결 방법

**api-client.ts에 자동 토큰 갱신 로직 추가**

```typescript
// frontend/lib/api-client.ts

// 리프레시 토큰 갱신 상태 관리 (동시성 처리)
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { auth = false, parseResponse = "json", skipRefresh = false, ...rest } = options

  // ... 헤더 설정 ...

  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    credentials: "include", // ✅ 쿠키 포함 (리프레시 토큰)
  })

  // ✅ 401 에러 발생 시 자동 토큰 갱신 시도
  if (response.status === 401 && auth && !skipRefresh && typeof window !== "undefined") {
    console.log("[API Client] 401 Unauthorized - 토큰 갱신 시도")

    const newToken = await refreshAccessToken()

    if (newToken) {
      // 새 토큰으로 원래 요청 재시도
      console.log("[API Client] 토큰 갱신 성공 - 요청 재시도")
      return apiFetch<T>(path, { ...options, skipRefresh: true }) // 무한 루프 방지
    } else {
      // 리프레시 실패 - 로그아웃 처리
      console.log("[API Client] 토큰 갱신 실패 - 로그아웃")
      handleLogout()
      throw new ApiError(response.status, "인증이 만료되었습니다. 다시 로그인해주세요.")
    }
  }

  // ... 나머지 응답 처리 ...
}

/**
 * 리프레시 토큰으로 새로운 액세스 토큰 발급
 * 동시에 여러 요청이 401을 받아도 한 번만 리프레시 요청
 */
async function refreshAccessToken(): Promise<string | null> {
  // 이미 리프레시 중이면 대기
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include", // httpOnly 쿠키 포함
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.error("[API Client] 리프레시 토큰 갱신 실패:", response.status)
        return null
      }

      const data = await response.json()
      const newToken = data.token

      if (newToken && typeof window !== "undefined") {
        // 새 액세스 토큰 저장
        localStorage.setItem("token", newToken)
        console.log("[API Client] 새 액세스 토큰 저장 완료")
        return newToken
      }

      return null
    } catch (error) {
      console.error("[API Client] 리프레시 토큰 갱신 중 에러:", error)
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

function handleLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
  }
}
```

### 주요 특징

1. **동시성 처리**: 여러 API 요청이 동시에 401을 받아도 리프레시는 1번만 실행
2. **자동 재시도**: 토큰 갱신 성공 시 원래 요청을 자동으로 재시도
3. **무한 루프 방지**: `skipRefresh` 플래그로 갱신 후 재시도는 1회로 제한
4. **자동 로그아웃**: 리프레시 실패 시 자동으로 로그인 페이지로 이동

### 검증 방법

1. 로그인 후 1시간 대기 (또는 액세스 토큰 만료 시간 변경)
2. API 요청 시도 (예: 장바구니 조회)
3. 브라우저 콘솔에서 로그 확인:
   ```
   [API Client] 401 Unauthorized - 토큰 갱신 시도
   [API Client] 새 액세스 토큰 저장 완료
   [API Client] 토큰 갱신 성공 - 요청 재시도
   ```
4. 요청이 성공적으로 완료되는지 확인

---

## 베스트 프랙티스

### 1. 환경별 쿠키 설정

```java
// 프로덕션 환경에서는 Secure=true 사용
@Value("${spring.profiles.active:local}")
private String activeProfile;

Cookie refreshTokenCookie = new Cookie("refreshToken", token);
refreshTokenCookie.setHttpOnly(true);
refreshTokenCookie.setSecure("prod".equals(activeProfile)); // prod: true, local: false
refreshTokenCookie.setPath("/");
refreshTokenCookie.setAttribute("SameSite", "Lax");
```

### 2. 리프레시 토큰 만료 정책

```java
// RefreshTokenService.java
@Scheduled(cron = "0 0 2 * * ?") // 매일 새벽 2시
public void cleanupExpiredTokens() {
    refreshTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    logger.info("만료된 리프레시 토큰 정리 완료");
}
```

### 3. 로그인 기록 추적

```java
// User 엔티티에 lastLoginAt 필드 업데이트
public AuthTokens authenticateWithRefreshToken(LoginRequest loginRequest) {
    // ... 인증 로직 ...

    user.setLastLoginAt(LocalDateTime.now());
    userRepository.save(user);

    // ... 토큰 생성 ...
}
```

### 4. 보안 헤더 추가

```java
// SecurityConfig.java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp
        .policyDirectives("default-src 'self'"))
    .frameOptions().deny()
    .xssProtection().block(true)
);
```

---

## 디버깅 체크리스트

### 로그인 시 리프레시 토큰이 생성되지 않을 때

- [ ] CORS 설정에서 `allowCredentials(true)` 확인
- [ ] `setAllowedHeaders`에서 와일드카드(`*`) 사용하지 않았는지 확인
- [ ] `setExposedHeaders`에 `Set-Cookie` 포함되었는지 확인
- [ ] `SameSite=Lax` 설정되어 있는지 확인
- [ ] 백엔드 응답 헤더에 `Set-Cookie: refreshToken=...` 있는지 확인
- [ ] 프론트엔드 요청 시 `credentials: "include"` 설정되어 있는지 확인

### 로그아웃 시 쿠키가 삭제되지 않을 때

- [ ] 쿠키 삭제 시 `Path` 설정 확인
- [ ] 쿠키 삭제 시 `SameSite` 속성 설정 확인
- [ ] `MaxAge=0` 설정되어 있는지 확인
- [ ] 브라우저 개발자 도구에서 응답 헤더 확인

### 토큰 자동 갱신이 안 될 때

- [ ] `/api/auth/refresh` 엔드포인트가 `permitAll()` 설정되어 있는지 확인
- [ ] 프론트엔드 요청 시 `credentials: "include"` 설정 확인
- [ ] httpOnly 쿠키가 백엔드 도메인에 저장되어 있는지 확인
- [ ] 리프레시 토큰이 DB에 존재하고 만료되지 않았는지 확인
- [ ] 브라우저 콘솔 로그 확인

---

## 참고 자료

- [MDN - SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [OWASP - JWT Security](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Spring Security CORS](https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html)

---

## 구현 완료 체크리스트

- [x] 일반 로그인 시 리프레시 토큰 생성
- [x] OAuth2 소셜 로그인 시 리프레시 토큰 생성
- [x] 로그아웃 시 리프레시 토큰 DB 삭제 및 쿠키 삭제
- [x] 액세스 토큰 만료 시 자동 갱신
- [x] httpOnly 쿠키로 XSS 방어
- [x] SameSite=Lax로 CSRF 방어
- [x] CORS 설정으로 크로스 오리진 요청 허용
- [x] 동시성 처리로 중복 리프레시 방지
- [x] 만료된 리프레시 토큰 자동 정리 (선택)
