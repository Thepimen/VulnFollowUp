package com.vulnfollowup.security;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.vulnfollowup.model.User;
import com.vulnfollowup.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Filtro stateless de Spring Security que extrae el token Bearer JWT de la cabecera
 * {@code Authorization}, verifica su firma y expiración, y pobla el {@link SecurityContextHolder}
 * con la entidad {@link User} y su autoridad RBAC ({@code ROLE_ADMIN}, {@code ROLE_ANALYST} o {@code ROLE_VIEWER}).
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenService jwtTokenService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtTokenService jwtTokenService, UserRepository userRepository) {
        this.jwtTokenService = jwtTokenService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            String token = authHeader.substring(BEARER_PREFIX.length()).trim();
            try {
                JwtTokenService.JwtClaims claims = jwtTokenService.validateAndParseClaims(token);
                Optional<User> dbUser = userRepository.findByUsername(claims.username());

                User principal;
                if (dbUser.isPresent()) {
                    User existing = dbUser.get();
                    if (!existing.isActive()) {
                        throw new IllegalArgumentException("La cuenta de usuario está desactivada");
                    }
                    principal = existing;
                } else {
                    principal = new User();
                    principal.setId(claims.userId());
                    principal.setUsername(claims.username());
                    principal.setRole(claims.role());
                    principal.setActive(true);
                }

                List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_" + principal.getRole().name())
                );
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (RuntimeException ex) {
                SecurityContextHolder.clearContext();
                request.setAttribute("jwt_error", ex.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
