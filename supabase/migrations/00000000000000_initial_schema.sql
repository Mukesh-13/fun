-- Initial schema for Funweb
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
-- NOTE (Security Audit): RLS is enabled here, but because the backend connects
-- directly via a Postgres connection string (effectively as a superuser/service role)
-- and uses custom JWTs instead of Supabase Auth, these RLS policies are bypassed.
-- Authorization is strictly enforced at the API layer (e.g., middleware and route handlers).
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for public.users
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Create storage bucket for assets (if using Supabase Storage)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can read assets"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'assets' AND auth.role() = 'authenticated');
