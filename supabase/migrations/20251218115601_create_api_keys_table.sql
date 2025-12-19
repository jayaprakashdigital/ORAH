/*
  # Create API Keys Table

  1. New Tables
    - `api_keys`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `service` (text) - e.g., 'vapi'
      - `key_type` (text) - e.g., 'private' or 'public'
      - `encrypted_key` (text) - the API key
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `api_keys` table
    - Add policies for authenticated users to manage their own API keys
*/

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service text NOT NULL,
  key_type text NOT NULL DEFAULT 'private',
  encrypted_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS api_keys_user_service_type_idx 
  ON api_keys(user_id, service, key_type);
