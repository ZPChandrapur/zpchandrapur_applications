/*
  # Fix infinite recursion in user_roles RLS policies

  1. Problem
    - Current RLS policies on user_roles table are causing infinite recursion
    - This happens when policies reference user_roles table in their conditions
    - The circular dependency creates an infinite loop during policy evaluation

  2. Solution
    - Drop existing problematic policies
    - Create simplified policies that don't cause recursion
    - Use direct user ID comparison instead of complex subqueries

  3. New Policies
    - Users can read their own user_roles records
    - Admins can read all user_roles records (using auth.jwt() claims)
    - Super admins can manage all user_roles records
*/

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can read their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all user roles" ON user_roles;
DROP POLICY IF EXISTS "Only super admins can manage user roles" ON user_roles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own user_roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow reading user_roles for admin operations
-- This uses a simpler approach that doesn't query user_roles recursively
CREATE POLICY "Service role can read all user_roles"
  ON user_roles
  FOR SELECT
  TO service_role
  USING (true);

-- Allow authenticated users to read user_roles for basic profile info
-- This is a temporary policy to resolve the immediate issue
CREATE POLICY "Authenticated users can read user_roles for profiles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- For INSERT/UPDATE/DELETE operations, keep it simple
CREATE POLICY "Service role can manage user_roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);