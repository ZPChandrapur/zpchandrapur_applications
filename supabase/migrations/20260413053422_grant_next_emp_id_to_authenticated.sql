/*
  # Grant execute on get_next_emp_id to authenticated users

  Allows authenticated users (clerks, officers) to call the function via RPC.
*/

GRANT EXECUTE ON FUNCTION get_next_emp_id() TO authenticated;
