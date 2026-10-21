---
name: prioritizing-vulnerabilities-with-cvss-scoring
description: "Validates, calculates, and prioritizes vulnerabilities using CVSS Base v3.1 and v4.0 vector strings, numeric scores (0.0-10.0), and FIRST severity scales. Use when implementing backend/client CVSS validation, interpreting CVSS:3.1/ or CVSS:4.0/ vectors, checking score-to-severity coherence, or prioritizing vulnerability remediation in VulnFollowUp."
domain: cybersecurity
subdomain: vulnerability-management
tags:
- vulnerability-management
- cve
- cvss
- cvss-v3.1
- cvss-v4.0
- risk
- prioritization
- nist
version: '1.1'
author: mahipal (adapted for VulnFollowUp)
license: Apache-2.0
nist_csf:
- ID.RA-01
- ID.RA-02
- ID.IM-02
- ID.RA-06
---
# Prioritizing Vulnerabilities with CVSS Scoring

## Overview
The Common Vulnerability Scoring System (CVSS) is the industry standard framework maintained by FIRST (Forum of Incident Response and Security Teams) for assessing vulnerability severity. CVSS v4.0 (released November 2023) introduces refined metrics alongside the widely adopted CVSS v3.1 standard. This skill covers validating CVSS v3.1 and v4.0 Base vector strings, verifying score-to-severity coherence, and prioritizing vulnerability remediation in **VulnFollowUp**.

## When to Use

- Implementing backend (`backend/`) or database (`database/`) validation for `cvss_version`, `cvss_vector`, `cvss_score`, and `severity`
- Building UI badges and vector parsers in `desktop-client/` and `android-app/`
- Prioritizing vulnerabilities across technological assets and EU DORA ICT providers
- Auditing CVE records for compliance with FIRST CVSS v3.1 and v4.0 specifications

## VulnFollowUp Strict Validation Contract (CVSS Base v3.1 & v4.0)

In **VulnFollowUp**, we strictly implement **CVSS Base (`3.1` and `4.0`)** to maintain mathematical and syntactic integrity without over-engineering temporal/environmental recalculations:

1. **Supported Versions (`cvss_version`)**:
   - Must be `'3.1'` or `'4.0'`.
2. **Vector String Prefix & Syntax Coherence (`cvss_vector`)**:
   - If `cvss_version == '3.1'`, `cvss_vector` MUST start with `CVSS:3.1/`:
     ```regex
     ^CVSS:3\.1/AV:[NALP]/AC:[LH]/PR:[NLH]/UI:[NR]/S:[UC]/C:[NLH]/I:[NLH]/A:[NLH]$
     ```
   - If `cvss_version == '4.0'`, `cvss_vector` MUST start with `CVSS:4.0/`:
     ```regex
     ^CVSS:4\.0/AV:[NALP]/AC:[LH]/AT:[NP]/PR:[NLH]/UI:[NPA]/VC:[NLH]/VI:[NLH]/VA:[NLH]/SC:[NLH]/SI:[NLH]/SA:[NLH]$
     ```
3. **Numeric Score Range (`cvss_score`)**:
   - Decimal between `0.0` and `10.0` inclusive (`0.0 <= cvss_score <= 10.0`).
4. **Qualitative Severity Coherence (`severity`)**:
   | Score Range (`cvss_score`) | Required `severity` |
   |----------------------------|---------------------|
   | `0.0`                      | `NONE`              |
   | `0.1 – 3.9`                | `LOW`               |
   | `4.0 – 6.9`                | `MEDIUM`            |
   | `7.0 – 8.9`                | `HIGH`              |
   | `9.0 – 10.0`               | `CRITICAL`          |
   - Any mismatch between `cvss_score` and `severity` (e.g., `cvss_score = 9.8` with `severity = LOW`) MUST be rejected with HTTP `400 Bad Request` / `422 Unprocessable Entity`.

## Core Concepts

### CVSS v3.1 Base Metrics
- **Attack Vector (AV)**: Network (`N`), Adjacent (`A`), Local (`L`), Physical (`P`)
- **Attack Complexity (AC)**: Low (`L`), High (`H`)
- **Privileges Required (PR)**: None (`N`), Low (`L`), High (`H`)
- **User Interaction (UI)**: None (`N`), Required (`R`)
- **Scope (S)**: Unchanged (`U`), Changed (`C`)
- **Confidentiality / Integrity / Availability (C / I / A)**: None (`N`), Low (`L`), High (`H`)
- **Example v3.1 Vector**: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H` (Score `10.0`, `CRITICAL`)

### CVSS v4.0 Base Metrics
- **Exploitability Metrics**:
  - **Attack Vector (AV)**: Network (`N`), Adjacent (`A`), Local (`L`), Physical (`P`)
  - **Attack Complexity (AC)**: Low (`L`), High (`H`)
  - **Attack Requirements (AT)**: None (`N`), Present (`P`) — *New in v4.0*
  - **Privileges Required (PR)**: None (`N`), Low (`L`), High (`H`)
  - **User Interaction (UI)**: None (`N`), Passive (`P`), Active (`A`) — *Expanded in v4.0*
- **Impact Metrics (Vulnerable System)**: `VC`, `VI`, `VA` (`N`, `L`, `H`)
- **Impact Metrics (Subsequent System)**: `SC`, `SI`, `SA` (`N`, `L`, `H`)
- **Example v4.0 Vector**: `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N` (Score `9.3`, `CRITICAL`)

## Workflow

### Step 1: Validate Incoming CVSS Payload
Verify `cvss_version`, prefix match on `cvss_vector`, numeric bounds on `cvss_score`, and range match on `severity`.

### Step 2: Cross-Reference Asset Criticality & DORA Provider Risk
Combine CVSS Base severity with the affected assets' `criticality` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and the associated ICT Provider's `risk_level` (`ict_providers` table) to rank remediation order.

### Step 3: Define Remediation SLAs
| Priority Level | CVSS Range | Asset Criticality | Target SLA |
|---|---|---|---|
| P1 - Emergency | `9.0 – 10.0` (`CRITICAL`) | `CRITICAL` | 24–48 hours |
| P2 - Critical | `7.0 – 8.9` (`HIGH`) | `CRITICAL` / `HIGH` | 7 days |
| P3 - High | `7.0 – 8.9` (`HIGH`) | `MEDIUM` / `LOW` | 14 days |
| P4 - Medium | `4.0 – 6.9` (`MEDIUM`) | Any | 30 days |
| P5 - Low | `0.1 – 3.9` (`LOW`) | Any | 90 days |

## Best Practices
1. Validate both CVSS v3.1 and v4.0 vectors using deterministic regular expressions on both client and server.
2. Never allow a vulnerability record to be persisted if `cvss_score` and `severity` contradict the official FIRST scale.
3. Combine CVSS Base scores with asset criticality and EU DORA ICT provider dependency when ordering executive dashboards.
