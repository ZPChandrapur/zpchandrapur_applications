/*
  # Update emp_id to auto-incrementing bigint

  1. Changes
    - Convert emp_id column to BIGINT with auto-increment
    - Update existing records to have sequential IDs starting from 1
    - Add sequence for auto-incrementing functionality

  2. Security
    - No RLS changes needed
*/

-- First, let's handle the sequence and auto-increment setup
DO $$
BEGIN
  -- Create a sequence for emp_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'employee_emp_id_seq') THEN
    CREATE SEQUENCE employee_emp_id_seq;
  END IF;
  
  -- Update the emp_id column to be BIGINT and set default
  ALTER TABLE erms.employee 
    ALTER COLUMN emp_id TYPE BIGINT USING emp_id::BIGINT,
    ALTER COLUMN emp_id SET DEFAULT nextval('employee_emp_id_seq');
  
  -- Update existing records to have sequential IDs
  WITH numbered_employees AS (
    SELECT emp_id, ROW_NUMBER() OVER (ORDER BY emp_id) as new_id
    FROM erms.employee
  )
  UPDATE erms.employee 
  SET emp_id = numbered_employees.new_id
  FROM numbered_employees
  WHERE erms.employee.emp_id = numbered_employees.emp_id;
  
  -- Set the sequence to continue from the highest existing ID
  PERFORM setval('employee_emp_id_seq', COALESCE((SELECT MAX(emp_id) FROM erms.employee), 0) + 1, false);
  
END $$;