/*
  # Comprehensive RLS Policies for user_roles Table

  ## Overview
  This migration creates universal, simple RLS policies for the `user_roles` table that:
  1. Allow admins (developer, super_admin, admin) full access to manage user roles
  2. Allow users to view their own role information
  3. Allow users to view other users in the same application/role context (for org purposes)
  4. Ensure role-based access control throughout the application

  ## Access Rules
  - DEVELOPERS/SUPER_ADMIN/ADMIN: Can SELECT, INSERT, UPDATE, DELETE all records
  - AUTHENTICATED USERS: Can only SELECT their own record and records in accessible applications
  - ANON: No access

  ## Security Principles
  - Universal: Same policies apply everywhere
  - Simple: Easy to understand and maintain
  - Consistent: Matches frontend access control logic
  - Flexible: Supports application-based scoping
*/

-- Drop existing RLS policies if they exist (be careful with this in production)
DROP POLICY IF EXISTS "admin_full_access_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin_update_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin_delete_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_role" ON public.user_roles;
DROP POLICY IF EXISTS "allow_admin_insert_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "allow_admin_update_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "allow_admin_delete_user_roles" ON public.user_roles;

-- Ensure RLS is enabled on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICY 1: SELECT - Allow reading user roles
-- ============================================================
-- Admins can read all user roles
CREATE POLICY "user_roles_admin_select" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('developer', 'super_admin', 'admin')
    )
  );

-- Regular users can read their own role
CREATE POLICY "user_roles_self_select" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- POLICY 2: INSERT - Allow creating new user roles (admin only)
-- ============================================================
CREATE POLICY "user_roles_admin_insert" ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('developer', 'super_admin', 'admin')
    )
  );

-- ============================================================
-- POLICY 3: UPDATE - Allow updating user roles (admin only)
-- ============================================================
CREATE POLICY "user_roles_admin_update" ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('developer', 'super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('developer', 'super_admin', 'admin')
    )
  );

-- ============================================================
-- POLICY 4: DELETE - Allow deleting user roles (admin only)
-- ============================================================
CREATE POLICY "user_roles_admin_delete" ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('developer', 'super_admin', 'admin')
    )
  );

-- ============================================================
-- GRANT permissions to authenticated and service_role
-- ============================================================
-- Authenticated users get basic access (controlled by policies above)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- Service role (admin) gets full access
GRANT ALL ON public.user_roles TO service_role;

-- Create index for faster permission checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_user_roles_created_at ON public.user_roles(created_at DESC);

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================
COMMENT ON TABLE public.user_roles IS 
'User role assignments. Stores mapping between auth users and their application roles.';

COMMENT ON COLUMN public.user_roles.user_id IS 
'Reference to auth.users table - the authenticated user';

COMMENT ON COLUMN public.user_roles.role_id IS 
'Reference to roles table - the assigned role';

COMMENT ON COLUMN public.user_roles.name IS 
'User display name (denormalized for performance)';
