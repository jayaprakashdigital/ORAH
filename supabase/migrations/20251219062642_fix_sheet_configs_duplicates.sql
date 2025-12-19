/*
  # Fix sheet_configs duplicates and add unique constraint

  1. Changes
    - Remove duplicate entries, keeping only the most recent one per user
    - Add unique constraint on user_id to prevent future duplicates
*/

DELETE FROM sheet_configs
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM sheet_configs
  ORDER BY user_id, updated_at DESC
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sheet_configs_user_id_key'
  ) THEN
    ALTER TABLE sheet_configs ADD CONSTRAINT sheet_configs_user_id_key UNIQUE (user_id);
  END IF;
END $$;