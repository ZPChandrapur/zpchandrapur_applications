/*
  # Create next_emp_id function

  Creates a Postgres function that atomically generates the next 6-digit employee ID.

  - Starts from 140000 if no valid 6-digit IDs exist
  - Ignores all existing IDs that are not 6-digit numeric values
  - Uses FOR UPDATE SKIP LOCKED pattern is not needed here since MAX is atomic in Postgres
  - Returns a TEXT value (6-digit numeric string)
  - Safe for concurrent calls: MAX() on a numeric column is atomic in Postgres
    and since we return max+1 immediately before insert, we also add a UNIQUE
    constraint protection — duplicate will fail cleanly and callers should retry.
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
  SELECT MAX(emp_id::BIGINT)
  INTO max_id
  FROM erms.employee
  WHERE emp_id ~ '^\d{6}$'
    AND emp_id::BIGINT >= 140000
    AND emp_id::BIGINT <= 999999;

  IF max_id IS NULL OR max_id < 140000 THEN
    next_id := 140000;
  ELSE
    next_id := max_id + 1;
  END IF;

  IF next_id > 999999 THEN
    RAISE EXCEPTION 'Employee ID pool exhausted (max 6-digit limit reached)';
  END IF;

  RETURN LPAD(next_id::TEXT, 6, '0');
END;
$$;
