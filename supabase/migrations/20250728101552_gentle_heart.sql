/*
  # Role-Based Access Control System

  1. New Tables
    - `user_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role_id` (integer, references roles table)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `roles`
      - `id` (integer, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_at` (timestamp)
    
    - `application_permissions`
      - `id` (uuid, primary key)
      - `role_id` (integer, references roles)
      - `application_name` (text)
      - `can_read` (boolean)
      - `can_write` (boolean)
      - `can_delete` (boolean)
      - `can_admin` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read their own data
    - Add policies for admins to manage roles and permissions

  3. Initial Data
    - Insert predefined roles (developer, super admin, admin, officer, clerk)
    - Set up default permissions for each role and application
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id integer PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id integer REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Create application_permissions table
CREATE TABLE IF NOT EXISTS application_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id integer REFERENCES roles(id) ON DELETE CASCADE,
  application_name text NOT NULL,
  can_read boolean DEFAULT false,
  can_write boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, application_name)
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles table
CREATE POLICY "Anyone can read roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only super admins can manage roles"
  ON roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('developer', 'super_admin')
    )
  );

-- RLS Policies for user_roles table
CREATE POLICY "Users can read their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('developer', 'super_admin', 'admin')
    )
  );

CREATE POLICY "Only super admins can manage user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('developer', 'super_admin')
    )
  );

-- RLS Policies for application_permissions table
CREATE POLICY "Users can read permissions for their roles"
  ON application_permissions
  FOR SELECT
  TO authenticated
  USING (
    role_id IN (
      SELECT ur.role_id FROM user_roles ur WHERE ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Only super admins can manage permissions"
  ON application_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('developer', 'super_admin')
    )
  );

-- Insert predefined roles
INSERT INTO roles (id, name, description) VALUES
  (1, 'developer', 'Full system access for development and maintenance'),
  (2, 'super_admin', 'Complete administrative access to all systems'),
  (3, 'admin', 'Administrative access with some restrictions'),
  (4, 'officer', 'Officer level access for operational tasks'),
  (5, 'clerk', 'Basic clerk level access for data entry')
ON CONFLICT (id) DO NOTHING;

-- Insert default application permissions
-- Developer permissions (full access to everything)
INSERT INTO application_permissions (role_id, application_name, can_read, can_write, can_delete, can_admin) VALUES
  (1, 'erms', true, true, true, true),
  (1, 'estimate', true, true, true, true),
  (1, 'inspection', true, true, true, true),
  (1, 'pesa', true, true, true, true)
ON CONFLICT (role_id, application_name) DO NOTHING;

-- Super Admin permissions (full access to everything)
INSERT INTO application_permissions (role_id, application_name, can_read, can_write, can_delete, can_admin) VALUES
  (2, 'erms', true, true, true, true),
  (2, 'estimate', true, true, true, true),
  (2, 'inspection', true, true, true, true),
  (2, 'pesa', true, true, true, true)
ON CONFLICT (role_id, application_name) DO NOTHING;

-- Admin permissions (read/write access, limited delete)
INSERT INTO application_permissions (role_id, application_name, can_read, can_write, can_delete, can_admin) VALUES
  (3, 'erms', true, true, false, false),
  (3, 'estimate', true, true, false, false),
  (3, 'inspection', true, true, false, false),
  (3, 'pesa', true, true, true, false)
ON CONFLICT (role_id, application_name) DO NOTHING;

-- Officer permissions (read/write access to specific systems)
INSERT INTO application_permissions (role_id, application_name, can_read, can_write, can_delete, can_admin) VALUES
  (4, 'erms', true, true, false, false),
  (4, 'estimate', true, true, false, false),
  (4, 'inspection', true, true, false, false),
  (4, 'pesa', true, false, false, false)
ON CONFLICT (role_id, application_name) DO NOTHING;

-- Clerk permissions (basic read/write access)
INSERT INTO application_permissions (role_id, application_name, can_read, can_write, can_delete, can_admin) VALUES
  (5, 'erms', true, true, false, false),
  (5, 'estimate', true, false, false, false),
  (5, 'inspection', true, true, false, false),
  (5, 'pesa', true, false, false, false)
ON CONFLICT (role_id, application_name) DO NOTHING;

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid uuid)
RETURNS TABLE (
  application_name text,
  can_read boolean,
  can_write boolean,
  can_delete boolean,
  can_admin boolean,
  role_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.application_name,
    ap.can_read,
    ap.can_write,
    ap.can_delete,
    ap.can_admin,
    r.name as role_name
  FROM application_permissions ap
  JOIN roles r ON ap.role_id = r.id
  JOIN user_roles ur ON r.id = ur.role_id
  WHERE ur.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
  user_uuid uuid,
  app_name text,
  permission_type text
)
RETURNS boolean AS $$
DECLARE
  has_perm boolean := false;
BEGIN
  SELECT 
    CASE 
      WHEN permission_type = 'read' THEN ap.can_read
      WHEN permission_type = 'write' THEN ap.can_write
      WHEN permission_type = 'delete' THEN ap.can_delete
      WHEN permission_type = 'admin' THEN ap.can_admin
      ELSE false
    END INTO has_perm
  FROM application_permissions ap
  JOIN user_roles ur ON ap.role_id = ur.role_id
  WHERE ur.user_id = user_uuid 
    AND ap.application_name = app_name
  LIMIT 1;
  
  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;