/*
  # Fix get_next_emp_id function for bigint emp_id column

  The emp_id column is of type bigint, not text, so regex matching is not applicable.
  This version uses numeric range comparison (140000 to 999999) to find the max
  existing 6-digit ID and returns the next one as TEXT.

  - Ignores all IDs outside the 6-digit range (140000–999999)
  - Starts from 140000 if no valid 6-digit IDs exist
  - Safe for the bigint column type
*/

CREATE OR REPLACE FUNCTION get_next_emp_id()
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
  WHERE emp_id >= 140000
    AND emp_id <= 999999;

  IF max_id IS NULL OR max_id < 140000 THEN
    next_id := 140000;
  ELSE
    next_id := max_id + 1;
  END IF;

  IF next_id > 999999 THEN
    RAISE EXCEPTION 'Employee ID pool exhausted (max 6-digit limit reached)';
  END IF;

  RETURN next_id::TEXT;
END;
$$;
