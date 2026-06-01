-- =============================================================
-- Migration V3: Add Onboarding and Daily Goal Fields to Users
-- =============================================================

-- Add target_score (nullable)
ALTER TABLE users ADD COLUMN IF NOT EXISTS target_score INTEGER;

-- Add is_onboarded (not null, default false)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN NOT NULL DEFAULT FALSE;

-- Add daily_goal_minutes (not null, default 5)
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER NOT NULL DEFAULT 5;
