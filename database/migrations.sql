-- Market Alerts Database Schema Migrations
-- Run these in your Supabase SQL Editor

-- ============================================
-- PHASE 1: Create Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_chat_webhook TEXT, -- User-specific webhook URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- PHASE 2: Create Alerts Tracking Table
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT REFERENCES stocks(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('profit', 'loss')),
  current_price DECIMAL(10, 2) NOT NULL,
  threshold_price DECIMAL(10, 2) NOT NULL,
  atp_price DECIMAL(10, 2) NOT NULL,
  percentage_change DECIMAL(5, 2) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  is_acknowledged BOOLEAN DEFAULT FALSE
);

-- ============================================
-- PHASE 3: Modify Stocks Table
-- ============================================
-- Add user_id column to stocks table
ALTER TABLE stocks 
ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;

-- Add last_alert_sent column to prevent spam
ALTER TABLE stocks 
ADD COLUMN IF NOT EXISTS last_alert_sent TIMESTAMPTZ;

-- Add last_price column to track price changes
ALTER TABLE stocks 
ADD COLUMN IF NOT EXISTS last_price DECIMAL(10, 2);

-- ============================================
-- PHASE 4: Create Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stocks_user_active 
ON stocks(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_alerts_stock_sent 
ON alerts(stock_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_user_unacknowledged 
ON alerts(user_id, is_acknowledged, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_sent_at 
ON alerts(sent_at DESC);

-- ============================================
-- PHASE 5: Create Default User (for migration)
-- ============================================
-- Insert a default user for existing stocks
INSERT INTO users (email, name, is_active)
VALUES ('default@marketalerts.com', 'Default User', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Link existing stocks to default user
UPDATE stocks 
SET user_id = (SELECT id FROM users WHERE email = 'default@marketalerts.com')
WHERE user_id IS NULL;

-- ============================================
-- PHASE 6: Create Helper Functions
-- ============================================

-- Function to check if alert should be sent (State-based)
-- Returns TRUE only if there are NO unacknowledged alerts for this stock/type
CREATE OR REPLACE FUNCTION should_send_alert(
  p_stock_id BIGINT,
  p_alert_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  unacknowledged_alert_id BIGINT;
BEGIN
  -- Check for any unacknowledged alert for this stock and type
  SELECT id INTO unacknowledged_alert_id
  FROM alerts
  WHERE stock_id = p_stock_id 
    AND alert_type = p_alert_type
    AND is_acknowledged = FALSE
  LIMIT 1;
  
  -- If we found an unacknowledged alert, DO NOT send a new one
  RETURN unacknowledged_alert_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get unacknowledged alerts for a user
CREATE OR REPLACE FUNCTION get_unacknowledged_alerts(p_user_id BIGINT)
RETURNS TABLE (
  alert_id BIGINT,
  stock_symbol TEXT,
  alert_type TEXT,
  current_price DECIMAL,
  sent_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    s.symbol,
    a.alert_type,
    a.current_price,
    a.sent_at
  FROM alerts a
  JOIN stocks s ON a.stock_id = s.id
  WHERE a.user_id = p_user_id
    AND a.is_acknowledged = FALSE
  ORDER BY a.sent_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PHASE 7: Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid()::text = id::text OR email = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can only see their own stocks
CREATE POLICY stocks_select_own ON stocks
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY stocks_insert_own ON stocks
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY stocks_update_own ON stocks
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY stocks_delete_own ON stocks
  FOR DELETE USING (user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Users can only see their own alerts
CREATE POLICY alerts_select_own ON alerts
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration worked:

-- Check users table
-- SELECT * FROM users;

-- Check stocks with user_id
-- SELECT id, symbol, user_id, is_active FROM stocks;

-- Check alerts table structure
-- SELECT * FROM alerts LIMIT 1;

-- Test alert cooldown function
-- SELECT should_send_alert(1, 'profit', 60);
