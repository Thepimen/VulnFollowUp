---
name: implementing-jwt-signing-and-verification
description: "Implements secure authentication, salted password hashing (BCrypt/Argon2id), role-based access control (ADMIN, ANALYST, VIEWER), and RFC 7519 JWT signing and verification. Use when building or auditing authentication, password storage, JWT filters, or role authorization in VulnFollowUp."
domain: cybersecurity
subdomain: cryptography
tags:
- cryptography
- jwt
- authentication
- bcrypt
- argon2
- rbac
- token-security
version: '1.1'
author: mahipal (adapted for VulnFollowUp)
license: Apache-2.0
nist_csf:
- PR.DS-01
- PR.DS-02
- PR.DS-10
---
# Implementing JWT Signing, Verification & Secure Password Hashing (BCrypt/Argon2)

## Overview

This skill covers end-to-end authentication and authorization security for **VulnFollowUp**:
1. **Password Storage**: Salted adaptive hashing using **BCrypt** or **Argon2id** (`users.password_hash`).
2. **Token Authentication**: Compact, URL-safe JSON Web Tokens (JWT, RFC 7519) signed with HMAC-SHA256 (`HS256`), `RS256`, or `ES256`, with strict algorithm allowlisting and expiration validation.
3. **Role-Based Access Control (RBAC)**: Enforcing `ADMIN`, `ANALYST`, and `VIEWER` permissions across `backend/`, `desktop-client/`, and `android-app/`.

## When to Use

- Implementing user registration, login (`/api/v1/auth/login`), or password verification in `backend/`
- Generating or validating JWT access and refresh tokens
- Enforcing `ADMIN`, `ANALYST`, and `VIEWER` role guards on REST endpoints
- Auditing authentication flows against OWASP A02 (Cryptographic Failures) and A07 (Authentication Failures)

## Core Security Requirements for VulnFollowUp

### 1. Password Hashing with Salt (BCrypt / Argon2id)
- **Strict Prohibition**: Never store plaintext, MD5, SHA-1, or unsalted SHA-256 passwords in the database or seed scripts (`database/seed/`).
- **BCrypt Standard**: Use `BCryptPasswordEncoder(12)` (cost factor $\ge 12$, automatically generates and embeds a 128-bit cryptographic salt per password in `$2a$12$...` / `$2b$12$...` format).
- **Argon2id Alternative**: `Argon2PasswordEncoder(16, 32, 1, 65536, 3)` (16-byte salt, 32-byte hash, 64 MB memory, 3 iterations).
- **Constant-Time Verification**: Always verify passwords through `passwordEncoder.matches(rawPassword, storedHash)` to prevent timing side-channel attacks.

### 2. Role-Based Access Control (RBAC Matrix)
Include the authenticated user's role in the signed JWT claims (`"role": "ADMIN" | "ANALYST" | "VIEWER"`) and enforce server-side checks:

| Capability / Endpoint | `ADMIN` | `ANALYST` | `VIEWER` |
|---|:---:|:---:|:---:|
| View paginated vulnerabilities, assets, DORA providers, KPIs | ✅ | ✅ | ✅ |
| Register new CVE vulnerabilities & link affected assets (`N:M`) | ✅ | ✅ | ❌ |
| Transition state `ABIERTA` $\rightarrow$ `PENDIENTE DE REMEDIACIÓN` $\rightarrow$ `RESUELTA` | ✅ | ✅ | ❌ |
| Close vulnerability (`RESUELTA` $\rightarrow$ `CERRADA`) | ✅ | ❌ | ❌ |
| Manage `users`, `ict_providers` (DORA), and system configuration | ✅ | ❌ | ❌ |
| Trigger OS report export (`ProcessBuilder` CSV/HTML) | ✅ | ✅ | ❌ |

### 3. JWT Signing & Verification Hardening
- **Algorithm Allowlist**: Explicitly pin the expected algorithm (e.g., `HS256` with a $\ge 256$-bit secret loaded from environment variables, or `RS256` / `ES256` key pair). Reject `alg: "none"` unconditionally.
- **Required Claims**:
  - `sub`: User ID or unique username
  - `role`: `'ADMIN'`, `'ANALYST'`, or `'VIEWER'`
  - `iat`: Issued-at timestamp
  - `exp`: Short-lived expiration (e.g., 15–60 minutes for access tokens)
- **Secret Management**: Load `JWT_SECRET` from environment variables (`System.getenv("JWT_SECRET")`), never hardcoded in source files committed to Git.

## Validation Criteria
- [ ] Passwords in `users` table and seed scripts use salted BCrypt (`$2a$`/`$2b$`) or Argon2id hashes.
- [ ] JWT verification explicitly pins the expected signing algorithm and rejects `alg=none` or tampered signatures.
- [ ] Expired tokens return `401 Unauthorized`.
- [ ] Insufficient role permissions return `403 Forbidden`.
