/*
  # Create Lead Timeline Table

  1. New Table
    - `lead_timeline` - Track all lead activity and changes
      - `timeline_id` (uuid, primary key)
      - `lead_id` (uuid, foreign key to leads)
      - `company_id` (uuid, for multi-tenancy)
      - `action_type` (text, e.g., 'status_change', 'field_edit', 'visit_scheduled')
      - `field_changed` (text, e.g., 'status', 'budget', 'location')
      - `old_value` (text, previous value)
      - `new_value` (text, new value)
      - `user_name` (text, who made change)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on lead_timeline table
    - Authenticated users can view and insert timeline records
*/

CREATE TABLE IF NOT EXISTS lead_timeline (
  timeline_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  user_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lead_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lead timeline"
  ON lead_timeline FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert lead timeline"
  ON lead_timeline FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_lead_timeline_lead_id ON lead_timeline(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_timeline_company_id ON lead_timeline(company_id);
CREATE INDEX IF NOT EXISTS idx_lead_timeline_created_at ON lead_timeline(created_at);