/*
  # Create employee_retirement table

  1. New Tables
    - `employee_retirement` in erms schema
      - `id` (uuid, primary key)
      - `emp_id` (text, from employee table)
      - `employee_name` (text, from employee table)
      - `date_of_birth` (date, from employee table)
      - `retirement_date` (date, from employee table)
      - `voluntary_retirement_date` (date, from employee table)
      - `reason` (text, from employee table)
      - Additional retirement processing columns
  2. Security
    - Enable RLS on `employee_retirement` table
    - Add policies for authenticated users
  3. Automation
    - Function to populate table automatically
    - Trigger to keep data synchronized
    - Initial population of eligible employees
*/

-- Create the employee_retirement table
CREATE TABLE IF NOT EXISTS erms.employee_retirement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_id text NOT NULL,
  employee_name text NOT NULL,
  date_of_birth date,
  retirement_date date,
  voluntary_retirement_date date,
  reason text,
  desination_time_of_retirement text NOT NULL DEFAULT 'Unknown',
  assigned_clerk_name text NOT NULL DEFAULT 'Unassigned',
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
  updated_at timestamptz DEFAULT now(),
  UNIQUE(emp_id)
);

-- Enable RLS
ALTER TABLE erms.employee_retirement ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read employee_retirement"
  ON erms.employee_retirement
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert employee_retirement"
  ON erms.employee_retirement
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update employee_retirement"
  ON erms.employee_retirement
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create function to automatically populate employee_retirement table
CREATE OR REPLACE FUNCTION erms.populate_employee_retirement()
RETURNS void AS $$
BEGIN
  INSERT INTO erms.employee_retirement (
    emp_id,
    employee_name,
    date_of_birth,
    retirement_date,
    reason,
    desination_time_of_retirement,
    assigned_clerk_name
  )
  SELECT 
    e.emp_id,
    e.employee_name,
    e.date_of_birth,
    e.retirement_date,
    e.reason,
    COALESCE(d.designation, 'Unknown') as desination_time_of_retirement,
    COALESCE(ur.name, 'Unassigned') as assigned_clerk_name
  FROM erms.employee e
  LEFT JOIN erms.designations d ON e.designation_id = d.designation_id
  LEFT JOIN public.user_roles ur ON e.assigned_clerk::uuid = ur.user_id
  WHERE (
    e.retirement_date IS NOT NULL 
    AND e.retirement_date <= CURRENT_DATE + INTERVAL '6 months'
  )
  ON CONFLICT (emp_id) DO UPDATE SET
    employee_name = EXCLUDED.employee_name,
    date_of_birth = EXCLUDED.date_of_birth,
    retirement_date = EXCLUDED.retirement_date,
    reason = EXCLUDED.reason,
    desination_time_of_retirement = EXCLUDED.desination_time_of_retirement,
    assigned_clerk_name = EXCLUDED.assigned_clerk_name,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create trigger function
CREATE OR REPLACE FUNCTION erms.trigger_populate_employee_retirement()
RETURNS trigger AS $$
BEGIN
  -- Check if the employee should be in retirement table
  IF (
    NEW.retirement_date IS NOT NULL 
    AND NEW.retirement_date <= CURRENT_DATE + INTERVAL '6 months'
  ) THEN
    INSERT INTO erms.employee_retirement (
      emp_id,
      employee_name,
      date_of_birth,
      retirement_date,
      reason,
      desination_time_of_retirement,
      assigned_clerk_name
    )
    SELECT 
      NEW.emp_id,
      NEW.employee_name,
      NEW.date_of_birth,
      NEW.retirement_date,
      NEW.reason,
      COALESCE(d.designation, 'Unknown') as desination_time_of_retirement,
      COALESCE(ur.name, 'Unassigned') as assigned_clerk_name
    FROM erms.designations d
    LEFT JOIN public.user_roles ur ON NEW.assigned_clerk::uuid = ur.user_id
    WHERE d.designation_id = NEW.designation_id
    ON CONFLICT (emp_id) DO UPDATE SET
      employee_name = EXCLUDED.employee_name,
      date_of_birth = EXCLUDED.date_of_birth,
      retirement_date = EXCLUDED.retirement_date,
      reason = EXCLUDED.reason,
      desination_time_of_retirement = EXCLUDED.desination_time_of_retirement,
      assigned_clerk_name = EXCLUDED.assigned_clerk_name,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS employee_retirement_trigger ON erms.employee;
CREATE TRIGGER employee_retirement_trigger
  AFTER INSERT OR UPDATE ON erms.employee
  FOR EACH ROW
  EXECUTE FUNCTION erms.trigger_populate_employee_retirement();

-- Initial population
SELECT erms.populate_employee_retirement();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_retirement_emp_id ON erms.employee_retirement(emp_id);
CREATE INDEX IF NOT EXISTS idx_employee_retirement_retirement_date ON erms.employee_retirement(retirement_date);