/*
  # Create Employee Table in ERMS Schema

  1. New Tables
    - `erms.employee`
      - `emp_id` (text, primary key) - Employee ID
      - `employee_name` (text, not null) - Employee full name
      - `date_of_birth` (timestamptz, not null) - Date of birth
      - `dept_id` (text, not null, FK) - Department ID (foreign key to department table)
      - `designation` (text) - Employee designation/position
      - `office_id` (text, FK) - Office location ID (foreign key to office_locations table)
      - `retirement_date` (timestamptz) - Calculated retirement date (60 years + last day of month)
      - `reason` (text) - Reason for retirement or other notes
      - `assigned_clerk` (text) - Clerk assigned to handle employee case
      - `date_of_assignment` (timestamptz) - Date when clerk was assigned
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp

  2. Functions
    - `calculate_retirement_date()` - Calculates retirement date based on birth date (60 years + last day of month)

  3. Triggers
    - Auto-update `updated_at` on record changes
    - Auto-calculate `retirement_date` when `date_of_birth` changes

  4. Foreign Keys
    - Links to `department` table via `dept_id`
    - Links to `office_locations` table via `office_id`

  5. Indexes
    - Performance indexes on foreign keys and commonly queried fields
*/

-- Create function to calculate retirement date (60 years + last day of month)
CREATE OR REPLACE FUNCTION calculate_retirement_date(birth_date timestamptz)
RETURNS timestamptz AS $$
DECLARE
  retirement_year integer;
  retirement_month integer;
  last_day_of_month timestamptz;
BEGIN
  -- Calculate the year when person turns 60
  retirement_year := EXTRACT(YEAR FROM birth_date) + 60;
  retirement_month := EXTRACT(MONTH FROM birth_date);
  
  -- Get the last day of the retirement month
  last_day_of_month := (DATE_TRUNC('MONTH', make_date(retirement_year, retirement_month, 1)) + INTERVAL '1 MONTH - 1 DAY')::timestamptz;
  
  RETURN last_day_of_month;
END;
$$ LANGUAGE plpgsql;

-- Create employee table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_dept_id ON erms.employee(dept_id);
CREATE INDEX IF NOT EXISTS idx_employee_office_id ON erms.employee(office_id);
CREATE INDEX IF NOT EXISTS idx_employee_retirement_date ON erms.employee(retirement_date);
CREATE INDEX IF NOT EXISTS idx_employee_assigned_clerk ON erms.employee(assigned_clerk);

-- Create trigger to auto-update updated_at column
CREATE TRIGGER update_employee_updated_at
  BEFORE UPDATE ON erms.employee
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to auto-calculate retirement_date when date_of_birth changes
CREATE OR REPLACE FUNCTION update_retirement_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate retirement date when date_of_birth is set or changed
  IF NEW.date_of_birth IS NOT NULL AND (OLD.date_of_birth IS NULL OR NEW.date_of_birth != OLD.date_of_birth) THEN
    NEW.retirement_date := calculate_retirement_date(NEW.date_of_birth);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_employee_retirement_date
  BEFORE INSERT OR UPDATE ON erms.employee
  FOR EACH ROW
  EXECUTE FUNCTION update_retirement_date();

-- Enable RLS (if needed for security)
ALTER TABLE erms.employee ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE erms.employee IS 'Employee records with retirement management';
COMMENT ON COLUMN erms.employee.emp_id IS 'Unique employee identifier';
COMMENT ON COLUMN erms.employee.employee_name IS 'Full name of the employee';
COMMENT ON COLUMN erms.employee.date_of_birth IS 'Employee date of birth';
COMMENT ON COLUMN erms.employee.dept_id IS 'Department ID (foreign key to department table)';
COMMENT ON COLUMN erms.employee.designation IS 'Employee job designation/position';
COMMENT ON COLUMN erms.employee.office_id IS 'Office location ID (foreign key to office_locations table)';
COMMENT ON COLUMN erms.employee.retirement_date IS 'Calculated retirement date (60 years + last day of month)';
COMMENT ON COLUMN erms.employee.reason IS 'Reason for retirement or other notes';
COMMENT ON COLUMN erms.employee.assigned_clerk IS 'Clerk assigned to handle employee case';
COMMENT ON COLUMN erms.employee.date_of_assignment IS 'Date when clerk was assigned to employee';