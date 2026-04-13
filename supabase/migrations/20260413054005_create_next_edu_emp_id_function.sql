/*
  # Create get_next_edu_emp_id function for Education Department

  Similar to get_next_emp_id but for the Education Department employee series.
  - Series starts from 160000 (instead of 140000 for general ERMS)
  - Uses numeric range comparison on the bigint emp_id column
  - Returns the next available 6-digit ID as TEXT
  - Ignores IDs outside the 160000–199999 range
*/

CREATE OR REPLACE FUNCTION get_next_edu_emp_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_id BIGINT;
  next_id BIGINT;
BEGIN
  SELECT MAX(emp_id)
  INTO max_id
  FROM erms.employee
  WHERE emp_id >= 160000
    AND emp_id <= 199999;

  IF max_id IS NULL OR max_id < 160000 THEN
    next_id := 160000;
  ELSE
    next_id := max_id + 1;
  END IF;

  IF next_id > 199999 THEN
    RAISE EXCEPTION 'Education Employee ID pool exhausted (max 160000-199999 range reached)';
  END IF;

  RETURN next_id::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION get_next_edu_emp_id() TO authenticated;
