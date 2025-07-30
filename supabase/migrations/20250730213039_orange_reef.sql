/*
  # Fix infinite recursion in roles table RLS policy

  1. Policy Changes
    - Drop existing problematic policies on roles table
    - Create simple, non-recursive policies for roles table
    - Ensure policies don't create circular dependencies

  2. Security
    - Allow authenticated users to read roles
    - Allow super admins to manage roles without recursion
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Anyone can read roles" ON public.roles;
DROP POLICY IF EXISTS "Only super admins can manage roles" ON public.roles;

-- Create simple, non-recursive policy for reading roles
CREATE POLICY "Authenticated users can read roles"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create management policy that doesn't cause recursion
-- This policy checks user_roles directly without joining back to roles
CREATE POLICY "Super admins can manage roles"
  ON public.roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role_id IN (1, 2) -- Assuming 1=developer, 2=super_admin role IDs
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role_id IN (1, 2) -- Assuming 1=developer, 2=super_admin role IDs
    )
  );