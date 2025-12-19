/*
  # Create Google Sheets Sync Tables

  1. New Tables
    - `sheet_data`
      - `id` (uuid, primary key)
      - `row_number` (integer) - Row number from sheet
      - `data` (jsonb) - Complete row data as JSON
      - `synced_at` (timestamptz) - When this row was last synced
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `sync_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `status` (text) - success, error
      - `rows_synced` (integer) - Number of rows processed
      - `error_message` (text, nullable) - Error details if failed
      - `duration_ms` (integer) - Time taken in milliseconds
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only read/write their own data
    - Authenticated users only
*/

-- Create sheet_data table
CREATE TABLE IF NOT EXISTS sheet_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_number integer NOT NULL,
  data jsonb NOT NULL,
  synced_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  rows_synced integer DEFAULT 0,
  error_message text,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sheet_data_user_id ON sheet_data(user_id);
CREATE INDEX IF NOT EXISTS idx_sheet_data_row_number ON sheet_data(row_number, user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC);

-- Enable RLS
ALTER TABLE sheet_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sheet_data
CREATE POLICY "Users can view own sheet data"
  ON sheet_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sheet data"
  ON sheet_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sheet data"
  ON sheet_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sheet data"
  ON sheet_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for sync_logs
CREATE POLICY "Users can view own sync logs"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs"
  ON sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
