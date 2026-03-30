-- ============================================================
-- ONDA AI — Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up all tables.
-- ============================================================

-- Ops Users (admin/partner credentials)
CREATE TABLE ops_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'partner')),
  permissions TEXT[] DEFAULT '{"read"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Leads (every diagnostic submission)
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT NOT NULL,
  position TEXT,
  industry TEXT,
  company_size TEXT,
  company_website TEXT,
  company_linkedin TEXT,
  annual_revenue TEXT,
  diagnostic_answers JSONB,
  total_score INTEGER,
  score_breakdown JSONB,
  score_level TEXT CHECK (score_level IN ('critical', 'developing', 'competent', 'advanced')),
  recommendations JSONB,
  roi_estimate JSONB,
  pipeline_stage TEXT DEFAULT 'new' CHECK (pipeline_stage IN ('new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiating', 'closed_won', 'closed_lost', 'on_hold')),
  assigned_to UUID REFERENCES ops_users(id),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('hot', 'high', 'medium', 'low')),
  deal_value DECIMAL(10,2),
  scraper_data JSONB,
  scraper_ran_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

CREATE INDEX idx_leads_pipeline ON leads(pipeline_stage);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

-- Lead Activity Log
CREATE TABLE lead_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES ops_users(id),
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_lead ON lead_activity(lead_id, created_at DESC);

-- Pricing Calculations
CREATE TABLE pricing_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  calculated_by UUID REFERENCES ops_users(id),
  team_size INTEGER,
  hours_on_inquiries INTEGER,
  hourly_cost DECIMAL(6,2),
  revenue_bracket TEXT,
  monthly_savings DECIMAL(10,2),
  recommended_price DECIMAL(10,2),
  payback_months DECIMAL(4,1),
  roi_12_months DECIMAL(6,2),
  capture_rate DECIMAL(4,2) DEFAULT 0.35,
  solutions JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_full_access" ON leads FOR ALL USING (true);
CREATE POLICY "ops_full_access" ON lead_activity FOR ALL USING (true);
CREATE POLICY "ops_full_access" ON pricing_calculations FOR ALL USING (true);
CREATE POLICY "ops_read_self" ON ops_users FOR SELECT USING (true);
