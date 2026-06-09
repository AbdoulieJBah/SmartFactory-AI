CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    industry VARCHAR,
    country VARCHAR,
    city VARCHAR,
    status VARCHAR DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_companies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    company_id INTEGER NOT NULL REFERENCES companies(id),
    role VARCHAR DEFAULT 'Member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO companies (name, industry, country, city, status)
VALUES ('Demo Factory Ltd', 'Manufacturing', 'The Gambia', 'Banjul', 'Active')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE work_centers ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE production_logs ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE quality_checks ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE waste_records ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE downtime_records ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE maintenance_work_orders ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE batch_traces ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);

UPDATE products SET company_id = 1 WHERE company_id IS NULL;
UPDATE inventory SET company_id = 1 WHERE company_id IS NULL;
UPDATE work_centers SET company_id = 1 WHERE company_id IS NULL;
UPDATE production_orders SET company_id = 1 WHERE company_id IS NULL;
UPDATE production_logs SET company_id = 1 WHERE company_id IS NULL;
UPDATE quality_checks SET company_id = 1 WHERE company_id IS NULL;
UPDATE waste_records SET company_id = 1 WHERE company_id IS NULL;
UPDATE downtime_records SET company_id = 1 WHERE company_id IS NULL;
UPDATE suppliers SET company_id = 1 WHERE company_id IS NULL;
UPDATE customers SET company_id = 1 WHERE company_id IS NULL;
UPDATE purchase_orders SET company_id = 1 WHERE company_id IS NULL;
UPDATE sales_orders SET company_id = 1 WHERE company_id IS NULL;
UPDATE maintenance_work_orders SET company_id = 1 WHERE company_id IS NULL;
UPDATE batch_traces SET company_id = 1 WHERE company_id IS NULL;