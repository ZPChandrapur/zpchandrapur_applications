/*
  # Create Employee Retirement Management Table

  1. New Tables
    - `employee_retirement`
      - Core employee data from employee table
      - Additional retirement processing columns
      - Automatic population based on retirement date (6 months before)

  2. Automation
    - Function to populate table automatically
    - Trigger to keep data synchronized
    - Initial population of existing eligible employees

  3. Security
    - Enable RLS on employee_retirement table
    - Add policies for authenticated users
*/

-- Create the employee_retirement table
CREATE TABLE IF NOT EXISTS erms.employee_retirement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_id text NOT NULL UNIQUE,
  employee_name text NOT NULL,
  date_of_birth date,
  retirement_date date,
  reason text,
  designation_time_of_retirement text NOT NULL,
  assigned_clerk_name text NOT NULL,
  date_of_submission text,
  department_submitted text,
  type_of_pension text,
  date_of_pension_case_approval text,
  date_of_actual_benefit_provided_for_group_insurance text,
  date_of_benefit_provided_for_gratuity text,
  date_of_actual_benefit_provided_for_leave_encashment text,
  date_of_actual_benefit_provided_for_medical_allowance_if_applic text,
  date_of_benefit_provided_for_hometown_travel_allowance_if_appli text,
  date_of_actual_benefit_provided_for_pending_travel_allowance_if text,
  government_decision_march_31_2023 text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comment to the table
COMMENT ON TABLE erms.employee_retirement IS 'Employee retirement management table for tracking retirement processes';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_retirement_emp_id ON erms.employee_retirement(emp_id);
CREATE INDEX IF NOT EXISTS idx_employee_retirement_retirement_date ON erms.employee_retirement(retirement_date);
CREATE INDEX IF NOT EXISTS idx_employee_retirement_created_at ON erms.employee_retirement(created_at);

-- Enable RLS
ALTER TABLE erms.employee_retirement ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can read employee retirement records"
  ON erms.employee_retirement
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert employee retirement records"
  ON erms.employee_retirement
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update employee retirement records"
  ON erms.employee_retirement
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to populate employee_retirement table
CREATE OR REPLACE FUNCTION erms.populate_employee_retirement()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert employees whose retirement date is within 6 months from today
  INSERT INTO erms.employee_retirement (
    emp_id,
    employee_name,
    date_of_birth,
    retirement_date,
    reason,
    designation_time_of_retirement,
    assigned_clerk_name
  )
  SELECT DISTINCT
    e.emp_id,
    e.employee_name,
    e.date_of_birth,
    e.retirement_date,
    e.reason,
    COALESCE(d.designation, 'Not Assigned') as designation_time_of_retirement,
    COALESCE(ur.name, 'Not Assigned') as assigned_clerk_name
  FROM erms.employee e
  LEFT JOIN erms.designations d ON e.designation_id = d.designation_id
  LEFT JOIN public.user_roles ur ON e.assigned_clerk = ur.user_id
  WHERE 
    e.retirement_date IS NOT NULL 
    AND e.retirement_date <= (CURRENT_DATE + INTERVAL '6 months')
    AND e.retirement_date >= CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM erms.employee_retirement er 
      WHERE er.emp_id = e.emp_id
    );
END;
$$;

-- Create trigger function to automatically populate employee_retirement
CREATE OR REPLACE FUNCTION erms.trigger_populate_employee_retirement()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the employee should be in retirement table
  IF NEW.retirement_date IS NOT NULL 
     AND NEW.retirement_date <= (CURRENT_DATE + INTERVAL '6 months')
     AND NEW.retirement_date >= CURRENT_DATE THEN
    
    -- Insert or update the retirement record
    INSERT INTO erms.employee_retirement (
      emp_id,
      employee_name,
      date_of_birth,
      retirement_date,
      reason,
      designation_time_of_retirement,
      assigned_clerk_name
    )
    SELECT 
      NEW.emp_id,
      NEW.employee_name,
      NEW.date_of_birth,
      NEW.retirement_date,
      NEW.reason,
      COALESCE(d.designation, 'Not Assigned') as designation_time_of_retirement,
      COALESCE(ur.name, 'Not Assigned') as assigned_clerk_name
    FROM erms.employee e
    LEFT JOIN erms.designations d ON NEW.designation_id = d.designation_id
    LEFT JOIN public.user_roles ur ON NEW.assigned_clerk = ur.user_id
    WHERE e.emp_id = NEW.emp_id
    ON CONFLICT (emp_id) 
    DO UPDATE SET
      employee_name = EXCLUDED.employee_name,
      date_of_birth = EXCLUDED.date_of_birth,
      retirement_date = EXCLUDED.retirement_date,
      reason = EXCLUDED.reason,
      designation_time_of_retirement = EXCLUDED.designation_time_of_retirement,
      assigned_clerk_name = EXCLUDED.assigned_clerk_name,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on employee table
DROP TRIGGER IF EXISTS trigger_employee_retirement_population ON erms.employee;
CREATE TRIGGER trigger_employee_retirement_population
  AFTER INSERT OR UPDATE ON erms.employee
  FOR EACH ROW
  EXECUTE FUNCTION erms.trigger_populate_employee_retirement();

-- Initial population of the table
SELECT erms.populate_employee_retirement();