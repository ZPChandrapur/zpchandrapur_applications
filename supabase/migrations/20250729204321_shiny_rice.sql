/*
  # Create talukas table in ERMS schema

  1. New Tables
    - `erms.talukas`
      - `tal_id` (text, primary key) - Taluka identifier
      - `name` (text, not null) - Taluka name
      - `created_at` (timestamptz, default now()) - Record creation timestamp
      - `updated_at` (timestamptz, default now()) - Record update timestamp

  2. Triggers
    - `update_talukas_updated_at` - Automatically updates `updated_at` column on record modification

  3. Security
    - Table created in `erms` schema for proper organization
    - Uses existing `update_updated_at_column()` function for timestamp management
*/

-- Create talukas table in erms schema
CREATE TABLE IF NOT EXISTS erms.talukas (
  tal_id text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT talukas_pkey PRIMARY KEY (tal_id)
);

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_talukas_updated_at 
  BEFORE UPDATE ON erms.talukas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();