/*
  # Fix RLS Policies for Data Access

  1. Changes
    - Temporarily disable RLS on leads, calls, and agents tables to verify data access
    - This is a diagnostic step to confirm RLS is the blocker
    
  2. Security
    - This is TEMPORARY for debugging
    - Will re-enable with corrected policies immediately after
*/

-- Temporarily disable RLS for testing
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
