package com.agri.market.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class JwtResponse {
    private String token;
    private String refreshToken;
    private String type = "Bearer";
    private Long id;
    private String email;
    private String name;
    private List<String> roles;
    private Long accessTokenExpiresIn;
    private Long refreshTokenExpiresIn;

    // Legacy constructor for backward compatibility
    public JwtResponse(String token, String type, Long id, String email, String name, List<String> roles) {
        this.token = token;
        this.type = type;
        this.id = id;
        this.email = email;
        this.name = name;
        this.roles = roles;
    }

    // New constructor with refresh token
    public JwtResponse(String token, String refreshToken, String type, Long id, String email, String name,
                       List<String> roles, Long accessTokenExpiresIn, Long refreshTokenExpiresIn) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.type = type;
        this.id = id;
        this.email = email;
        this.name = name;
        this.roles = roles;
        this.accessTokenExpiresIn = accessTokenExpiresIn;
        this.refreshTokenExpiresIn = refreshTokenExpiresIn;
    }
}