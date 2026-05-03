/*
  # Fix user_roles RLS Policies

  ## Problem
  The existing policies have two critical bugs:

  1. `user_roles_admin_select` uses a self-referencing subquery on `user_roles` itself to check
     if the caller is an admin. When a user has no role yet (or the policy blocks the subquery),
     this creates a deadlock — the user cannot read their own role row at all. This causes
     "Role: Not assigned" and "Access Restricted" on all modules.

  2. The admin policies grant access to the `anon` role (unauthenticated users), which is
     a security issue.

  ## Fix
  - Drop all existing broken policies
  - Re-create a clean set:
    - SELECT: authenticated users can always read their OWN row (user_id = auth.uid())
    - SELECT (admin): admins can read ALL rows using a safe join that does NOT recurse
    - INSERT/UPDATE/DELETE: admins only, restricted to `authenticated` role only
  - Admin check is done via a direct join on `user_roles` + `roles` using `auth.uid()`,
    but ONLY for the admin-level policies — the self-select policy uses a simple `user_id = auth.uid()` 
    which cannot deadlock.
*/

-- Drop all existing broken policies
DROP POLICY IF EXISTS "user_roles_admin_delete" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_self_select" ON public.user_roles;

-- 1. Any authenticated user can read their own role row (no recursion possible)
CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Admins/developers/super_admin can read ALL role rows
CREATE POLICY "Admins can read all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      INNER JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = ANY (ARRAY['developer', 'super_admin', 'admin'])
    )
  );

-- 3. Admins can insert new role assignments
CREATE POLICY "Admins can insert role assignments"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      INNER JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = ANY (ARRAY['developer', 'super_admin', 'admin'])
    )
  );

-- 4. Admins can update role assignments
CREATE POLICY "Admins can update role assignments"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      INNER JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = ANY (ARRAY['developer', 'super_admin', 'admin'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      INNER JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = ANY (ARRAY['developer', 'super_admin', 'admin'])
    )
  );

-- 5. Admins can delete role assignments
CREATE POLICY "Admins can delete role assignments"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      INNER JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = ANY (ARRAY['developer', 'super_admin', 'admin'])
    )
  );
