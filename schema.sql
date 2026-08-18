-- ============================================================
-- Supabase / PostgreSQL Database Schema for Secure Auth Gateway
-- ============================================================

-- 1. Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create users table (Pure Username & Password Flow)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64),
    role VARCHAR(32) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create high-performance lookup indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- 4. Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_users ON public.users;
CREATE TRIGGER set_timestamp_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.trigger_set_timestamp();

-- ============================================================
-- 5. LEAST-PRIVILEGE ROLE CONFIGURATION (Security Best Practice)
-- Run the following in your Supabase SQL Editor if you want to
-- create a scoped DB user account without using admin/service_role
-- ============================================================

/*
-- Step A: Create the application-specific database user
CREATE ROLE web_auth_user WITH LOGIN PASSWORD 'YOUR_STRONG_DB_USER_PASSWORD';

-- Step B: Grant connection and schema usage
GRANT CONNECT ON DATABASE postgres TO web_auth_user;
GRANT USAGE ON SCHEMA public TO web_auth_user;

-- Step C: Grant MINIMAL required table privileges (Read credentials + update login metadata)
GRANT SELECT ON public.users TO web_auth_user;
GRANT UPDATE (last_login_at, last_login_ip, failed_login_attempts, locked_until) ON public.users TO web_auth_user;
*/

-- ============================================================
-- 6. SAMPLE USER INSERT (Generate your own via 'npm run seed')
-- Password: "AdminPassword123!"
-- ============================================================

/*
INSERT INTO public.users (username, password_hash, salt, role, is_active)
VALUES (
    'admin',
    '$2a$12$e876H7fW33jA8aGsmP6s..w41eF5Kx4kGfV7R7p6e7Q6Wv5C2V4p6',
    'bcrypt_salt_rounds_12',
    'admin',
    true
)
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW();
*/
