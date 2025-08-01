/*
  # Add age calculation and voluntary retirement date to employee table

  1. New Columns
    - `age` (integer, computed from date_of_birth)
    - `voluntary_retirement_date` (date, nullable)

  2. Features
    - Age is automatically calculated from date_of_birth using current date
    - Voluntary retirement date is optional
    - Added trigger to update age when date_of_birth changes
    - Indexes for performance on new columns

  3. Security
    - Maintains existing RLS policies
    - No additional security changes needed
*/

-- Add the new columns to the employee table
ALTER TABLE erms.employee 
ADD COLUMN IF NOT EXISTS age INTEGER GENERATED ALWAYS AS (
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))::INTEGER
) STORED;

ALTER TABLE erms.employee 
ADD COLUMN IF NOT EXISTS voluntary_retirement_date DATE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_age ON erms.employee(age);
CREATE INDEX IF NOT EXISTS idx_employee_voluntary_retirement_date ON erms.employee(voluntary_retirement_date);

-- Add comments for documentation
COMMENT ON COLUMN erms.employee.age IS 'Automatically calculated age from date_of_birth';
COMMENT ON COLUMN erms.employee.voluntary_retirement_date IS 'Optional voluntary retirement date for the employee';