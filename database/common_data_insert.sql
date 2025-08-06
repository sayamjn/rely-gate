-- Insert data for CountryDataMaster table
-- This file contains countries, timezones, and currencies data

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM CountryDataMaster;

-- Insert Countries
INSERT INTO CountryDataMaster (DataType, Code, Name, PhoneCode, CountryCode, DefaultTimezone, DefaultCurrency, SortOrder) VALUES
('COUNTRY', 'IN', 'India', '+91', 'IN', 'Asia/Kolkata', 'INR', 1),
('COUNTRY', 'US', 'United States', '+1', 'US', 'America/New_York', 'USD', 2),
('COUNTRY', 'GB', 'United Kingdom', '+44', 'GB', 'Europe/London', 'GBP', 3),
('COUNTRY', 'CA', 'Canada', '+1', 'CA', 'America/New_York', 'CAD', 4),
('COUNTRY', 'AU', 'Australia', '+61', 'AU', 'Australia/Sydney', 'AUD', 5),
('COUNTRY', 'JP', 'Japan', '+81', 'JP', 'Asia/Tokyo', 'JPY', 6),
('COUNTRY', 'CN', 'China', '+86', 'CN', 'Asia/Shanghai', 'CNY', 7),
('COUNTRY', 'AE', 'United Arab Emirates', '+971', 'AE', 'Asia/Dubai', 'AED', 8),
('COUNTRY', 'SG', 'Singapore', '+65', 'SG', 'Asia/Singapore', 'SGD', 9),
('COUNTRY', 'DE', 'Germany', '+49', 'DE', 'Europe/Berlin', 'EUR', 10),
('COUNTRY', 'FR', 'France', '+33', 'FR', 'Europe/Paris', 'EUR', 11),
('COUNTRY', 'IT', 'Italy', '+39', 'IT', 'Europe/Rome', 'EUR', 12),
('COUNTRY', 'ES', 'Spain', '+34', 'ES', 'Europe/Madrid', 'EUR', 13),
('COUNTRY', 'NL', 'Netherlands', '+31', 'NL', 'Europe/Amsterdam', 'EUR', 14),
('COUNTRY', 'CH', 'Switzerland', '+41', 'CH', 'Europe/Zurich', 'CHF', 15),
('COUNTRY', 'SE', 'Sweden', '+46', 'SE', 'Europe/Stockholm', 'SEK', 16),
('COUNTRY', 'NO', 'Norway', '+47', 'NO', 'Europe/Oslo', 'NOK', 17),
('COUNTRY', 'DK', 'Denmark', '+45', 'DK', 'Europe/Copenhagen', 'DKK', 18),
('COUNTRY', 'FI', 'Finland', '+358', 'FI', 'Europe/Helsinki', 'EUR', 19),
('COUNTRY', 'BR', 'Brazil', '+55', 'BR', 'America/Sao_Paulo', 'BRL', 20);

-- Insert Timezones
INSERT INTO CountryDataMaster (DataType, Code, Name, UTCOffset, SortOrder) VALUES
('TIMEZONE', 'Asia/Kolkata', 'India Standard Time (IST)', 'UTC+05:30', 1),
('TIMEZONE', 'America/New_York', 'Eastern Time (EST/EDT)', 'UTC-05:00/-04:00', 2),
('TIMEZONE', 'America/Los_Angeles', 'Pacific Time (PST/PDT)', 'UTC-08:00/-07:00', 3),
('TIMEZONE', 'Europe/London', 'Greenwich Mean Time (GMT/BST)', 'UTC+00:00/+01:00', 4),
('TIMEZONE', 'Europe/Berlin', 'Central European Time (CET/CEST)', 'UTC+01:00/+02:00', 5),
('TIMEZONE', 'Asia/Tokyo', 'Japan Standard Time (JST)', 'UTC+09:00', 6),
('TIMEZONE', 'Asia/Shanghai', 'China Standard Time (CST)', 'UTC+08:00', 7),
('TIMEZONE', 'Australia/Sydney', 'Australian Eastern Time (AEST/AEDT)', 'UTC+10:00/+11:00', 8),
('TIMEZONE', 'Asia/Dubai', 'Gulf Standard Time (GST)', 'UTC+04:00', 9),
('TIMEZONE', 'Asia/Singapore', 'Singapore Standard Time (SGT)', 'UTC+08:00', 10),
('TIMEZONE', 'Europe/Paris', 'Central European Time (CET/CEST)', 'UTC+01:00/+02:00', 11),
('TIMEZONE', 'Europe/Rome', 'Central European Time (CET/CEST)', 'UTC+01:00/+02:00', 12),
('TIMEZONE', 'Europe/Madrid', 'Central European Time (CET/CEST)', 'UTC+01:00/+02:00', 13),
('TIMEZONE', 'Europe/Amsterdam', 'Central European Time (CET/CEST)', 'UTC+01:00/+02:00', 14),
('TIMEZONE', 'Europe/Zurich', 'Central European Time (CET/CEST)', 'UTC+01:00/+02:00', 15),
('TIMEZONE', 'Europe/Stockholm', 'Central European Time (CET/CEST)', 'UTC+01:00/+02:00', 16),
('TIMEZONE', 'Europe/Oslo', 'Central European Time (CET/CEST)', 'UTC+01:00/+02:00', 17),
('TIMEZONE', 'Europe/Copenhagen', 'Central European Time (CET/CEST)', 'UTC+01:00/+02:00', 18),
('TIMEZONE', 'Europe/Helsinki', 'Eastern European Time (EET/EEST)', 'UTC+02:00/+03:00', 19),
('TIMEZONE', 'America/Sao_Paulo', 'Brasilia Time (BRT)', 'UTC-03:00', 20);

-- Insert Currencies
INSERT INTO CountryDataMaster (DataType, Code, Name, Symbol, CountryCode, SortOrder) VALUES
('CURRENCY', 'INR', 'Indian Rupee', '₹', 'IN', 1),
('CURRENCY', 'USD', 'US Dollar', '$', 'US', 2),
('CURRENCY', 'GBP', 'British Pound Sterling', '£', 'GB', 3),
('CURRENCY', 'JPY', 'Japanese Yen', '¥', 'JP', 4),
('CURRENCY', 'CNY', 'Chinese Yuan', '¥', 'CN', 5),
('CURRENCY', 'CAD', 'Canadian Dollar', 'C$', 'CA', 6),
('CURRENCY', 'AUD', 'Australian Dollar', 'A$', 'AU', 7),
('CURRENCY', 'AED', 'UAE Dirham', 'د.إ', 'AE', 8),
('CURRENCY', 'SGD', 'Singapore Dollar', 'S$', 'SG', 9),
('CURRENCY', 'EUR', 'Euro', '€', 'DE', 10),
('CURRENCY', 'CHF', 'Swiss Franc', 'CHF', 'CH', 11),
('CURRENCY', 'SEK', 'Swedish Krona', 'kr', 'SE', 12),
('CURRENCY', 'NOK', 'Norwegian Krone', 'kr', 'NO', 13),
('CURRENCY', 'DKK', 'Danish Krone', 'kr', 'DK', 14),
('CURRENCY', 'BRL', 'Brazilian Real', 'R$', 'BR', 15);

-- Update sequence to avoid conflicts
SELECT setval('countrydatamaster_commondataid_seq', (SELECT MAX(CommonDataID) FROM CountryDataMaster));