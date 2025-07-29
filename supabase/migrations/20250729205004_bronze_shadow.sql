/*
  # Create office_locations table in ERMS schema

  1. New Tables
    - `office_locations`
      - `office_id` (text, primary key)
      - `name` (text, not null)
      - `created_at` (timestamp with time zone, default now())
      - `updated_at` (timestamp with time zone, default now())

  2. Triggers
    - Add trigger to automatically update `updated_at` column on record updates

  3. Security
    - Table created in erms schema for proper organization
*/

-- Create office_locations table in erms schema
CREATE TABLE IF NOT EXISTS erms.office_locations (
  office_id text NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT office_locations_pkey PRIMARY KEY (office_id)
);

-- Create trigger to update updated_at column
CREATE TRIGGER update_office_locations_updated_at 
  BEFORE UPDATE ON erms.office_locations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();