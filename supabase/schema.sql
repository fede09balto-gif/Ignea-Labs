-- ============================================================
-- IGNEA LABS — Supabase Database Schema (v2)
-- 4 normalized tables: diagnostics, contacts, solutions, engagements
-- Run this in the Supabase SQL Editor to set up all tables.
-- ============================================================

-- Drop old tables if migrating from v1
DROP TABLE IF EXISTS pricing_calculations CASCADE;
DROP TABLE IF EXISTS lead_activity CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS ops_users CASCADE;
DROP TABLE IF EXISTS engagements CASCADE;
DROP TABLE IF EXISTS diagnostics CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS solutions CASCADE;

-- ============================================================
-- 1. DIAGNOSTICS — every diagnostic submission
-- ============================================================
CREATE TABLE diagnostics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  language TEXT DEFAULT 'es' CHECK (language IN ('es', 'en')),
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  company_name TEXT NOT NULL,
  industry TEXT,
  company_size TEXT,
  answers_json JSONB NOT NULL,
  scores_json JSONB,
  total_score INTEGER,
  level TEXT CHECK (level IN ('critical', 'developing', 'competent', 'advanced')),
  roi_json JSONB,
  ai_analysis JSONB,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'analyzed', 'contacted', 'closed'))
);

CREATE INDEX idx_diag_created ON diagnostics(created_at DESC);
CREATE INDEX idx_diag_status ON diagnostics(status);
CREATE INDEX idx_diag_email ON diagnostics(contact_email);

-- ============================================================
-- 2. CONTACTS — contact form submissions
-- ============================================================
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  company TEXT,
  message TEXT,
  source TEXT DEFAULT 'contact_form' CHECK (source IN ('contact_form', 'diagnostic', 'manual'))
);

CREATE INDEX idx_contacts_created ON contacts(created_at DESC);

-- ============================================================
-- 3. SOLUTIONS — seed data for industry-specific recommendations
-- ============================================================
CREATE TABLE solutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  industry TEXT NOT NULL,
  stream TEXT NOT NULL CHECK (stream IN ('customerFlow', 'operationsFlow', 'informationFlow', 'growthFlow')),
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_es TEXT NOT NULL,
  description_en TEXT NOT NULL,
  implementation_time TEXT,
  savings_pct DECIMAL(4,2),
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true
);

CREATE INDEX idx_solutions_industry ON solutions(industry, stream);

-- ============================================================
-- 4. ENGAGEMENTS — CRM pipeline tracking
-- ============================================================
CREATE TABLE engagements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnostic_id UUID REFERENCES diagnostics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  pipeline_stage TEXT DEFAULT 'new' CHECK (pipeline_stage IN ('new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiating', 'closed_won', 'closed_lost')),
  assigned_to TEXT,
  deal_value DECIMAL(10,2),
  notes TEXT,
  next_action TEXT,
  next_action_date DATE
);

CREATE INDEX idx_engage_stage ON engagements(pipeline_stage);
CREATE INDEX idx_engage_diag ON engagements(diagnostic_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Diagnostics: anon can INSERT (lead capture), service_role has full access
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert_diagnostics" ON diagnostics
  FOR INSERT WITH CHECK (true);
CREATE POLICY "service_full_diagnostics" ON diagnostics
  FOR ALL USING (auth.role() = 'service_role');

-- Contacts: anon can INSERT (contact form), service_role has full access
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert_contacts" ON contacts
  FOR INSERT WITH CHECK (true);
CREATE POLICY "service_full_contacts" ON contacts
  FOR ALL USING (auth.role() = 'service_role');

-- Solutions: anon can SELECT (read recommendations), service_role has full access
ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_solutions" ON solutions
  FOR SELECT USING (true);
CREATE POLICY "service_full_solutions" ON solutions
  FOR ALL USING (auth.role() = 'service_role');

-- Engagements: service_role only (internal CRM, no public access)
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_full_engagements" ON engagements
  FOR ALL USING (auth.role() = 'service_role');
