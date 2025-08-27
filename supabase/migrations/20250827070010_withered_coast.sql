/*
  # Add status columns to employee_retirement table

  1. New Columns
    - `retirement_progress_status` (text) - Status of retirement progress
    - `pay_commission_status` (text) - Status of pay commission processing
    - `group_insurance_status` (text) - Status of group insurance processing

  2. Default Values
    - All columns default to 'pending' to indicate initial state
    - Allow null values for flexibility

  3. Security
    - No RLS changes needed as table already has proper policies
*/

-- Add new status columns to employee_retirement table
DO $$
BEGIN
  -- Add retirement_progress_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee_retirement' AND column_name = 'retirement_progress_status'
  ) THEN
    ALTER TABLE employee_retirement ADD COLUMN retirement_progress_status text DEFAULT 'pending';
  END IF;

  -- Add pay_commission_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee_retirement' AND column_name = 'pay_commission_status'
  ) THEN
    ALTER TABLE employee_retirement ADD COLUMN pay_commission_status text DEFAULT 'pending';
  END IF;

  -- Add group_insurance_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee_retirement' AND column_name = 'group_insurance_status'
  ) THEN
    ALTER TABLE employee_retirement ADD COLUMN group_insurance_status text DEFAULT 'pending';
  END IF;
END $$;