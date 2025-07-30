/*
  # Add tal_id foreign key to employee table

  1. Changes
    - Add `tal_id` column to `erms.employee` table
    - Create foreign key constraint linking to `erms.talukas` table
    - Add index for better query performance

  2. Security
    - No RLS changes needed (inherits existing policies)
*/

-- Add tal_id column to employee table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'erms' 
    AND table_name = 'employee' 
    AND column_name = 'tal_id'
  ) THEN
    ALTER TABLE erms.employee ADD COLUMN tal_id text;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'erms'
    AND table_name = 'employee'
    AND constraint_name = 'employee_tal_id_fkey'
  ) THEN
    ALTER TABLE erms.employee 
    ADD CONSTRAINT employee_tal_id_fkey 
    FOREIGN KEY (tal_id) REFERENCES erms.talukas(tal_id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Add index for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'erms'
    AND tablename = 'employee'
    AND indexname = 'idx_employee_tal_id'
  ) THEN
    CREATE INDEX idx_employee_tal_id ON erms.employee(tal_id);
  END IF;
END $$;