/*
  # Fix Retirement Data Population Triggers

  This migration creates/fixes triggers to automatically populate retirement-related tables
  when employees are added or updated in the employee table.

  1. Triggers
    - Create trigger function to handle employee retirement data population
    - Create triggers on employee table for INSERT and UPDATE
    - Populate employee_retirement table automatically
    - Update retirement progress, pay commission, and group insurance tables

  2. Functions
    - handle_employee_retirement_data() - Main trigger function
    - populate_retirement_tables() - Helper function to populate related tables
*/

-- Drop existing triggers and functions if they exist
DROP TRIGGER IF EXISTS employee_retirement_trigger ON employee;
DROP FUNCTION IF EXISTS handle_employee_retirement_data();
DROP FUNCTION IF EXISTS populate_retirement_tables();

-- Create function to handle retirement data population
CREATE OR REPLACE FUNCTION handle_employee_retirement_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update employee_retirement record
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
    updated_at = NOW();

  -- Only create retirement progress record if employee has retirement date
  IF NEW.retirement_date IS NOT NULL THEN
    -- Insert or update retirement progress record
    INSERT INTO retirement_progress (
      emp_id,
      employee_name,
      retirement_date,
      assigned_clerk,
      department,
      age,
      created_at,
      updated_at
    )
    VALUES (
      NEW.emp_id,
      NEW.employee_name,
      NEW.retirement_date,
      NEW.assigned_clerk,
      (SELECT department FROM department WHERE dept_id = NEW.dept_id),
      NEW.age,
      NOW(),
      NOW()
    )
    ON CONFLICT (emp_id)
    DO UPDATE SET
      employee_name = NEW.employee_name,
      retirement_date = NEW.retirement_date,
      assigned_clerk = NEW.assigned_clerk,
      department = (SELECT department FROM department WHERE dept_id = NEW.dept_id),
      age = NEW.age,
      updated_at = NOW();

    -- Insert or update pay commission record
    INSERT INTO pay_comission (
      emp_id,
      employee_name,
      retirement_date,
      assigned_clerk,
      department,
      age,
      created_at,
      updated_at
    )
    VALUES (
      NEW.emp_id,
      NEW.employee_name,
      NEW.retirement_date,
      NEW.assigned_clerk,
      (SELECT department FROM department WHERE dept_id = NEW.dept_id),
      NEW.age,
      NOW(),
      NOW()
    )
    ON CONFLICT (emp_id)
    DO UPDATE SET
      employee_name = NEW.employee_name,
      retirement_date = NEW.retirement_date,
      assigned_clerk = NEW.assigned_clerk,
      department = (SELECT department FROM department WHERE dept_id = NEW.dept_id),
      age = NEW.age,
      updated_at = NOW();

    -- Insert or update group insurance record
    INSERT INTO group_insurance (
      emp_id,
      employee_name,
      retirement_date,
      assigned_clerk,
      department,
      age,
      created_at,
      updated_at
    )
    VALUES (
      NEW.emp_id,
      NEW.employee_name,
      NEW.retirement_date,
      NEW.assigned_clerk,
      (SELECT department FROM department WHERE dept_id = NEW.dept_id),
      NEW.age,
      NOW(),
      NOW()
    )
    ON CONFLICT (emp_id)
    DO UPDATE SET
      employee_name = NEW.employee_name,
      retirement_date = NEW.retirement_date,
      assigned_clerk = NEW.assigned_clerk,
      department = (SELECT department FROM department WHERE dept_id = NEW.dept_id),
      age = NEW.age,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on employee table
CREATE TRIGGER employee_retirement_trigger
  AFTER INSERT OR UPDATE ON employee
  FOR EACH ROW
  EXECUTE FUNCTION handle_employee_retirement_data();

-- Create function to populate existing employee data
CREATE OR REPLACE FUNCTION populate_existing_retirement_data()
RETURNS void AS $$
DECLARE
  emp_record RECORD;
BEGIN
  -- Loop through all employees and populate retirement data
  FOR emp_record IN 
    SELECT * FROM employee 
  LOOP
    -- Trigger the function for existing employees
    PERFORM handle_employee_retirement_data() FROM (
      SELECT emp_record.* 
    ) AS NEW;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Populate data for existing employees
SELECT populate_existing_retirement_data();

-- Drop the temporary function
DROP FUNCTION populate_existing_retirement_data();

-- Create function to update retirement statuses based on progress
CREATE OR REPLACE FUNCTION update_retirement_statuses()
RETURNS void AS $$
BEGIN
  -- Update retirement_progress_status based on retirement_progress table completion
  UPDATE employee_retirement 
  SET retirement_progress_status = CASE
    WHEN EXISTS (
      SELECT 1 FROM retirement_progress rp 
      WHERE rp.emp_id = employee_retirement.emp_id 
      AND rp.birth_certificate IS NOT NULL 
      AND rp.medical_certificate IS NOT NULL
      AND rp.nomination IS NOT NULL
      AND rp.permanent_registration IS NOT NULL
      AND rp.computer_exam IS NOT NULL
      AND rp.language_exam IS NOT NULL
      AND rp.post_service_exam IS NOT NULL
      AND rp.verification IS NOT NULL
    ) THEN 'completed'
    WHEN EXISTS (
      SELECT 1 FROM retirement_progress rp 
      WHERE rp.emp_id = employee_retirement.emp_id 
      AND (rp.birth_certificate IS NOT NULL 
           OR rp.medical_certificate IS NOT NULL
           OR rp.nomination IS NOT NULL
           OR rp.permanent_registration IS NOT NULL
           OR rp.computer_exam IS NOT NULL
           OR rp.language_exam IS NOT NULL
           OR rp.post_service_exam IS NOT NULL
           OR rp.verification IS NOT NULL)
    ) THEN 'in_progress'
    ELSE 'pending'
  END;

  -- Update pay_commission_status based on pay_comission table completion
  UPDATE employee_retirement 
  SET pay_commission_status = CASE
    WHEN EXISTS (
      SELECT 1 FROM pay_comission pc 
      WHERE pc.emp_id = employee_retirement.emp_id 
      AND pc.fourth_pay_comission IS NOT NULL 
      AND pc.fifth_pay_comission IS NOT NULL
      AND pc.sixth_pay_comission IS NOT NULL
      AND pc.seventh_pay_comission IS NOT NULL
    ) THEN 'completed'
    WHEN EXISTS (
      SELECT 1 FROM pay_comission pc 
      WHERE pc.emp_id = employee_retirement.emp_id 
      AND (pc.fourth_pay_comission IS NOT NULL 
           OR pc.fifth_pay_comission IS NOT NULL
           OR pc.sixth_pay_comission IS NOT NULL
           OR pc.seventh_pay_comission IS NOT NULL)
    ) THEN 'in_progress'
    ELSE 'pending'
  END;

  -- Update group_insurance_status based on group_insurance table completion
  UPDATE employee_retirement 
  SET group_insurance_status = CASE
    WHEN EXISTS (
      SELECT 1 FROM group_insurance gi 
      WHERE gi.emp_id = employee_retirement.emp_id 
      AND gi.year_1990 IS NOT NULL 
      AND gi.year_2003 IS NOT NULL
      AND gi.year_2010 IS NOT NULL
      AND gi.year_2020 IS NOT NULL
    ) THEN 'completed'
    WHEN EXISTS (
      SELECT 1 FROM group_insurance gi 
      WHERE gi.emp_id = employee_retirement.emp_id 
      AND (gi.year_1990 IS NOT NULL 
           OR gi.year_2003 IS NOT NULL
           OR gi.year_2010 IS NOT NULL
           OR gi.year_2020 IS NOT NULL)
    ) THEN 'in_progress'
    ELSE 'pending'
  END;
END;
$$ LANGUAGE plpgsql;

-- Run the status update function
SELECT update_retirement_statuses();

-- Create triggers to update statuses when related tables are modified
CREATE OR REPLACE FUNCTION update_retirement_status_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the corresponding employee_retirement status
  PERFORM update_retirement_statuses();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers on related tables
DROP TRIGGER IF EXISTS retirement_progress_status_trigger ON retirement_progress;
CREATE TRIGGER retirement_progress_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON retirement_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_retirement_status_trigger();

DROP TRIGGER IF EXISTS pay_commission_status_trigger ON pay_comission;
CREATE TRIGGER pay_commission_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON pay_comission
  FOR EACH ROW
  EXECUTE FUNCTION update_retirement_status_trigger();

DROP TRIGGER IF EXISTS group_insurance_status_trigger ON group_insurance;
CREATE TRIGGER group_insurance_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON group_insurance
  FOR EACH ROW
  EXECUTE FUNCTION update_retirement_status_trigger();