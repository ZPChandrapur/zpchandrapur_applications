/*
  # Remove voluntary retirement date changes

  1. Database Changes
    - Drop voluntary_retirement_date column from employee table
    - Drop associated index
    - Clean up any age-related columns if they exist

  2. Notes
    - This migration removes the voluntary_retirement_date column and related changes
    - Uses IF EXISTS to safely handle cases where columns might not exist
*/

-- Drop the voluntary_retirement_date column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'erms' 
    AND table_name = 'employee' 
    AND column_name = 'voluntary_retirement_date'
  ) THEN
    ALTER TABLE erms.employee DROP COLUMN voluntary_retirement_date;
  END IF;
END $$;

-- Drop the age column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'erms' 
    AND table_name = 'employee' 
    AND column_name = 'age'
  ) THEN
    ALTER TABLE erms.employee DROP COLUMN age;
  END IF;
END $$;

-- Drop indexes if they exist
DROP INDEX IF EXISTS erms.idx_employee_voluntary_retirement_date;
DROP INDEX IF EXISTS erms.idx_employee_age;