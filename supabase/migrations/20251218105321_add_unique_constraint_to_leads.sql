/*
  # Add Unique Constraint for Google Sheets Sync
  
  1. Changes
    - Add unique constraint on (company_id, mobile) to prevent duplicate leads
    - This enables upsert functionality for Google Sheets sync
  
  2. Notes
    - Existing duplicate data will be handled by the constraint
    - The sync function will update existing leads if mobile matches
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'leads_company_mobile_unique'
  ) THEN
    ALTER TABLE leads 
    ADD CONSTRAINT leads_company_mobile_unique 
    UNIQUE (company_id, mobile);
  END IF;
END $$;