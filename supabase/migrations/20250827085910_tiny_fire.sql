/*
  # Rewrite Retirement Data Population Triggers

  This migration rewrites triggers to automatically populate retirement-related tables
  based on the retirement dashboard structure and requirements.

  1. Analysis of Retirement Dashboard:
    - Uses employee_retirement as main table
    - Fetches data from retirement_progress, pay_comission, group_insurance
    - Status columns: retirement_progress_status, pay_commission_status, group_insurance_status
    - Matches records by emp_id across all tables

  2. Improved Triggers:
    - Better field mapping from employee table
    - Proper status calculation logic
    - Handles all retirement dashboard fields
    - Optimized for dashboard performance
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS employee_retirement_trigger ON employee;
DROP TRIGGER IF EXISTS retirement_progress_status_trigger ON retirement_progress;
DROP TRIGGER IF EXISTS pay_commission_status_trigger ON pay_comission;
DROP TRIGGER IF EXISTS group_insurance_status_trigger ON group_insurance;

DROP FUNCTION IF EXISTS handle_employee_retirement_data();
DROP FUNCTION IF EXISTS update_retirement_statuses();
DROP FUNCTION IF EXISTS update_retirement_status_trigger();

-- Create main trigger function for employee table
CREATE OR REPLACE FUNCTION handle_employee_retirement_data()
RETURNS TRIGGER AS $$
DECLARE
  dept_name TEXT;
BEGIN
  -- Get department name
  SELECT department INTO dept_name 
  FROM department 
  WHERE dept_id = NEW.dept_id;

  -- Insert or update employee_retirement record (main dashboard table)
  INSERT INTO employee_retirement (
    emp_id,
    employee_name,
    date_of_birth,
    age,
    retirement_date,
    reason,
    assigned_clerk,
    dept_id,
    office_id,
    designation,
    department,
    status,
    retirement_progress_status,
    pay_commission_status,
    group_insurance_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.emp_id,
    NEW.employee_name,
    NEW.date_of_birth,
    NEW.age,
    NEW.retirement_date,
    NEW.reason,
    NEW.assigned_clerk,
    NEW.dept_id,
    NEW.office_id,
    NEW.designation,
    dept_name,
    CASE 
      WHEN NEW.retirement_date IS NOT NULL THEN 'pending'
      ELSE 'not_applicable'
    END,
    'pending',
    'pending',
    'pending',
    NOW(),
    NOW()
  )
  ON CONFLICT (emp_id) 
  DO UPDATE SET
    employee_name = NEW.employee_name,
    date_of_birth = NEW.date_of_birth,
    age = NEW.age,
    retirement_date = NEW.retirement_date,
    reason = NEW.reason,
    assigned_clerk = NEW.assigned_clerk,
    dept_id = NEW.dept_id,
    office_id = NEW.office_id,
    designation = NEW.designation,
    department = dept_name,
    status = CASE 
      WHEN NEW.retirement_date IS NOT NULL THEN employee_retirement.status
      ELSE 'not_applicable'
    END,
    updated_at = NOW();

  -- Only create related records if employee has retirement date
  IF NEW.retirement_date IS NOT NULL THEN
    
    -- Insert retirement_progress record
    INSERT INTO retirement_progress (
      emp_id,
      employee_name,
      retirement_date,
      assigned_clerk,
      department,
      age,
      birth_certificate,
      medical_certificate,
      nomination,
      permanent_registration,
      computer_exam,
      language_exam,
      post_service_exam,
      verification,
      date_of_birth_verification,
      computer_exam_passed,
      marathi_hindi_exam_exemption,
      verification_completed,
      undertaking_taken,
      no_objection_certificate,
      retirement_order,
      birth_certificate_submitted,
      birth_document_submitted,
      overall_comment,
      created_at,
      updated_at
    )
    VALUES (
      NEW.emp_id,
      NEW.employee_name,
      NEW.retirement_date,
      NEW.assigned_clerk,
      dept_name,
      NEW.age,
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (emp_id)
    DO UPDATE SET
      employee_name = NEW.employee_name,
      retirement_date = NEW.retirement_date,
      assigned_clerk = NEW.assigned_clerk,
      department = dept_name,
      age = NEW.age,
      updated_at = NOW();

    -- Insert pay_comission record
    INSERT INTO pay_comission (
      emp_id,
      employee_name,
      retirement_date,
      assigned_clerk,
      department,
      age,
      fourth_pay_comission,
      fifth_pay_comission,
      sixth_pay_comission,
      seventh_pay_comission,
      fourth_pay_comission_comment,
      fifth_pay_comission_comment,
      sixth_pay_comission_comment,
      seventh_pay_comission_comment,
      fourth_pay_comission_date,
      fifth_pay_comission_date,
      sixth_pay_comission_date,
      seventh_pay_comission_date,
      comments,
      last_updated,
      created_at,
      updated_at
    )
    VALUES (
      NEW.emp_id,
      NEW.employee_name,
      NEW.retirement_date,
      NEW.assigned_clerk,
      dept_name,
      NEW.age,
      NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL,
      NULL, NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (emp_id)
    DO UPDATE SET
      employee_name = NEW.employee_name,
      retirement_date = NEW.retirement_date,
      assigned_clerk = NEW.assigned_clerk,
      department = dept_name,
      age = NEW.age,
      updated_at = NOW();

    -- Insert group_insurance record
    INSERT INTO group_insurance (
      emp_id,
      employee_name,
      retirement_date,
      assigned_clerk,
      department,
      age,
      year_1990,
      year_2003,
      year_2010,
      year_2020,
      year_1990_comment,
      year_2003_comment,
      year_2010_comment,
      year_2020_comment,
      year_1990_date,
      year_2003_date,
      year_2010_date,
      year_2020_date,
      overall_comments,
      last_updated,
      created_at,
      updated_at
    )
    VALUES (
      NEW.emp_id,
      NEW.employee_name,
      NEW.retirement_date,
      NEW.assigned_clerk,
      dept_name,
      NEW.age,
      NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL,
      NULL, NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (emp_id)
    DO UPDATE SET
      employee_name = NEW.employee_name,
      retirement_date = NEW.retirement_date,
      assigned_clerk = NEW.assigned_clerk,
      department = dept_name,
      age = NEW.age,
      updated_at = NOW();

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create optimized function to calculate and update retirement statuses
CREATE OR REPLACE FUNCTION calculate_retirement_statuses(target_emp_id TEXT DEFAULT NULL)
RETURNS void AS $$
DECLARE
  emp_filter TEXT := '';
BEGIN
  -- Add employee filter if specified
  IF target_emp_id IS NOT NULL THEN
    emp_filter := ' AND emp_id = ' || quote_literal(target_emp_id);
  END IF;

  -- Update retirement_progress_status
  EXECUTE format('
    UPDATE employee_retirement 
    SET retirement_progress_status = CASE
      WHEN EXISTS (
        SELECT 1 FROM retirement_progress rp 
        WHERE rp.emp_id = employee_retirement.emp_id 
        AND COALESCE(rp.birth_certificate, '''') != ''''
        AND COALESCE(rp.medical_certificate, '''') != ''''
        AND COALESCE(rp.nomination, '''') != ''''
        AND COALESCE(rp.permanent_registration, '''') != ''''
        AND COALESCE(rp.computer_exam, '''') != ''''
        AND COALESCE(rp.language_exam, '''') != ''''
        AND COALESCE(rp.post_service_exam, '''') != ''''
        AND COALESCE(rp.verification, '''') != ''''
      ) THEN ''completed''
      WHEN EXISTS (
        SELECT 1 FROM retirement_progress rp 
        WHERE rp.emp_id = employee_retirement.emp_id 
        AND (COALESCE(rp.birth_certificate, '''') != ''''
             OR COALESCE(rp.medical_certificate, '''') != ''''
             OR COALESCE(rp.nomination, '''') != ''''
             OR COALESCE(rp.permanent_registration, '''') != ''''
             OR COALESCE(rp.computer_exam, '''') != ''''
             OR COALESCE(rp.language_exam, '''') != ''''
             OR COALESCE(rp.post_service_exam, '''') != ''''
             OR COALESCE(rp.verification, '''') != '''')
      ) THEN ''in_progress''
      ELSE ''pending''
    END,
    updated_at = NOW()
    WHERE retirement_date IS NOT NULL%s', emp_filter);

  -- Update pay_commission_status
  EXECUTE format('
    UPDATE employee_retirement 
    SET pay_commission_status = CASE
      WHEN EXISTS (
        SELECT 1 FROM pay_comission pc 
        WHERE pc.emp_id = employee_retirement.emp_id 
        AND COALESCE(pc.fourth_pay_comission, '''') != ''''
        AND COALESCE(pc.fifth_pay_comission, '''') != ''''
        AND COALESCE(pc.sixth_pay_comission, '''') != ''''
        AND COALESCE(pc.seventh_pay_comission, '''') != ''''
      ) THEN ''completed''
      WHEN EXISTS (
        SELECT 1 FROM pay_comission pc 
        WHERE pc.emp_id = employee_retirement.emp_id 
        AND (COALESCE(pc.fourth_pay_comission, '''') != ''''
             OR COALESCE(pc.fifth_pay_comission, '''') != ''''
             OR COALESCE(pc.sixth_pay_comission, '''') != ''''
             OR COALESCE(pc.seventh_pay_comission, '''') != '''')
      ) THEN ''in_progress''
      ELSE ''pending''
    END,
    updated_at = NOW()
    WHERE retirement_date IS NOT NULL%s', emp_filter);

  -- Update group_insurance_status
  EXECUTE format('
    UPDATE employee_retirement 
    SET group_insurance_status = CASE
      WHEN EXISTS (
        SELECT 1 FROM group_insurance gi 
        WHERE gi.emp_id = employee_retirement.emp_id 
        AND COALESCE(gi.year_1990, '''') != ''''
        AND COALESCE(gi.year_2003, '''') != ''''
        AND COALESCE(gi.year_2010, '''') != ''''
        AND COALESCE(gi.year_2020, '''') != ''''
      ) THEN ''completed''
      WHEN EXISTS (
        SELECT 1 FROM group_insurance gi 
        WHERE gi.emp_id = employee_retirement.emp_id 
        AND (COALESCE(gi.year_1990, '''') != ''''
             OR COALESCE(gi.year_2003, '''') != ''''
             OR COALESCE(gi.year_2010, '''') != ''''
             OR COALESCE(gi.year_2020, '''') != '''')
      ) THEN ''in_progress''
      ELSE ''pending''
    END,
    updated_at = NOW()
    WHERE retirement_date IS NOT NULL%s', emp_filter);

END;
$$ LANGUAGE plpgsql;

-- Create trigger function for status updates
CREATE OR REPLACE FUNCTION update_retirement_status_trigger()
RETURNS TRIGGER AS $$
DECLARE
  emp_id_to_update TEXT;
BEGIN
  -- Get the employee ID from the modified record
  emp_id_to_update := COALESCE(NEW.emp_id, OLD.emp_id);
  
  -- Update status for this specific employee
  PERFORM calculate_retirement_statuses(emp_id_to_update);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on employee table
CREATE TRIGGER employee_retirement_trigger
  AFTER INSERT OR UPDATE ON employee
  FOR EACH ROW
  EXECUTE FUNCTION handle_employee_retirement_data();

-- Create triggers on related tables to update statuses
CREATE TRIGGER retirement_progress_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON retirement_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_retirement_status_trigger();

CREATE TRIGGER pay_commission_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON pay_comission
  FOR EACH ROW
  EXECUTE FUNCTION update_retirement_status_trigger();

CREATE TRIGGER group_insurance_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON group_insurance
  FOR EACH ROW
  EXECUTE FUNCTION update_retirement_status_trigger();

-- Populate data for existing employees
DO $$
DECLARE
  emp_record RECORD;
BEGIN
  -- Process existing employees
  FOR emp_record IN 
    SELECT * FROM employee 
  LOOP
    -- Create a temporary NEW record for the trigger function
    PERFORM handle_employee_retirement_data() 
    FROM (SELECT emp_record.*) AS t;
  END LOOP;
  
  -- Calculate initial statuses for all employees
  PERFORM calculate_retirement_statuses();
  
  RAISE NOTICE 'Retirement data population completed for existing employees';
END;
$$;