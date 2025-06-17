CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  userName VARCHAR(100) NOT NULL,
  tenantId VARCHAR(100) NOT NULL,
  password TEXT NOT NULL,
  UNIQUE (userName, tenantId)
);
