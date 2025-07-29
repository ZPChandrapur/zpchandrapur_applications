/*
  # Create ERMS Department Table

  1. New Schema
    - Create `erms` schema if it doesn't exist

  2. New Tables
    - `erms.department`
      - `dept_id` (text, primary key)
      - `department` (text, not null)
      - `created_at` (timestamp with time zone, default now())
      - `updated_at` (timestamp with time zone, default now())

  3. Functions
    - Create `update_updated_at_column()` function if it doesn't exist

  4. Triggers
    - Add trigger to automatically update `updated_at` column

  5. Security
    - Enable RLS on department table
    - Add policies for authenticated users
*/

-- Create erms schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS erms;

-- Create function to update updated_at column if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create department table
CREATE TABLE IF NOT EXISTS erms.department (
  dept_id text NOT NULL,
  department text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT department_pkey PRIMARY KEY (dept_id)
);

-- Create trigger for updating updated_at column
DROP TRIGGER IF EXISTS update_department_updated_at ON erms.department;
CREATE TRIGGER update_department_updated_at 
  BEFORE UPDATE ON erms.department 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE erms.department ENABLE ROW LEVEL SECURITY;

-- Create policies for department table
CREATE POLICY "Authenticated users can read departments"
  ON erms.department
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert departments"
  ON erms.department
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update departments"
  ON erms.department
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete departments"
  ON erms.department
  FOR DELETE
  TO authenticated
  USING (true);