/*
  # Create report_templates table in erms schema

  1. New Tables
    - `erms.report_templates`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text, optional)
      - `report_type` (text, constrained to bar/pie/line/table)
      - `tables` (jsonb array, default empty)
      - `columns` (jsonb array, default empty)
      - `filters` (jsonb array, default empty)
      - `joins` (jsonb array, default empty)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `erms.report_templates` table
    - Add policies for users to manage their own templates only
    - Users can SELECT, INSERT, UPDATE, DELETE their own records

  3. Triggers
    - Auto-update `updated_at` timestamp on record changes
*/

-- Create erms schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS erms;

-- Create the report_templates table
CREATE TABLE IF NOT EXISTS erms.report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  report_type text NOT NULL CHECK (report_type IN ('bar', 'pie', 'line', 'table')),
  tables jsonb NOT NULL DEFAULT '[]'::jsonb,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  filters jsonb NOT NULL DEFAULT '[]'::jsonb,
  joins jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Create or update the trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_report_templates_updated_at ON erms.report_templates;
CREATE TRIGGER update_report_templates_updated_at 
  BEFORE UPDATE ON erms.report_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE erms.report_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own report templates" ON erms.report_templates;
CREATE POLICY "Users can view their own report templates" 
  ON erms.report_templates 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own report templates" ON erms.report_templates;
CREATE POLICY "Users can insert their own report templates" 
  ON erms.report_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own report templates" ON erms.report_templates;
CREATE POLICY "Users can update their own report templates" 
  ON erms.report_templates 
  FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own report templates" ON erms.report_templates;
CREATE POLICY "Users can delete their own report templates" 
  ON erms.report_templates 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_erms_report_templates_user_id ON erms.report_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_erms_report_templates_created_at ON erms.report_templates(created_at DESC);