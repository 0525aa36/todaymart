package com.agri.market.token;

import com.agri.market.exception.InvalidTokenException;
import com.agri.market.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.jwtRefreshTokenExpirationMs}")
    private long refreshTokenExpirationMs;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // 기존 리프레시 토큰 삭제 (한 유저당 하나의 리프레시 토큰만 유지)
        refreshTokenRepository.deleteByUser(user);

        // 새 리프레시 토큰 생성
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000));

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional(readOnly = true)
    public RefreshToken validateRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("유효하지 않은 리프레시 토큰입니다."));

        if (refreshToken.isExpired()) {
            throw new InvalidTokenException("만료된 리프레시 토큰입니다.");
        }

        return refreshToken;
    }

    @Transactional
    public void revokeRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user);
    }

    @Transactional
    public void revokeRefreshToken(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(refreshTokenRepository::delete);
    }

    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }
}
