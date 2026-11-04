CREATE TYPE user_role AS ENUM ('ADMIN', 'ANALYST', 'VIEWER');
CREATE TYPE provider_criticality AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE remediation_status AS ENUM ('OPEN', 'PENDING_REMEDIATION', 'RESOLVED', 'CLOSED');
CREATE TYPE cvss_version AS ENUM ('3.1', '4.0');
CREATE TYPE cvss_severity AS ENUM ('None', 'Low', 'Medium', 'High', 'Critical');


CREATE TABLE "User" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL
);


CREATE TABLE "IT_Provider" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    provided_service VARCHAR(150) NOT NULL,
    criticality provider_criticality NOT NULL,
    contract VARCHAR(100),
    review_date DATE,
    contact VARCHAR(100)
);


CREATE TABLE "Asset" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    owner VARCHAR(100) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    id_provider INT,
    CONSTRAINT fk_provider FOREIGN KEY (id_provider) REFERENCES "IT_Provider"(id) ON DELETE SET NULL
);


CREATE TABLE "Vulnerability" (
    id SERIAL PRIMARY KEY,
    cve_identifier VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    registration_date DATE NOT NULL,
    remediation_status remediation_status DEFAULT 'OPEN',
    id_assignee INT,
    target_date DATE,
    CONSTRAINT fk_assignee FOREIGN KEY (id_assignee) REFERENCES "User"(id) ON DELETE SET NULL
);

CREATE TABLE "Asset_Vulnerability" (
    id_asset INT,
    id_vulnerability INT,
    PRIMARY KEY (id_asset, id_vulnerability),
    CONSTRAINT fk_asset FOREIGN KEY (id_asset) REFERENCES "Asset"(id) ON DELETE CASCADE,
    CONSTRAINT fk_vulnerability FOREIGN KEY (id_vulnerability) REFERENCES "Vulnerability"(id) ON DELETE CASCADE
);


CREATE TABLE "CVSS_Assessment" (
    id SERIAL PRIMARY KEY,
    id_vulnerability INT NOT NULL,
    version cvss_version NOT NULL,
    vector VARCHAR(150) NOT NULL,
    score DECIMAL(3,1) NOT NULL,
    severity cvss_severity NOT NULL,
    assessment_date DATE NOT NULL,
    CONSTRAINT fk_vulnerability_cvss FOREIGN KEY (id_vulnerability) REFERENCES "Vulnerability"(id) ON DELETE CASCADE
);


CREATE TABLE "Remediation_Audit" (
    id SERIAL PRIMARY KEY,
    id_vulnerability INT NOT NULL,
    id_user INT NOT NULL,
    comment TEXT,
    previous_status remediation_status,
    new_status remediation_status,
    audit_date TIMESTAMP NOT NULL,
    CONSTRAINT fk_vulnerability_audit FOREIGN KEY (id_vulnerability) REFERENCES "Vulnerability"(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_audit FOREIGN KEY (id_user) REFERENCES "User"(id)
);