/*
  # Add assigned_owner field to leads table

  1. Changes
    - Add `assigned_owner` column to leads table for tracking which team member owns the lead
    - This allows assigning leads to specific sales agents
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'assigned_owner'
  ) THEN
    ALTER TABLE leads ADD COLUMN assigned_owner text DEFAULT 'JP';
  END IF;
END $$;
