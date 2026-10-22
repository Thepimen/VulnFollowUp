CREATE TABLE users (
    id INT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP
);

CREATE TABLE ict_providers (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100),
    risk_level VARCHAR(50),
    compliance_status VARCHAR(50)
);

CREATE TABLE assets (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    asset_type VARCHAR(50),
    provider_id INT,
    FOREIGN KEY (provider_id) REFERENCES ict_providers(id)
);

CREATE TABLE vulnerabilities (
    id INT PRIMARY KEY,
    cve_id VARCHAR(20) NOT NULL,
    description TEXT,
    cvss_v3_score DECIMAL(3,1),
    cvss_v4_score DECIMAL(3,1),
    severity VARCHAR(20),
    status VARCHAR(20)
);

CREATE TABLE vulnerability_assets (
    vulnerability_id INT,
    asset_id INT,
    identified_at TIMESTAMP,
    PRIMARY KEY (vulnerability_id, asset_id),
    FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities(id),
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE TABLE audit_logs (
    id INT PRIMARY KEY,
    vulnerability_id INT,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_at TIMESTAMP,
    FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities(id)
);