/*
  # Create File Tracking System for ERMS

  ## Overview
  This migration creates a comprehensive file tracking system for the Employee Retirement Management System (ERMS).
  It enables tracking of retirement files as they move through different levels of the organization hierarchy.

  ## New Tables
  
  ### 1. `retirement_file_tracking`
  Main table to track file assignments and movements
  - `id` (uuid, primary key) - Unique identifier for each tracking record
  - `retirement_id` (uuid, foreign key) - References the retirement employee record
  - `assigned_to_user_id` (uuid, foreign key) - Currently assigned user
  - `assigned_by_user_id` (uuid, foreign key) - User who made the assignment
  - `assigned_at` (timestamptz) - Timestamp of assignment
  - `current_level` (text) - Current level (clerk, officer, admin)
  - `status` (text) - Status (assigned, completed, reverted)
  - `comments` (text) - Comments from the assigned user
  - `days_held` (integer) - Number of days file has been with current user
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 2. `retirement_file_history`
  Historical log of all file movements
  - `id` (uuid, primary key) - Unique identifier for each history record
  - `retirement_id` (uuid, foreign key) - References the retirement employee record
  - `from_user_id` (uuid, foreign key) - User who sent the file
  - `to_user_id` (uuid, foreign key) - User who received the file
  - `from_level` (text) - Level file was sent from
  - `to_level` (text) - Level file was sent to
  - `action` (text) - Action taken (forwarded, reverted, completed)
  - `comments` (text) - Comments from the sender
  - `created_at` (timestamptz) - Action timestamp

  ## Security
  - Enable Row Level Security (RLS) on both tables
  - Users can only view tracking records for files they have access to
  - Only assigned users can update file status
  - All users with ERMS access can view file history

  ## Important Notes
  1. File tracking starts after retirement status reaches "completed"
  2. Only the currently assigned person can edit the retirement record
  3. Files can be forwarded to next level or reverted to previous level
  4. Complete audit trail is maintained in history table
*/

-- Create retirement_file_tracking table
CREATE TABLE IF NOT EXISTS retirement_file_tracking (
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

-- Create retirement_file_history table
CREATE TABLE IF NOT EXISTS retirement_file_history (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_file_tracking_retirement_id ON retirement_file_tracking(retirement_id);
CREATE INDEX IF NOT EXISTS idx_file_tracking_assigned_to ON retirement_file_tracking(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_file_tracking_status ON retirement_file_tracking(status);
CREATE INDEX IF NOT EXISTS idx_file_history_retirement_id ON retirement_file_history(retirement_id);
CREATE INDEX IF NOT EXISTS idx_file_history_created_at ON retirement_file_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE retirement_file_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE retirement_file_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for retirement_file_tracking

-- Policy: Users can view tracking records for files assigned to them or they assigned
CREATE POLICY "Users can view their assigned files or files they assigned"
  ON retirement_file_tracking
  FOR SELECT
  TO authenticated
  USING (
    assigned_to_user_id = auth.uid() OR 
    assigned_by_user_id = auth.uid()
  );

-- Policy: Admin and superadmin can view all tracking records
CREATE POLICY "Admins can view all file tracking"
  ON retirement_file_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'superadmin')
    )
  );

-- Policy: Users can insert tracking records when assigning files
CREATE POLICY "Users can create file tracking records"
  ON retirement_file_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (
    assigned_by_user_id = auth.uid()
  );

-- Policy: Assigned users can update their file status
CREATE POLICY "Assigned users can update file tracking"
  ON retirement_file_tracking
  FOR UPDATE
  TO authenticated
  USING (assigned_to_user_id = auth.uid())
  WITH CHECK (assigned_to_user_id = auth.uid());

-- RLS Policies for retirement_file_history

-- Policy: Users can view history for files they're involved with
CREATE POLICY "Users can view file history they're involved in"
  ON retirement_file_history
  FOR SELECT
  TO authenticated
  USING (
    from_user_id = auth.uid() OR 
    to_user_id = auth.uid()
  );

-- Policy: Admin and superadmin can view all history
CREATE POLICY "Admins can view all file history"
  ON retirement_file_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'superadmin')
    )
  );

-- Policy: Users can insert history records when transferring files
CREATE POLICY "Users can create file history records"
  ON retirement_file_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    from_user_id = auth.uid()
  );

-- Function to update days_held automatically
CREATE OR REPLACE FUNCTION update_file_tracking_days_held()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE retirement_file_tracking
  SET days_held = EXTRACT(DAY FROM (now() - assigned_at))::integer,
      updated_at = now()
  WHERE status = 'assigned';
END;
$$;

-- Function to get current file assignment
CREATE OR REPLACE FUNCTION get_current_file_assignment(p_retirement_id uuid)
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
  FROM retirement_file_tracking ft
  JOIN user_roles ur ON ur.user_id = ft.assigned_to_user_id
  WHERE ft.retirement_id = p_retirement_id
  AND ft.status = 'assigned'
  ORDER BY ft.assigned_at DESC
  LIMIT 1;
END;
$$;