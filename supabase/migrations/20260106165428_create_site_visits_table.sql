/*
  # Create Site Visits Table

  1. New Table
    - `site_visits` - Track scheduled property site visits for leads
      - `site_visit_id` (uuid, primary key)
      - `lead_id` (uuid, foreign key to leads)
      - `company_id` (uuid, for multi-tenancy)
      - `project` (text, property/project name)
      - `visit_date` (date, scheduled visit date)
      - `visit_time` (time, scheduled visit time)
      - `owner` (text, assigned team member)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on site_visits table
    - Authenticated users can view, insert, update site visits
*/

CREATE TABLE IF NOT EXISTS site_visits (
  site_visit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  project VARCHAR(255) NOT NULL,
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  owner VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view site visits"
  ON site_visits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert site visits"
  ON site_visits FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update site visits"
  ON site_visits FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete site visits"
  ON site_visits FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_site_visits_lead_id ON site_visits(lead_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_company_id ON site_visits(company_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_date ON site_visits(visit_date);