/*
  # Update File Tracking Visibility for All Users

  ## Changes
  1. Update RLS policies to allow all authenticated users to view file tracking
  2. All users can now see file tracking status for all retirement records
  3. Maintains security - only assigned users can still update

  ## Modified Policies
  - Drop and recreate SELECT policies for broader access
  - Keep INSERT and UPDATE policies secure
*/

-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Users can view their assigned files or files they assigned" ON erms.retirement_file_tracking;
DROP POLICY IF EXISTS "Admins can view all file tracking" ON erms.retirement_file_tracking;
DROP POLICY IF EXISTS "Users can view file history they're involved in" ON erms.retirement_file_history;
DROP POLICY IF EXISTS "Admins can view all file history" ON erms.retirement_file_history;

-- Create new open SELECT policy for file tracking
CREATE POLICY "All users can view all file tracking"
  ON erms.retirement_file_tracking
  FOR SELECT
  TO authenticated
  USING (true);

-- Create new open SELECT policy for file history
CREATE POLICY "All users can view all file history"
  ON erms.retirement_file_history
  FOR SELECT
  TO authenticated
  USING (true);
