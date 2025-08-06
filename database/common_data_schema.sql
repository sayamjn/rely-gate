-- Common Data Master Table Schema
-- Single table for storing countries, timezones, and currencies

CREATE TABLE IF NOT EXISTS CountryDataMaster (
    CommonDataID SERIAL PRIMARY KEY,
    DataType VARCHAR(20) NOT NULL, -- 'COUNTRY', 'TIMEZONE', 'CURRENCY'
    Code VARCHAR(100) NOT NULL, -- Country code, timezone code, currency code
    Name VARCHAR(200) NOT NULL, -- Display name
    PhoneCode VARCHAR(10), -- Phone dialing code (for countries only)
    Symbol VARCHAR(10), -- Currency symbol (for currencies only)
    UTCOffset VARCHAR(20), -- UTC offset (for timezones only)
    CountryCode VARCHAR(3), -- ISO country code (for currencies and linking)
    DefaultTimezone VARCHAR(100), -- Default timezone (for countries only)
    DefaultCurrency VARCHAR(3), -- Default currency (for countries only)
    IsActive BOOLEAN DEFAULT TRUE,
    SortOrder INTEGER DEFAULT 0, -- For ordering the data
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CreatedBy VARCHAR(100) DEFAULT 'SYSTEM',
    UpdatedBy VARCHAR(100) DEFAULT 'SYSTEM'
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_country_data_type ON CountryDataMaster(DataType);
CREATE INDEX IF NOT EXISTS idx_country_data_code ON CountryDataMaster(Code);
CREATE INDEX IF NOT EXISTS idx_country_data_active ON CountryDataMaster(IsActive);
CREATE INDEX IF NOT EXISTS idx_country_data_country_code ON CountryDataMaster(CountryCode);
CREATE INDEX IF NOT EXISTS idx_country_data_type_active ON CountryDataMaster(DataType, IsActive);

-- Unique constraint for type+code combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_country_data_type_code ON CountryDataMaster(DataType, Code);

-- Comments for documentation
COMMENT ON TABLE CountryDataMaster IS 'Master table for common data: countries, timezones, and currencies';
COMMENT ON COLUMN CountryDataMaster.DataType IS 'Type of data: COUNTRY, TIMEZONE, CURRENCY';
COMMENT ON COLUMN CountryDataMaster.Code IS 'Unique code for the data item';
COMMENT ON COLUMN CountryDataMaster.PhoneCode IS 'Phone dialing code (countries only)';
COMMENT ON COLUMN CountryDataMaster.Symbol IS 'Currency symbol (currencies only)';
COMMENT ON COLUMN CountryDataMaster.UTCOffset IS 'UTC offset (timezones only)';

-- Add update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.UpdatedDate = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating UpdatedDate
CREATE TRIGGER update_country_data_updated_date BEFORE UPDATE ON CountryDataMaster
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();