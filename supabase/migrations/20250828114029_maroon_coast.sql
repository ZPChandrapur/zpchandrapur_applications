/*
  # Create retirement date calculation function and trigger

  1. New Functions
    - `calculate_retirement_date()` - Trigger function that calculates retirement date based on birth date and cadre
      - Cadre 'C': 58 years retirement age
      - Cadre 'D': 60 years retirement age
      - Returns last day of retirement month

  2. New Triggers
    - `calculate_retirement_date_trigger` - Executes before INSERT/UPDATE on employee table
    - Automatically sets retirement_date field based on birth_date and cadre

  3. Logic
    - Calculates retirement year by adding retirement age to birth year
    - Uses birth month as retirement month
    - Sets retirement date to last day of retirement month
*/

-- Create the function in the erms schema
CREATE OR REPLACE FUNCTION erms.calculate_retirement_date()
RETURNS TRIGGER AS $$
DECLARE
  retirement_age INTEGER;
  retirement_year INTEGER;
  retirement_month INTEGER;
  last_day_of_month TIMESTAMPTZ;
BEGIN
  -- Ensure birth_date and cadre are not null for calculation
  IF NEW.birth_date IS NULL THEN
    RAISE EXCEPTION 'birth_date cannot be NULL for retirement date calculation.';
  END IF;
  IF NEW.cadre IS NULL THEN
    RAISE EXCEPTION 'cadre cannot be NULL for retirement date calculation.';
  END IF;

  -- Determine retirement age based on cadre from the NEW row
  IF NEW.cadre = 'C' THEN
    retirement_age := 58;
  ELSIF NEW.cadre = 'D' THEN
    retirement_age := 60;
  ELSE
    RAISE EXCEPTION 'Unsupported Cadre: % for employee %', NEW.cadre, NEW.emp_id;
  END IF;

  -- Calculate retirement year and month from the NEW row's birth_date
  retirement_year := EXTRACT(YEAR FROM NEW.birth_date) + retirement_age;
  retirement_month := EXTRACT(MONTH FROM NEW.birth_date);

  -- Get the last day of the retirement month
  last_day_of_month := (
    DATE_TRUNC('MONTH', make_date(retirement_year, retirement_month, 1))
    + INTERVAL '1 MONTH - 1 DAY'
  )::TIMESTAMPTZ;

  -- Set the retirement_date column of the NEW row
  NEW.retirement_date := last_day_of_month;

  RETURN NEW; -- Important for BEFORE triggers to return the modified row
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the erms.employee table
CREATE TRIGGER calculate_retirement_date_trigger
BEFORE INSERT OR UPDATE ON erms.employee
FOR EACH ROW
EXECUTE FUNCTION erms.calculate_retirement_date();