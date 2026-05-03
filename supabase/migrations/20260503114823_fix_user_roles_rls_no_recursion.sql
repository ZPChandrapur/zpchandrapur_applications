/*
  # Fix user_roles RLS — eliminate infinite recursion completely

  ## Problem
  The "Admins can read all roles" policy uses a subquery on user_roles itself.
  Even though it only triggers for the admin check path, Postgres still detects
  the potential recursion and throws "infinite recursion detected in policy".

  ## Solution
  Create a SECURITY DEFINER function that bypasses RLS to check the caller's role.
  This is the standard Supabase pattern for breaking RLS self-reference cycles.
  The function runs as the table owner (postgres) so it can read user_roles without
  triggering any RLS policy on that table.
*/

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert role assignments" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update role assignments" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete role assignments" ON public.user_roles;

-- Create a SECURITY DEFINER function that checks role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- 1. Every authenticated user can read their own row (simple, no recursion)
CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Admins can read ALL rows — uses security definer function, no recursion
CREATE POLICY "Admins can read all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = ANY (ARRAY['developer', 'super_admin', 'admin'])
  );

-- 3. Admins can insert
CREATE POLICY "Admins can insert role assignments"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = ANY (ARRAY['developer', 'super_admin', 'admin'])
  );

-- 4. Admins can update
CREATE POLICY "Admins can update role assignments"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() = ANY (ARRAY['developer', 'super_admin', 'admin'])
  )
  WITH CHECK (
    public.get_my_role() = ANY (ARRAY['developer', 'super_admin', 'admin'])
  );

-- 5. Admins can delete
CREATE POLICY "Admins can delete role assignments"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (
    public.get_my_role() = ANY (ARRAY['developer', 'super_admin', 'admin'])
  );
