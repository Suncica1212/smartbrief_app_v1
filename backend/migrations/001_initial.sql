CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(100) PRIMARY KEY,
  applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

CREATE TABLE tenants (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  public_key CHAR(36) NOT NULL UNIQUE,
  notification_email VARCHAR(320) NOT NULL,
  retention_days SMALLINT UNSIGNED NOT NULL DEFAULT 90,
  allowed_origins JSON NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT chk_retention_days CHECK (retention_days IN (30, 90, 180))
) ENGINE=InnoDB;

CREATE TABLE submissions (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  reference_code VARCHAR(24) NOT NULL UNIQUE,
  status ENUM('draft','submitted','processing','ready','deleting') NOT NULL DEFAULT 'draft',
  access_token_hash BINARY(32) NOT NULL UNIQUE,
  payload_ciphertext LONGBLOB NOT NULL,
  payload_nonce BINARY(12) NOT NULL,
  payload_tag BINARY(16) NOT NULL,
  encryption_key_version SMALLINT UNSIGNED NOT NULL,
  total_file_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  privacy_accepted_at TIMESTAMP(3) NOT NULL,
  submitted_at TIMESTAMP(3) NULL,
  expires_at TIMESTAMP(3) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_submission_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_submission_expiry (expires_at, status),
  INDEX idx_submission_tenant_created (tenant_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE submission_files (
  id CHAR(36) PRIMARY KEY,
  submission_id CHAR(36) NOT NULL,
  object_key VARCHAR(512) NOT NULL UNIQUE,
  area VARCHAR(80) NOT NULL,
  upload_slot VARCHAR(160) NOT NULL,
  original_name_ciphertext BLOB NOT NULL,
  original_name_nonce BINARY(12) NOT NULL,
  original_name_tag BINARY(16) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  sha256 BINARY(32) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_file_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  INDEX idx_file_submission (submission_id)
) ENGINE=InnoDB;
