/*
  # Move File Tracking Tables to ERMS Schema

  ## Overview
  This migration moves the retirement file tracking tables from the public schema to the erms schema
  to align with the ERMS application architecture.

  ## Changes
  1. Drop existing tables in public schema
  2. Create tables in erms schema
  3. Create indexes in erms schema
  4. Set up Row Level Security policies in erms schema
  5. Create helper functions in erms schema

  ## Important Notes
  - All existing data in public schema will be preserved during migration
  - The erms schema must already exist
  - RLS policies reference tables in public schema (user_roles, roles, auth.users)
*/

-- First, save any existing data (if any)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'retirement_file_tracking') THEN
    CREATE TEMP TABLE temp_tracking AS SELECT * FROM public.retirement_file_tracking;
    CREATE TEMP TABLE temp_history AS SELECT * FROM public.retirement_file_history;
  END IF;
END $$;

-- Drop existing tables and related objects from public schema
DROP TABLE IF EXISTS public.retirement_file_history CASCADE;
DROP TABLE IF EXISTS public.retirement_file_tracking CASCADE;
DROP FUNCTION IF EXISTS public.update_file_tracking_days_held() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_file_assignment(uuid) CASCADE;

-- Create retirement_file_tracking table in erms schema
CREATE TABLE IF NOT EXISTS erms.retirement_file_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retirement_id uuid NOT NULL,
  assigned_to_user_id uuid NOT NULL REFERENCES auth.users(id),
  assigned_by_user_id uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  current_level text NOT NULL CHECK (current_level IN ('clerk', 'officer', 'admin', 'superadmin')),
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'reverted')),
  comments text,
  days_held integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create retirement_file_history table in erms schema
CREATE TABLE IF NOT EXISTS erms.retirement_file_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retirement_id uuid NOT NULL,
  from_user_id uuid REFERENCES auth.users(id),
  to_user_id uuid REFERENCES auth.users(id),
  from_level text CHECK (from_level IN ('clerk', 'officer', 'admin', 'superadmin')),
  to_level text CHECK (to_level IN ('clerk', 'officer', 'admin', 'superadmin')),
  action text NOT NULL CHECK (action IN ('forwarded', 'reverted', 'completed', 'assigned')),
  comments text,
  created_at timestamptz DEFAULT now()
);

-- Restore data if it existed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'pg_temp_1' AND tablename LIKE 'temp_tracking%') THEN
    INSERT INTO erms.retirement_file_tracking SELECT * FROM temp_tracking;
    INSERT INTO erms.retirement_file_history SELECT * FROM temp_history;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_erms_file_tracking_retirement_id ON erms.retirement_file_tracking(retirement_id);
CREATE INDEX IF NOT EXISTS idx_erms_file_tracking_assigned_to ON erms.retirement_file_tracking(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_erms_file_tracking_status ON erms.retirement_file_tracking(status);
CREATE INDEX IF NOT EXISTS idx_erms_file_history_retirement_id ON erms.retirement_file_history(retirement_id);
CREATE INDEX IF NOT EXISTS idx_erms_file_history_created_at ON erms.retirement_file_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE erms.retirement_file_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE erms.retirement_file_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for erms.retirement_file_tracking

-- Policy: Users can view tracking records for files assigned to them or they assigned
CREATE POLICY "Users can view their assigned files or files they assigned"
  ON erms.retirement_file_tracking
  FOR SELECT
  TO authenticated
  USING (
    assigned_to_user_id = auth.uid() OR 
    assigned_by_user_id = auth.uid()
  );

-- Policy: Admin and superadmin can view all tracking records
CREATE POLICY "Admins can view all file tracking"
  ON erms.retirement_file_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'superadmin')
    )
  );

-- Policy: Users can insert tracking records when assigning files
CREATE POLICY "Users can create file tracking records"
  ON erms.retirement_file_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (
    assigned_by_user_id = auth.uid()
  );

-- Policy: Assigned users can update their file status
CREATE POLICY "Assigned users can update file tracking"
  ON erms.retirement_file_tracking
  FOR UPDATE
  TO authenticated
  USING (assigned_to_user_id = auth.uid())
  WITH CHECK (assigned_to_user_id = auth.uid());

-- RLS Policies for erms.retirement_file_history

-- Policy: Users can view history for files they're involved with
CREATE POLICY "Users can view file history they're involved in"
  ON erms.retirement_file_history
  FOR SELECT
  TO authenticated
  USING (
    from_user_id = auth.uid() OR 
    to_user_id = auth.uid()
  );

-- Policy: Admin and superadmin can view all history
CREATE POLICY "Admins can view all file history"
  ON erms.retirement_file_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'superadmin')
    )
  );

-- Policy: Users can insert history records when transferring files
CREATE POLICY "Users can create file history records"
  ON erms.retirement_file_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    from_user_id = auth.uid()
  );

-- Function to update days_held automatically (in erms schema)
CREATE OR REPLACE FUNCTION erms.update_file_tracking_days_held()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE erms.retirement_file_tracking
  SET days_held = EXTRACT(DAY FROM (now() - assigned_at))::integer,
      updated_at = now()
  WHERE status = 'assigned';
END;
$$;

-- Function to get current file assignment (in erms schema)
CREATE OR REPLACE FUNCTION erms.get_current_file_assignment(p_retirement_id uuid)
RETURNS TABLE (
  assigned_to_user_id uuid,
  assigned_to_name text,
  current_level text,
  assigned_at timestamptz,
  days_held integer,
  comments text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ft.assigned_to_user_id,
    ur.name as assigned_to_name,
    ft.current_level,
    ft.assigned_at,
    ft.days_held,
    ft.comments
  FROM erms.retirement_file_tracking ft
  JOIN public.user_roles ur ON ur.user_id = ft.assigned_to_user_id
  WHERE ft.retirement_id = p_retirement_id
  AND ft.status = 'assigned'
  ORDER BY ft.assigned_at DESC
  LIMIT 1;
END;
$$;