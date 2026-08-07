-- ====================================================================
-- PROFITCAL ANALYTICS DATABASE SCHEMA FOR SUPABASE
-- Run this script in your Supabase Project -> SQL Editor -> Run
-- ====================================================================

-- 1. Create Analytics Events Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    session_id TEXT,
    event_name TEXT NOT NULL,
    platform TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    device_type TEXT,
    os TEXT,
    browser TEXT,
    ip_address TEXT,
    location TEXT,
    total_orders INT DEFAULT 0,
    gross_revenue NUMERIC DEFAULT 0,
    avg_fee_pct NUMERIC DEFAULT 0,
    unique_skus INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Create Performance Indexes for Fast Admin Dashboard Queries
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON public.analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_platform ON public.analytics_events (platform);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy: Allow Public Anonymous Writes (Insert Only)
DROP POLICY IF EXISTS "Allow public anonymous inserts for telemetry" ON public.analytics_events;
CREATE POLICY "Allow public anonymous inserts for telemetry"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 5. Create Policy: Allow Only Authenticated Admin to View/Select Records
DROP POLICY IF EXISTS "Allow select for service role / authenticated admins only" ON public.analytics_events;
CREATE POLICY "Allow select for service role / authenticated admins only"
ON public.analytics_events
FOR SELECT
TO authenticated, service_role
USING (true);

-- 6. Comment Documentation
COMMENT ON TABLE public.analytics_events IS 'Stores silent automated tracking metrics from ProfitCal users (Orders, Revenue, Platform, Location, Device)';
