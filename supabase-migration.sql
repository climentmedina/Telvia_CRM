-- Add contact_status column to companies table for CRM outreach tracking
-- Run this in Supabase SQL Editor

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS contact_status TEXT
CHECK (contact_status IN ('new', 'contacted', 'replied', 'meeting', 'won', 'lost'));

-- Create index for fast filtering by contact_status
CREATE INDEX IF NOT EXISTS idx_companies_contact_status ON companies(contact_status);

-- Create index for outreach queries (hot/warm uncontacted)
CREATE INDEX IF NOT EXISTS idx_companies_outreach ON companies(outreach_tier, contact_status, priority_score DESC);

-- Create index for priority score sorting (main table view)
CREATE INDEX IF NOT EXISTS idx_companies_priority_score ON companies(priority_score DESC NULLS LAST);

-- Create index for province + sector filtering
CREATE INDEX IF NOT EXISTS idx_companies_provincia ON companies(provincia);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);
