/*
  # Option B: Allow INSERT for all authenticated, restrict SELECT/UPDATE/DELETE
  
  This migration simplifies RLS policies:
  - INSERT: Allowed for all authenticated users (removes RLS blocker)
  - SELECT: Only own record or if admin
  - UPDATE/DELETE: Admins only
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "user_roles_admin_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_self_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_delete" ON public.user_roles;

-- Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICY 1: SELECT - Allow reading user roles
-- ============================================================
-- Users can read their own record
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all records (check JWT role claim)
CREATE POLICY "user_roles_admin_select" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'developer')
  );

-- ============================================================
-- POLICY 2: INSERT - Allow creating new user roles (all authenticated)
-- ============================================================
-- Simplified: Allow all authenticated users to insert
-- In production, you may want to add a trigger to validate permissions
CREATE POLICY "user_roles_allow_insert" ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- POLICY 3: UPDATE - Allow updating user roles (admin only)
-- ============================================================
CREATE POLICY "user_roles_admin_update" ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'developer')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'developer')
  );

-- ============================================================
-- POLICY 4: DELETE - Allow deleting user roles (admin only)
-- ============================================================
CREATE POLICY "user_roles_admin_delete" ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'developer')
  );

-- ============================================================
-- COMMENT
-- ============================================================
COMMENT ON TABLE public.user_roles IS 
'User role assignments. RLS policies:
- SELECT: Own record or admin
- INSERT: All authenticated users
- UPDATE/DELETE: Admins only (via JWT role claim)';
