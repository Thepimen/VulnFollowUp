package com.vulnfollowup.config;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vulnfollowup.dto.ApiDtos.ApiErrorResponseDto;
import com.vulnfollowup.security.JwtAuthenticationFilter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Configuración principal de Spring Security Web para la API REST de VulnFollowUp.
 * Aplica arquitectura stateless basada en JWT Bearer, CORS para el cliente SPA y
 * control de acceso RBAC por endpoint y rol ({@code ADMIN}, {@code ANALYST}, {@code VIEWER}).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, ObjectMapper objectMapper) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            String jwtError = (String) request.getAttribute("jwt_error");
                            String msg = jwtError != null && !jwtError.isBlank()
                                    ? jwtError
                                    : "Se requiere un token Bearer JWT válido para acceder a este recurso";
                            writeSecurityError(request, response, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", msg);
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                writeSecurityError(
                                        request,
                                        response,
                                        HttpStatus.FORBIDDEN,
                                        "FORBIDDEN_ROLE",
                                        "El rol actual no tiene permisos suficientes para ejecutar esta operación"
                                )
                        )
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/providers").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/providers/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/vulnerabilities/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST,
                                "/api/assets",
                                "/api/vulnerabilities",
                                "/api/vulnerabilities/import",
                                "/api/vulnerabilities/*/assessment"
                        ).hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.PATCH, "/api/vulnerabilities/*/status").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.PUT, "/api/vulnerabilities/*").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.GET, "/api/reports/**").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.GET,
                                "/api/dashboard/**",
                                "/api/assets/**",
                                "/api/vulnerabilities/**",
                                "/api/providers/**"
                        ).hasAnyRole("ADMIN", "ANALYST", "VIEWER")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*", "*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private void writeSecurityError(
            HttpServletRequest request,
            HttpServletResponse response,
            HttpStatus status,
            String code,
            String message
    ) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        ApiErrorResponseDto body = new ApiErrorResponseDto(
                OffsetDateTime.now(ZoneOffset.UTC),
                status.value(),
                status.getReasonPhrase(),
                code,
                message,
                request.getRequestURI(),
                List.of()
        );
        objectMapper.writeValue(response.getWriter(), body);
    }
}
