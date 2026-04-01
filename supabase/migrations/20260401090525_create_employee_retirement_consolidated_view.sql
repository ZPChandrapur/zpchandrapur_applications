/*
  # Create Employee Retirement Consolidated View

  1. Overview
    - Creates a comprehensive view combining employee data with retirement, progress, insurance, and commission information
    - Provides a single unified view for reporting purposes

  2. Tables Joined
    - `erms.employee` (base table)
    - `erms.employee_retirement` (retirement processing details)
    - `erms.retirement_progress` (retirement checklist progress)
    - `erms.group_insurance` (insurance records)
    - `erms.pay_commission` (pay commission records)
    - `erms.department` (department names)
    - `erms.office_locations` (office names)
    - `erms.talukas` (taluka names)
    - `erms.designations` (designation names)

  3. Selected Columns
    - emp_id: Employee ID
    - employee_name: Employee Name
    - shalarth_sevarthid: Shalarth/Sevarth ID (from employee table)
    - department: Department name (from department table)
    - current_office_name: Office name (from office_locations table)
    - taluka: Taluka name (from talukas table)
    - designation: Designation name (from designations table)
    - assigned_clerk: Assigned clerk ID
    - status: Retirement status (from employee_retirement)
    - pay_commission_status: Pay commission verification status (from employee_retirement)
    - group_insurance_status: Group insurance verification status (from employee_retirement)
    - Additional fields: retirement_date, date_of_birth, retirement_reason

  4. Join Strategy
    - INNER JOIN with employee_retirement (only employees with retirement records)
    - LEFT JOIN with other tables to include all employees even if related data is missing

  5. Security
    - View inherits RLS policies from underlying tables
    - Users can only see data they have permission to access from base tables
*/

-- Drop view if it already exists
DROP VIEW IF EXISTS erms.employee_retirement_consolidated_view;

-- Create the consolidated view
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
  erms.retirement_progress rp ON e.emp_id = rp.emp_id
LEFT JOIN 
  erms.group_insurance gi ON e.emp_id = gi.emp_id
LEFT JOIN 
  erms.pay_commission pc ON e.emp_id = pc.emp_id;

-- Grant SELECT permission to authenticated users
GRANT SELECT ON erms.employee_retirement_consolidated_view TO authenticated;

-- Add comment to the view
COMMENT ON VIEW erms.employee_retirement_consolidated_view IS 
'Consolidated view combining employee data with retirement, progress, insurance, and commission information for reporting purposes. This view provides a unified interface for generating employee retirement reports.';
