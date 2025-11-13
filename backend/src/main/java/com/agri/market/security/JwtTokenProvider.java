package com.agri.market.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);
    private static final int MINIMUM_SECRET_LENGTH = 64; // 512 bits = 64 bytes

    @Value("${app.jwtSecret}")
    private String jwtSecret;

    @Value("${app.jwtExpirationMs}")
    private int jwtExpirationMs;

    @PostConstruct
    public void init() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException("JWT_SECRET environment variable must be set");
        }

        // Check if using insecure test secret
        if (jwtSecret.contains("TestSecretKey") || jwtSecret.contains("test")) {
            logger.warn("WARNING: Using test JWT secret. This is INSECURE for production!");
        }

        // Validate secret length for HS512
        byte[] decodedSecret;
        try {
            decodedSecret = Decoders.BASE64.decode(jwtSecret);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("JWT_SECRET must be valid Base64 encoded string", e);
        }

        if (decodedSecret.length < MINIMUM_SECRET_LENGTH) {
            throw new IllegalStateException(
                String.format("JWT_SECRET must be at least %d bytes (512 bits) for HS512. Current length: %d bytes",
                    MINIMUM_SECRET_LENGTH, decodedSecret.length)
            );
        }

        logger.info("JWT Token Provider initialized successfully");
    }

    public String generateJwtToken(Authentication authentication) {
        return generateJwtToken(authentication, jwtExpirationMs);
    }

    public String generateJwtToken(Authentication authentication, long expirationMs) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();

        return Jwts.builder()
                .setSubject((userPrincipal.getUsername()))
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + expirationMs))
                .signWith(key(), SignatureAlgorithm.HS512)
                .compact();
    }

    private Key key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parse(authToken);
            return true;
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        }

        return false;
    }
}