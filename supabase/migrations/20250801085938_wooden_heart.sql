/*
  # Add age and voluntary_retirement_date columns to employee table

  1. New Columns
    - `age` (integer, computed from date_of_birth)
    - `voluntary_retirement_date` (date, optional)
  
  2. Features
    - Age automatically calculated from date_of_birth
    - Voluntary retirement date is optional
    - Indexes added for performance
  
  3. Notes
    - Age updates automatically when date_of_birth changes
    - Uses EXTRACT function for accurate age calculation
*/

-- Add age column as computed column that calculates age from date_of_birth
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'erms' 
    AND table_name = 'employee' 
    AND column_name = 'age'
  ) THEN
    ALTER TABLE erms.employee 
    ADD COLUMN age INTEGER GENERATED ALWAYS AS (
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))
    ) STORED;
  END IF;
END $$;

-- Add voluntary_retirement_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'erms' 
    AND table_name = 'employee' 
    AND column_name = 'voluntary_retirement_date'
  ) THEN
    ALTER TABLE erms.employee 
    ADD COLUMN voluntary_retirement_date DATE;
  END IF;
END $$;

-- Add comment for age column
COMMENT ON COLUMN erms.employee.age IS 'Automatically calculated age from date_of_birth';

-- Add comment for voluntary_retirement_date column
COMMENT ON COLUMN erms.employee.voluntary_retirement_date IS 'Optional voluntary retirement date for early retirement';

-- Create index on age for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'erms' 
    AND tablename = 'employee' 
    AND indexname = 'idx_employee_age'
  ) THEN
    CREATE INDEX idx_employee_age ON erms.employee (age);
  END IF;
END $$;

-- Create index on voluntary_retirement_date for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'erms' 
    AND tablename = 'employee' 
    AND indexname = 'idx_employee_voluntary_retirement_date'
  ) THEN
    CREATE INDEX idx_employee_voluntary_retirement_date ON erms.employee (voluntary_retirement_date);
  END IF;
END $$;