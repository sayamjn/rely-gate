-- LinkedTenants Table Schema
-- This table manages which tenants a user can switch between
-- Supports JWT re-issuing approach for tenant switching

CREATE TABLE linkedTenants (
    id SERIAL PRIMARY KEY,
    loginId INTEGER NOT NULL,               -- Foreign key to loginUser.loginId
    tenantId INTEGER NOT NULL,              -- Foreign key to Tenant.TenantID
    tenantName VARCHAR(200) NOT NULL,       -- Display name for UI dropdown
    email VARCHAR(100),                     -- Optional tenant contact email
    mobile VARCHAR(15),                     -- Optional tenant contact mobile
    isPrimary BOOLEAN DEFAULT FALSE,        -- User's default/primary tenant
    isActive BOOLEAN DEFAULT TRUE,          -- Soft delete flag
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdBy VARCHAR(100),                 -- Audit field
    updatedBy VARCHAR(100),                 -- Audit field
    
    -- Foreign key constraints
    CONSTRAINT fk_linkedTenants_loginId 
        FOREIGN KEY (loginId) REFERENCES loginUser(loginId) ON DELETE CASCADE,
    CONSTRAINT fk_linkedTenants_tenantId 
        FOREIGN KEY (tenantId) REFERENCES Tenant(TenantID) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate linkages
    CONSTRAINT uk_linkedTenants_loginId_tenantId 
        UNIQUE (loginId, tenantId)
);

-- Indexes for performance
CREATE INDEX idx_linkedTenants_loginId ON linkedTenants(loginId) WHERE isActive = TRUE;
CREATE INDEX idx_linkedTenants_tenantId ON linkedTenants(tenantId) WHERE isActive = TRUE;
CREATE INDEX idx_linkedTenants_isPrimary ON linkedTenants(loginId, isPrimary) WHERE isActive = TRUE;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_linkedTenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_linkedTenants_updated_at
    BEFORE UPDATE ON linkedTenants
    FOR EACH ROW
    EXECUTE FUNCTION update_linkedTenants_updated_at();

-- Comments for documentation
COMMENT ON TABLE linkedTenants IS 'Manages tenant access permissions for users - enables tenant switching via JWT re-issuing';
COMMENT ON COLUMN linkedTenants.loginId IS 'User who has access to the linked tenant';
COMMENT ON COLUMN linkedTenants.tenantId IS 'Tenant that user can switch to';
COMMENT ON COLUMN linkedTenants.isPrimary IS 'Users default tenant - only one per user should be true';
COMMENT ON COLUMN linkedTenants.isActive IS 'Soft delete flag - false means access revoked';