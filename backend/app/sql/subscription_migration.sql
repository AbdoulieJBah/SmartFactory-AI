CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    monthly_price FLOAT DEFAULT 0,
    max_users INTEGER DEFAULT 5,
    ai_enabled BOOLEAN DEFAULT FALSE,
    forecasting_enabled BOOLEAN DEFAULT FALSE,
    oee_enabled BOOLEAN DEFAULT FALSE,
    advanced_reports_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS subscription_plan_id INTEGER REFERENCES subscription_plans(id);

INSERT INTO subscription_plans (
    name,
    monthly_price,
    max_users,
    ai_enabled,
    forecasting_enabled,
    oee_enabled,
    advanced_reports_enabled
)
VALUES
('Starter', 49, 5, FALSE, FALSE, TRUE, FALSE),
('Professional', 149, 25, TRUE, TRUE, TRUE, TRUE),
('Enterprise', 499, 999, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (name) DO NOTHING;

UPDATE companies
SET subscription_plan_id = (
    SELECT id FROM subscription_plans WHERE name = 'Professional'
)
WHERE subscription_plan_id IS NULL;