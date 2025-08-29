/*
  # Add age column to employee table

  1. Changes
    - Add `age` column to `erms.employee` table
    - Set column type as integer to store calculated age
    - Add default value of NULL since age can be calculated from date_of_birth

  2. Notes
    - Age will be calculated and stored when employee records are created/updated
    - This allows for easier querying and reporting without recalculating age each time
*/

-- Add age column to employee table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'erms' 
    AND table_name = 'employee' 
    AND column_name = 'age'
  ) THEN
    ALTER TABLE erms.employee ADD COLUMN age integer;
  END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN erms.employee.age IS 'Employee age calculated from date of birth';