/*
  # Sheet Configurations Table

  1. New Tables
    - `sheet_configs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `sheet_id` (text)
      - `tab_name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Users can only access their own configs
*/

CREATE TABLE IF NOT EXISTS sheet_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sheet_id text NOT NULL,
  tab_name text NOT NULL DEFAULT 'Sheet1',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sheet_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sheet config"
  ON sheet_configs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sheet config"
  ON sheet_configs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sheet config"
  ON sheet_configs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sheet config"
  ON sheet_configs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);