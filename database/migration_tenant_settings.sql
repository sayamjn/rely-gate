-- ================================================================================
-- TENANT SETTINGS ENHANCEMENT MIGRATION
-- ================================================================================
-- This migration adds timezone, countryCode, and country fields to TenantSetting
-- and Tenant tables for better internationalization support
--
-- Run this after the main schema to add the new fields
-- ================================================================================

-- Add new fields to TenantSetting table
ALTER TABLE TenantSetting ADD COLUMN IF NOT EXISTS TimeZone VARCHAR(100);
ALTER TABLE TenantSetting ADD COLUMN IF NOT EXISTS CountryCode VARCHAR(10);
ALTER TABLE TenantSetting ADD COLUMN IF NOT EXISTS Country VARCHAR(100);

-- Add comments for the new fields
COMMENT ON COLUMN TenantSetting.TimeZone IS 'IANA timezone identifier (e.g., Asia/Kolkata, America/New_York)';
COMMENT ON COLUMN TenantSetting.CountryCode IS 'ISO 3166-1 alpha-2 country code (e.g., IN, US, GB)';
COMMENT ON COLUMN TenantSetting.Country IS 'Full country name (e.g., India, United States, United Kingdom)';

-- Add new fields to Tenant table for easier access
ALTER TABLE Tenant ADD COLUMN IF NOT EXISTS Currency VARCHAR(50);
ALTER TABLE Tenant ADD COLUMN IF NOT EXISTS TimeZone VARCHAR(100);
ALTER TABLE Tenant ADD COLUMN IF NOT EXISTS CountryCode VARCHAR(10);
ALTER TABLE Tenant ADD COLUMN IF NOT EXISTS Country VARCHAR(100);

-- Add comments for the new fields in Tenant table
COMMENT ON COLUMN Tenant.Currency IS 'Currency name from TenantSetting (e.g., USD, EUR, INR)';
COMMENT ON COLUMN Tenant.TimeZone IS 'IANA timezone identifier from TenantSetting';
COMMENT ON COLUMN Tenant.CountryCode IS 'ISO 3166-1 alpha-2 country code from TenantSetting';
COMMENT ON COLUMN Tenant.Country IS 'Full country name from TenantSetting';

-- Create index for better performance on timezone queries
CREATE INDEX IF NOT EXISTS idx_tenant_timezone ON Tenant(TimeZone);
CREATE INDEX IF NOT EXISTS idx_tenant_country ON Tenant(CountryCode);
CREATE INDEX IF NOT EXISTS idx_tenantsetting_timezone ON TenantSetting(TimeZone);
CREATE INDEX IF NOT EXISTS idx_tenantsetting_country ON TenantSetting(CountryCode);

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'TENANT SETTINGS ENHANCEMENT MIGRATION COMPLETED';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'Added fields:';
    RAISE NOTICE '- TenantSetting: TimeZone, CountryCode, Country';
    RAISE NOTICE '- Tenant: Currency, TimeZone, CountryCode, Country';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'New features enabled:';
    RAISE NOTICE '- Multi-timezone support with IANA timezone identifiers';
    RAISE NOTICE '- Country-specific settings and localization';
    RAISE NOTICE '- Currency management for multi-region deployments';
    RAISE NOTICE '- Performance indexes for timezone and country queries';
    RAISE NOTICE '================================================================================';
END $$;