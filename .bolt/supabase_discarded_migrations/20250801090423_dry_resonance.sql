/*
  # Add voluntary_retirement_date to employee table

  1. New Column
    - `voluntary_retirement_date` (date, optional)
      - For employees who choose early/voluntary retirement
      - Can be null for regular retirement cases

  2. Performance
    - Add index on voluntary_retirement_date for better query performance

  3. Documentation
    - Add comment explaining the column purpose
*/

-- Add voluntary_retirement_date column to employee table
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
    
    -- Add comment to explain the column
    COMMENT ON COLUMN erms.employee.voluntary_retirement_date IS 'Date when employee opts for voluntary/early retirement (optional)';
  END IF;
END $$;

-- Create index for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'erms' 
    AND tablename = 'employee' 
    AND indexname = 'idx_employee_voluntary_retirement_date'
  ) THEN
    CREATE INDEX idx_employee_voluntary_retirement_date 
    ON erms.employee(voluntary_retirement_date);
  END IF;
END $$;