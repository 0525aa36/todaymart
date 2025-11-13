package com.agri.market.config;

import com.agri.market.security.AuthEntryPointJwt;
import com.agri.market.security.JwtAuthenticationFilter;
import com.agri.market.security.CustomUserDetailsService;
import com.agri.market.security.CustomOAuth2UserService;
import com.agri.market.security.OAuth2AuthenticationSuccessHandler;
import com.agri.market.security.OAuth2AuthenticationFailureHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final AuthEntryPointJwt unauthorizedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oauth2AuthenticationSuccessHandler;
    private final OAuth2AuthenticationFailureHandler oauth2AuthenticationFailureHandler;

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
    private String allowedOrigins;

    public SecurityConfig(CustomUserDetailsService userDetailsService,
                         AuthEntryPointJwt unauthorizedHandler,
                         JwtAuthenticationFilter jwtAuthenticationFilter,
                         CustomOAuth2UserService customOAuth2UserService,
                         OAuth2AuthenticationSuccessHandler oauth2AuthenticationSuccessHandler,
                         OAuth2AuthenticationFailureHandler oauth2AuthenticationFailureHandler) {
        this.userDetailsService = userDetailsService;
        this.unauthorizedHandler = unauthorizedHandler;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customOAuth2UserService = customOAuth2UserService;
        this.oauth2AuthenticationSuccessHandler = oauth2AuthenticationSuccessHandler;
        this.oauth2AuthenticationFailureHandler = oauth2AuthenticationFailureHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/").permitAll() // Root path
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/oauth2/**").permitAll() // OAuth2 endpoints
                        .requestMatchers("/login/oauth2/code/**").permitAll() // OAuth2 callback
                        .requestMatchers(HttpMethod.GET, "/api/products/*/notice").permitAll() // Public product notice read
                        .requestMatchers(HttpMethod.POST, "/api/products/*/notice").hasRole("ADMIN") // Admin product notice create
                        .requestMatchers(HttpMethod.PUT, "/api/products/*/notice").hasRole("ADMIN") // Admin product notice update
                        .requestMatchers(HttpMethod.DELETE, "/api/products/*/notice").hasRole("ADMIN") // Admin product notice delete
                        .requestMatchers("/api/products/**").permitAll()
                        .requestMatchers("/api/categories/**").permitAll() // Public category endpoints
                        .requestMatchers(HttpMethod.GET, "/api/categories").permitAll() // Public category list
                        .requestMatchers("/api/reviews/product/**").permitAll() // Public review endpoints
                        .requestMatchers(HttpMethod.GET, "/api/files/**").permitAll() // Public file download (images)
                        .requestMatchers("/api/banners").permitAll() // Public banner endpoints
                        .requestMatchers("/api/coupons/**").permitAll() // Public coupon endpoints (active, validate, code)
                        .requestMatchers("/api/notifications/stream").permitAll() // SSE endpoint with token auth
                        .requestMatchers("/actuator/health/**").permitAll() // Health check for ECS/Docker
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll() // Swagger API documentation
                        .requestMatchers("/api/faqs/**").permitAll() // Public FAQ endpoints
                        .requestMatchers("/api/notices/**").permitAll() // Public notice endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN") // Admin roles for admin endpoints
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService))
                        .successHandler(oauth2AuthenticationSuccessHandler)
                        .failureHandler(oauth2AuthenticationFailureHandler)
                );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // 환경변수에서 CORS allowed origins 가져오기 (쉼표로 구분)
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}