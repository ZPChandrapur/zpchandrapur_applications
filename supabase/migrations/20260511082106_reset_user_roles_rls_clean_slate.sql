/*
  # Complete reset of user_roles RLS policies

  ## Problem
  Multiple conflicting policies from different migrations are all active simultaneously:
  - Old policies using auth.jwt()->>'role' (which is never set in the JWT claims)
  - Old policies with infinite recursion subqueries
  - New policies missing the critical "Users can read own role" self-select policy
  - A permissive insert policy with WITH CHECK (true) — security risk

  ## Fix
  Drop every policy on user_roles and recreate a clean, correct set.
  The "Users can read own role" policy uses only user_id = auth.uid() — zero subqueries,
  zero recursion, always works for any authenticated user.
*/

-- Drop ALL existing policies on user_roles (every single one)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'user_roles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname);
  END LOOP;
END $$;

-- Recreate get_my_role as SECURITY DEFINER to avoid recursion
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

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- 1. Every authenticated user can always read their own row
CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Admins/developers/super_admin can read ALL rows
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
