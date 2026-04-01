/*
  # Update Employee Retirement Consolidated View - Add Clerk Name

  1. Changes
    - Add assigned_clerk_name column by joining with public.user_roles table
    - Keep all existing columns and functionality

  2. New Column
    - assigned_clerk_name: Name of the assigned clerk (from user_roles table)

  3. Join Strategy
    - LEFT JOIN with public.user_roles to get clerk name based on assigned_clerk UUID
*/

-- Drop existing view
DROP VIEW IF EXISTS erms.employee_retirement_consolidated_view;

-- Recreate the view with clerk name
CREATE VIEW erms.employee_retirement_consolidated_view AS
SELECT 
  e.emp_id,
  e.employee_name,
  COALESCE(e."Shalarth_Id", e.panchayatrajsevarth_id) AS shalarth_sevarthid,
  d.department,
  ol.name AS current_office_name,
  t.name AS taluka,
  des.designation,
  e.assigned_clerk,
  ur.name AS assigned_clerk_name,
  er.status,
  er.pay_commission_status,
  er.group_insurance_status,
  e.retirement_date,
  e.date_of_birth,
  e.reason AS retirement_reason,
  e.gender,
  e."Cadre" AS cadre,
  e.date_of_joining,
  er.type_of_pension,
  er.retirement_progress_status
FROM 
  erms.employee e
INNER JOIN 
  erms.employee_retirement er ON e.emp_id = er.emp_id
LEFT JOIN 
  erms.department d ON e.dept_id = d.dept_id
LEFT JOIN 
  erms.office_locations ol ON e.office_id = ol.office_id
LEFT JOIN 
  erms.talukas t ON e.tal_id = t.tal_id
LEFT JOIN 
  erms.designations des ON e.designation_id = des.designation_id
LEFT JOIN 
  public.user_roles ur ON e.assigned_clerk::uuid = ur.user_id
LEFT JOIN 
  erms.retirement_progress rp ON e.emp_id = rp.emp_id
LEFT JOIN 
  erms.group_insurance gi ON e.emp_id = gi.emp_id
LEFT JOIN 
  erms.pay_commission pc ON e.emp_id = pc.emp_id;

-- Grant SELECT permission to authenticated users
GRANT SELECT ON erms.employee_retirement_consolidated_view TO authenticated;

-- Add comment to the view
COMMENT ON VIEW erms.employee_retirement_consolidated_view IS 
'Consolidated view combining employee data with retirement, progress, insurance, and commission information for reporting purposes. Includes clerk name from user_roles table.';
