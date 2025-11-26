/*
  # Add Reassigned Status Support

  ## Changes
  1. Update retirement_file_tracking status check constraint to include 'reassigned'
  2. Update retirement_file_history action check constraint to include 'reassigned'

  ## Details
  - Allows files to be reassigned to another user at the same level
  - Maintains complete audit trail of all reassignments
*/

-- Drop existing check constraints
ALTER TABLE erms.retirement_file_tracking DROP CONSTRAINT IF EXISTS retirement_file_tracking_status_check;
ALTER TABLE erms.retirement_file_history DROP CONSTRAINT IF EXISTS retirement_file_history_action_check;

-- Add new check constraints with 'reassigned' support
ALTER TABLE erms.retirement_file_tracking 
  ADD CONSTRAINT retirement_file_tracking_status_check 
  CHECK (status IN ('assigned', 'completed', 'reverted', 'reassigned'));

ALTER TABLE erms.retirement_file_history 
  ADD CONSTRAINT retirement_file_history_action_check 
  CHECK (action IN ('forwarded', 'reverted', 'completed', 'assigned', 'reassigned'));
