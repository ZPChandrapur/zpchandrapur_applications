/*
  # Reapply age and voluntary retirement columns to employee table

  1. Table Updates
    - Add `age` column as computed field calculating age from date_of_birth
    - Add `voluntary_retirement_date` column as optional date field
  
  2. Indexes
    - Add performance indexes on both new columns
  
  3. Security
    - Maintain existing RLS policies
  
  4. Notes
    - Uses IF NOT EXISTS checks to prevent errors if columns already exist
    - Age is automatically calculated and updated
*/

-- Add age column as computed field (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'erms' AND table_name = 'employee' AND column_name = 'age'
  ) THEN
    ALTER TABLE erms.employee 
    ADD COLUMN age integer GENERATED ALWAYS AS (
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))::integer
    ) STORED;
  END IF;
END $$;

-- Add voluntary retirement date column (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'erms' AND table_name = 'employee' AND column_name = 'voluntary_retirement_date'
  ) THEN
    ALTER TABLE erms.employee 
    ADD COLUMN voluntary_retirement_date date;
  END IF;
END $$;

-- Add indexes for performance (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'erms' AND tablename = 'employee' AND indexname = 'idx_employee_age'
  ) THEN
    CREATE INDEX idx_employee_age ON erms.employee (age);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'erms' AND tablename = 'employee' AND indexname = 'idx_employee_voluntary_retirement_date'
  ) THEN
    CREATE INDEX idx_employee_voluntary_retirement_date ON erms.employee (voluntary_retirement_date);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN erms.employee.age IS 'Automatically calculated age based on date_of_birth';
COMMENT ON COLUMN erms.employee.voluntary_retirement_date IS 'Optional date for employees choosing voluntary retirement';