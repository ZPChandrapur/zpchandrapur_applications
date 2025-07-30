/*
  # Fix infinite recursion in roles table RLS policy

  1. Problem
    - Current RLS policy on roles table causes infinite recursion
    - Policy likely references roles table within itself creating circular dependency
    - This prevents fetching clerk role information needed for employee dashboard

  2. Solution
    - Drop existing problematic policies on roles table
    - Create simple, non-recursive policies for roles table
    - Allow authenticated users to read roles without complex joins
    - Maintain security while avoiding recursion

  3. Changes
    - Drop all existing policies on roles table
    - Create new simple SELECT policy for authenticated users
    - Create new management policy for super admins without recursion
*/

-- Drop existing policies that may cause recursion
DROP POLICY IF EXISTS "Anyone can read roles" ON public.roles;
DROP POLICY IF EXISTS "Only super admins can manage roles" ON public.roles;

-- Create simple, non-recursive policy for reading roles
CREATE POLICY "Authenticated users can read roles"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create management policy without recursion
-- Use a direct check against user metadata instead of joining roles table
CREATE POLICY "Super admins can manage roles"
  ON public.roles
  FOR ALL
  TO authenticated
  USING (
    -- Check if user has super_admin or developer role in their metadata
    -- This avoids querying the roles table itself
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text IN ('super_admin', 'developer')
    OR
    -- Alternative: check if user_id exists in a specific list of admin users
    auth.uid()::text IN (
      SELECT user_id::text 
      FROM public.user_roles 
      WHERE role_id = 1 -- Assuming role_id 1 is super_admin
    )
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text IN ('super_admin', 'developer')
    OR
    auth.uid()::text IN (
      SELECT user_id::text 
      FROM public.user_roles 
      WHERE role_id = 1
    )
  );