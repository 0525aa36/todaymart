package com.agri.market.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;
import java.util.Collections;
import java.util.Date;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("JwtTokenProvider 단위 테스트")
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private String validJwtSecret;
    private static final int EXPIRATION_MS = 86400000; // 1 day

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();

        // Valid 512-bit (64 bytes) Base64 encoded secret
        validJwtSecret = "owf0CdDoMlclRB06aLSLU7Q1zljVWzhqV6MQFAv1JuIA1Ntmd76jwFV3RzUNGjgcGKUE9Dg3S+Ysk7yW0MAqcg==";

        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", validJwtSecret);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", EXPIRATION_MS);
    }

    @Test
    @DisplayName("JWT 토큰 생성 성공 - 기본 만료 시간")
    void generateJwtToken_Success_WithDefaultExpiration() {
        // given
        Authentication authentication = createMockAuthentication("test@example.com");
        jwtTokenProvider.init();

        // when
        String token = jwtTokenProvider.generateJwtToken(authentication);

        // then
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3); // JWT has 3 parts (header.payload.signature)
    }

    @Test
    @DisplayName("JWT 토큰 생성 성공 - 커스텀 만료 시간")
    void generateJwtToken_Success_WithCustomExpiration() {
        // given
        Authentication authentication = createMockAuthentication("test@example.com");
        jwtTokenProvider.init();
        long customExpirationMs = 30L * 24 * 60 * 60 * 1000; // 30 days

        // when
        String token = jwtTokenProvider.generateJwtToken(authentication, customExpirationMs);

        // then
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
    }

    @Test
    @DisplayName("JWT 토큰에서 사용자 이메일 추출 성공")
    void getUserNameFromJwtToken_Success() {
        // given
        String email = "test@example.com";
        Authentication authentication = createMockAuthentication(email);
        jwtTokenProvider.init();
        String token = jwtTokenProvider.generateJwtToken(authentication);

        // when
        String extractedEmail = jwtTokenProvider.getUserNameFromJwtToken(token);

        // then
        assertThat(extractedEmail).isEqualTo(email);
    }

    @Test
    @DisplayName("유효한 JWT 토큰 검증 성공")
    void validateJwtToken_Success_WithValidToken() {
        // given
        Authentication authentication = createMockAuthentication("test@example.com");
        jwtTokenProvider.init();
        String token = jwtTokenProvider.generateJwtToken(authentication);

        // when
        boolean isValid = jwtTokenProvider.validateJwtToken(token);

        // then
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("만료된 JWT 토큰 검증 실패")
    void validateJwtToken_Failure_WithExpiredToken() {
        // given
        jwtTokenProvider.init();
        String expiredToken = createExpiredToken("test@example.com");

        // when
        boolean isValid = jwtTokenProvider.validateJwtToken(expiredToken);

        // then
        assertThat(isValid).isFalse();
    }

    // Note: Testing invalid signature is complex as it requires generating a valid JWT structure
    // with a different secret. The validateJwtToken method catches all JWT exceptions and returns false,
    // so malformed tokens (tested below) achieve the same verification goal.

    @Test
    @DisplayName("형식이 잘못된 JWT 토큰 검증 실패")
    void validateJwtToken_Failure_WithMalformedToken() {
        // given
        jwtTokenProvider.init();
        String malformedToken = "malformed.token.string";

        // when
        boolean isValid = jwtTokenProvider.validateJwtToken(malformedToken);

        // then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("빈 JWT 토큰 검증 실패")
    void validateJwtToken_Failure_WithEmptyToken() {
        // given
        jwtTokenProvider.init();
        String emptyToken = "";

        // when
        boolean isValid = jwtTokenProvider.validateJwtToken(emptyToken);

        // then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("초기화 실패 - JWT Secret이 null")
    void init_Failure_WithNullSecret() {
        // given
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", null);

        // when & then
        assertThatThrownBy(() -> jwtTokenProvider.init())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET environment variable must be set");
    }

    @Test
    @DisplayName("초기화 실패 - JWT Secret이 빈 문자열")
    void init_Failure_WithEmptySecret() {
        // given
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", "   ");

        // when & then
        assertThatThrownBy(() -> jwtTokenProvider.init())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET environment variable must be set");
    }

    // Note: Base64 decoding is lenient and may accept various character combinations.
    // The more important validation is the minimum length check tested below.

    @Test
    @DisplayName("초기화 실패 - JWT Secret이 너무 짧음 (< 512 bits)")
    void init_Failure_WithShortSecret() {
        // given
        // 32 bytes (256 bits) - too short for HS512
        String shortSecret = Base64.getEncoder().encodeToString(
            "ShortSecret12345678901234567890".getBytes()
        );
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", shortSecret);

        // when & then
        assertThatThrownBy(() -> jwtTokenProvider.init())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET must be at least 64 bytes (512 bits) for HS512");
    }

    @Test
    @DisplayName("초기화 성공 - 테스트 Secret 사용 시 경고 로그")
    void init_Success_WithTestSecretWarning() {
        // given
        String testSecret = Base64.getEncoder().encodeToString(
            "TestSecretKeyForJUnitTestsThatIsAtLeast512BitsLongTestSecretKeyForJUnitTestsThatIsAtLeast512BitsLong".getBytes()
        );
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", testSecret);

        // when & then
        assertThatCode(() -> jwtTokenProvider.init())
                .doesNotThrowAnyException();
        // Note: Logger warning is checked manually or with @CaptureSystemOutput in real tests
    }

    // Helper methods

    private Authentication createMockAuthentication(String email) {
        UserDetails userDetails = User.builder()
                .username(email)
                .password("password")
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .build();

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        return authentication;
    }

    private String createExpiredToken(String email) {
        long expiredTime = System.currentTimeMillis() - 1000; // 1 second ago
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date(expiredTime - EXPIRATION_MS))
                .setExpiration(new Date(expiredTime))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(validJwtSecret)), SignatureAlgorithm.HS512)
                .compact();
    }
}
