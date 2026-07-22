BEGIN;

INSERT INTO companies (id, name, industry, country, city, status)
VALUES (1, 'Demo Factory Ltd', 'Manufacturing', 'The Gambia', 'Banjul', 'Active')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE production_schedules
ADD COLUMN IF NOT EXISTS company_id INTEGER;

UPDATE production_schedules
SET company_id = 1
WHERE company_id IS NULL;

ALTER TABLE production_schedules
ALTER COLUMN company_id SET DEFAULT 1;

ALTER TABLE production_schedules
ALTER COLUMN company_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'production_schedules_company_id_fkey'
    ) THEN
        ALTER TABLE production_schedules
        ADD CONSTRAINT production_schedules_company_id_fkey
        FOREIGN KEY (company_id) REFERENCES companies(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_production_schedules_company_id
ON production_schedules(company_id);

COMMIT;
