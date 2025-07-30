/*
  # Add RLS Policies for ERMS Schema Tables

  1. Security Setup
    - Enable RLS on all ERMS tables
    - Add comprehensive policies for all operations
    
  2. Policy Structure
    - SELECT: authenticated and anon users can read all records
    - INSERT: authenticated and anon users can create records
    - UPDATE: authenticated and anon users can modify records
    - DELETE: only authenticated users can delete records
    
  3. Tables Covered
    - erms.department
    - erms.talukas
    - erms.office_locations
    - erms.employee
*/

-- Enable RLS on all ERMS tables
ALTER TABLE erms.department ENABLE ROW LEVEL SECURITY;
ALTER TABLE erms.talukas ENABLE ROW LEVEL SECURITY;
ALTER TABLE erms.office_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE erms.employee ENABLE ROW LEVEL SECURITY;

-- Department table policies
CREATE POLICY "Allow read access to departments for all users"
  ON erms.department
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert access to departments for all users"
  ON erms.department
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow update access to departments for all users"
  ON erms.department
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access to departments for authenticated users"
  ON erms.department
  FOR DELETE
  TO authenticated
  USING (true);

-- Talukas table policies
CREATE POLICY "Allow read access to talukas for all users"
  ON erms.talukas
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert access to talukas for all users"
  ON erms.talukas
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow update access to talukas for all users"
  ON erms.talukas
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access to talukas for authenticated users"
  ON erms.talukas
  FOR DELETE
  TO authenticated
  USING (true);

-- Office locations table policies
CREATE POLICY "Allow read access to office_locations for all users"
  ON erms.office_locations
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert access to office_locations for all users"
  ON erms.office_locations
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow update access to office_locations for all users"
  ON erms.office_locations
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access to office_locations for authenticated users"
  ON erms.office_locations
  FOR DELETE
  TO authenticated
  USING (true);

-- Employee table policies
CREATE POLICY "Allow read access to employees for all users"
  ON erms.employee
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert access to employees for all users"
  ON erms.employee
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow update access to employees for all users"
  ON erms.employee
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access to employees for authenticated users"
  ON erms.employee
  FOR DELETE
  TO authenticated
  USING (true);

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA erms TO authenticated, anon;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON erms.department TO authenticated, anon;
GRANT DELETE ON erms.department TO authenticated;

GRANT SELECT, INSERT, UPDATE ON erms.talukas TO authenticated, anon;
GRANT DELETE ON erms.talukas TO authenticated;

GRANT SELECT, INSERT, UPDATE ON erms.office_locations TO authenticated, anon;
GRANT DELETE ON erms.office_locations TO authenticated;

GRANT SELECT, INSERT, UPDATE ON erms.employee TO authenticated, anon;
GRANT DELETE ON erms.employee TO authenticated;

-- Grant sequence permissions (if any auto-increment columns exist)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA erms TO authenticated, anon;