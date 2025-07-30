/*
  # Create employee table in ERMS schema

  1. New Tables
    - `erms.employee`
      - `emp_id` (text, primary key) - Employee identifier
      - `employee_name` (text, not null) - Employee full name
      - `date_of_birth` (timestamptz, not null) - Employee birth date
      - `dept_id` (text, not null, foreign key) - Department reference
      - `designation` (text) - Employee designation/position
      - `office_id` (text, foreign key) - Office location reference
      - `retirement_date` (timestamptz) - Calculated retirement date (60 years + last day of month)
      - `reason` (text) - Reason for retirement or other notes
      - `assigned_clerk` (text) - Clerk assigned to handle employee case
      - `date_of_assignment` (timestamptz) - Date when clerk was assigned
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Foreign Keys
    - Links to `erms.department` table via `dept_id`
    - Links to `erms.office_locations` table via `office_id`

  3. Triggers
    - Auto-update `updated_at` column on record changes
    - Auto-calculate `retirement_date` based on `date_of_birth`

  4. Functions
    - Custom function to calculate retirement date (60 years + last day of month)
*/

-- Create function to calculate retirement date
CREATE OR REPLACE FUNCTION erms.calculate_retirement_date(birth_date timestamptz)
RETURNS timestamptz AS $$
DECLARE
  retirement_year integer;
  retirement_month integer;
  last_day_of_month timestamptz;
BEGIN
  -- Calculate the year when employee turns 60
  retirement_year := EXTRACT(YEAR FROM birth_date) + 60;
  retirement_month := EXTRACT(MONTH FROM birth_date);
  
  -- Get the last day of the retirement month
  last_day_of_month := (DATE_TRUNC('MONTH', make_date(retirement_year, retirement_month, 1)) + INTERVAL '1 MONTH - 1 DAY')::timestamptz;
  
  RETURN last_day_of_month;
END;
$$ LANGUAGE plpgsql;

-- Create the employee table
CREATE TABLE IF NOT EXISTS erms.employee (
  emp_id text NOT NULL,
  employee_name text NOT NULL,
  date_of_birth timestamptz NOT NULL,
  dept_id text NOT NULL,
  designation text,
  office_id text,
  retirement_date timestamptz,
  reason text,
  assigned_clerk text,
  date_of_assignment timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT employee_pkey PRIMARY KEY (emp_id),
  CONSTRAINT employee_dept_id_fkey FOREIGN KEY (dept_id) REFERENCES erms.department(dept_id) ON DELETE RESTRICT,
  CONSTRAINT employee_office_id_fkey FOREIGN KEY (office_id) REFERENCES erms.office_locations(office_id) ON DELETE RESTRICT
);

-- Create trigger to auto-update updated_at column
CREATE TRIGGER update_employee_updated_at
  BEFORE UPDATE ON erms.employee
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to auto-calculate retirement_date when date_of_birth changes
CREATE OR REPLACE FUNCTION erms.update_retirement_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate retirement date if date_of_birth is provided
  IF NEW.date_of_birth IS NOT NULL THEN
    NEW.retirement_date := erms.calculate_retirement_date(NEW.date_of_birth);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_employee_retirement_date
  BEFORE INSERT OR UPDATE OF date_of_birth ON erms.employee
  FOR EACH ROW
  EXECUTE FUNCTION erms.update_retirement_date();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_dept_id ON erms.employee(dept_id);
CREATE INDEX IF NOT EXISTS idx_employee_office_id ON erms.employee(office_id);
CREATE INDEX IF NOT EXISTS idx_employee_retirement_date ON erms.employee(retirement_date);
CREATE INDEX IF NOT EXISTS idx_employee_assigned_clerk ON erms.employee(assigned_clerk);

-- Add comments for documentation
COMMENT ON TABLE erms.employee IS 'Employee records with retirement management';
COMMENT ON COLUMN erms.employee.emp_id IS 'Unique employee identifier';
COMMENT ON COLUMN erms.employee.employee_name IS 'Full name of the employee';
COMMENT ON COLUMN erms.employee.date_of_birth IS 'Employee birth date for retirement calculation';
COMMENT ON COLUMN erms.employee.dept_id IS 'Department reference (foreign key)';
COMMENT ON COLUMN erms.employee.designation IS 'Employee job designation/position';
COMMENT ON COLUMN erms.employee.office_id IS 'Office location reference (foreign key)';
COMMENT ON COLUMN erms.employee.retirement_date IS 'Auto-calculated retirement date (60 years + last day of month)';
COMMENT ON COLUMN erms.employee.reason IS 'Reason for retirement or other notes';
COMMENT ON COLUMN erms.employee.assigned_clerk IS 'Clerk assigned to handle employee case';
COMMENT ON COLUMN erms.employee.date_of_assignment IS 'Date when clerk was assigned to employee';