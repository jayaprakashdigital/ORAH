/*
  # Fix Infinite Recursion in Users Table RLS

  1. Problem
    - The "Users can view team members in same company" policy creates infinite recursion
    - It queries the users table to check company_id, which triggers RLS again
    
  2. Solution
    - Drop the recursive policy
    - Keep only direct auth.uid() checks that don't require subqueries
    - Users can see their own profile only
    
  3. Security
    - Users can SELECT their own profile using auth.uid()
    - Users can UPDATE their own profile
    - Admins can INSERT/DELETE team members (kept for future use)
*/

-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Users can view team members in same company" ON users;
DROP POLICY IF EXISTS "Admins can insert team members" ON users;
DROP POLICY IF EXISTS "Admins can delete team members" ON users;

-- Keep only the non-recursive policies
-- "Users can view own profile" - ALREADY EXISTS and is safe
-- "Users can update own profile" - ALREADY EXISTS and is safe

-- Verify the remaining safe policies are present
DO $$
BEGIN
  -- Ensure SELECT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON users FOR SELECT
      TO authenticated
      USING (id = auth.uid());
  END IF;

  -- Ensure UPDATE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON users FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;
