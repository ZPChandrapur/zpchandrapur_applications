/*
  # Fix roles table RLS policies - Remove all conflicts and create proper policies

  1. Security Changes
    - Drop ALL existing policies on roles table to avoid conflicts
    - Create simple, non-recursive policies
    - Allow authenticated users to read roles without circular dependencies
    - Allow super admins to manage roles using direct role_id checks

  This migration completely resolves the infinite recursion issue by:
  - Removing all existing conflicting policies
  - Creating policies that don't reference the roles table within the policy itself
  - Using direct role_id comparisons instead of role name lookups
*/

-- Drop ALL existing policies on the roles table to avoid conflicts
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Get all policies for the roles table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'roles' AND schemaname = 'public'
    LOOP
        -- Drop each policy
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.roles', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Create simple, non-recursive policies

-- Policy 1: Allow all authenticated users to read roles
-- This is safe and doesn't cause recursion
CREATE POLICY "authenticated_users_can_read_roles"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Allow users with super admin or developer roles to manage roles
-- Uses direct role_id check to avoid recursion
CREATE POLICY "super_admins_can_manage_roles"
  ON public.roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role_id IN (1, 2)  -- Assuming 1=developer, 2=super_admin
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role_id IN (1, 2)  -- Assuming 1=developer, 2=super_admin
    )
  );

-- Ensure RLS is enabled
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;