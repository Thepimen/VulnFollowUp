package com.vulnfollowup.security;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vulnfollowup.model.User;
import com.vulnfollowup.model.enums.UserRole;

/**
 * Servicio de generación y verificación criptográfica de tokens JWT (RFC 7519) firmados con HS256.
 * Fija explícitamente el algoritmo {@code HS256}, rechaza {@code alg: "none"} y valida firmas en tiempo constante.
 */
@Component
public class JwtTokenService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String EXPECTED_JWT_ALG = "HS256";
    private static final int MIN_SECRET_BYTES = 32;

    private final byte[] secretBytes;
    private final long expirationSeconds;
    private final ObjectMapper objectMapper;

    public record JwtClaims(
            Integer userId,
            String username,
            UserRole role,
            long issuedAt,
            long expiresAt
    ) {
    }

    public JwtTokenService(
            @Value("${app.security.jwt.secret}") String secret,
            @Value("${app.security.jwt.expiration-seconds:3600}") long expirationSeconds,
            ObjectMapper objectMapper
    ) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalArgumentException(
                    "app.security.jwt.secret debe tener al menos " + MIN_SECRET_BYTES + " bytes para HS256");
        }
        if (expirationSeconds <= 0) {
            throw new IllegalArgumentException("app.security.jwt.expiration-seconds debe ser positivo");
        }
        this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationSeconds = expirationSeconds;
        this.objectMapper = objectMapper;
    }

    public String generateToken(User user) {
        if (user == null) {
            throw new IllegalArgumentException("El usuario es obligatorio para firmar el token JWT");
        }
        return generateToken(user.getId(), user.getUsername(), user.getRole());
    }

    public String generateToken(Integer userId, String username, UserRole role) {
        if (username == null || username.isBlank() || role == null) {
            throw new IllegalArgumentException("Username y role son obligatorios para firmar el token JWT");
        }
        long now = Instant.now().getEpochSecond();
        long exp = now + expirationSeconds;

        try {
            Map<String, Object> header = new LinkedHashMap<>();
            header.put("alg", EXPECTED_JWT_ALG);
            header.put("typ", "JWT");

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", username);
            payload.put("userId", userId);
            payload.put("role", role.getDbValue());
            payload.put("iat", now);
            payload.put("exp", exp);

            Base64.Encoder urlEncoder = Base64.getUrlEncoder().withoutPadding();
            String encodedHeader = urlEncoder.encodeToString(objectMapper.writeValueAsBytes(header));
            String encodedPayload = urlEncoder.encodeToString(objectMapper.writeValueAsBytes(payload));
            String signingInput = encodedHeader + "." + encodedPayload;
            String encodedSignature = urlEncoder.encodeToString(signHmacSha256(signingInput));
            return signingInput + "." + encodedSignature;
        } catch (Exception ex) {
            throw new IllegalStateException("Error generando token JWT: " + ex.getMessage(), ex);
        }
    }

    public JwtClaims validateAndParseClaims(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token JWT ausente o vacío");
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Formato de token JWT inválido");
        }

        try {
            Base64.Decoder urlDecoder = Base64.getUrlDecoder();
            byte[] headerBytes = urlDecoder.decode(parts[0]);
            JsonNode headerNode = objectMapper.readTree(headerBytes);
            String alg = headerNode.path("alg").asText("");
            if (!EXPECTED_JWT_ALG.equals(alg)) {
                throw new IllegalArgumentException("Algoritmo JWT no permitido: " + alg);
            }

            String signingInput = parts[0] + "." + parts[1];
            byte[] expectedSignature = signHmacSha256(signingInput);
            byte[] providedSignature = urlDecoder.decode(parts[2]);
            if (!MessageDigest.isEqual(expectedSignature, providedSignature)) {
                throw new IllegalArgumentException("Firma JWT inválida");
            }

            byte[] payloadBytes = urlDecoder.decode(parts[1]);
            JsonNode payloadNode = objectMapper.readTree(payloadBytes);

            String username = payloadNode.path("sub").asText(null);
            if (username == null || username.isBlank()) {
                throw new IllegalArgumentException("El token JWT no contiene sujeto (sub)");
            }
            if (!payloadNode.hasNonNull("exp")) {
                throw new IllegalArgumentException("El token JWT no contiene fecha de expiración (exp)");
            }

            long exp = payloadNode.path("exp").asLong(0L);
            long now = Instant.now().getEpochSecond();
            if (exp <= now) {
                throw new IllegalArgumentException("Token JWT expirado");
            }

            long iat = payloadNode.path("iat").asLong(0L);
            Integer userId = payloadNode.hasNonNull("userId") ? payloadNode.get("userId").asInt() : null;
            String rawRole = payloadNode.path("role").asText(null);
            if (rawRole == null || rawRole.isBlank()) {
                throw new IllegalArgumentException("El token JWT no contiene el rol RBAC");
            }
            UserRole role = UserRole.fromDbValue(rawRole);
            return new JwtClaims(userId, username, role, iat, exp);
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Token JWT malformado o no verificable", ex);
        }
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    private byte[] signHmacSha256(String signingInput) throws NoSuchAlgorithmException, InvalidKeyException {
        Mac mac = Mac.getInstance(HMAC_ALGORITHM);
        mac.init(new SecretKeySpec(secretBytes, HMAC_ALGORITHM));
        return mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8));
    }
}
