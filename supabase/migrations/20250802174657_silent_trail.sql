/*
  # Create FIMS (Field Inspection Management System) Tables

  1. New Tables
    - `fims_categories` - Inspection categories
    - `fims_inspections` - Main inspection records
    - `fims_anganwadi_forms` - Anganwadi center inspection form data
    - `fims_document_forms` - Document inspection form data
    - `fims_inspection_photos` - Photos uploaded during inspections
    - `fims_assignments` - Inspection assignments and reviews

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - Users can only see their own inspections unless admin/super_admin

  3. Storage
    - Create field-visit-images bucket for photo storage
*/

-- Create FIMS categories table
CREATE TABLE IF NOT EXISTS fims_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_marathi text NOT NULL,
  description text,
  form_type text NOT NULL CHECK (form_type IN ('anganwadi', 'document')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create main inspections table
CREATE TABLE IF NOT EXISTS fims_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_number text UNIQUE NOT NULL,
  category_id uuid REFERENCES fims_categories(id),
  inspector_id uuid REFERENCES auth.users(id),
  assigned_by uuid REFERENCES auth.users(id),
  
  -- Location details
  location_name text NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  location_accuracy decimal(5, 2),
  address text,
  
  -- Inspection details
  planned_date date,
  inspection_date timestamptz,
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'reassigned')),
  
  -- Form data (JSON for flexibility)
  form_data jsonb DEFAULT '{}',
  
  -- Review and approval
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_comments text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  
  -- Compliance
  is_compliant boolean,
  non_compliance_reason text,
  requires_revisit boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Anganwadi inspection form table
CREATE TABLE IF NOT EXISTS fims_anganwadi_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid REFERENCES fims_inspections(id) ON DELETE CASCADE,
  
  -- Basic Information
  anganwadi_name text,
  anganwadi_number text,
  supervisor_name text,
  helper_name text,
  village_name text,
  
  -- Infrastructure
  building_condition text CHECK (building_condition IN ('excellent', 'good', 'average', 'poor')),
  room_availability boolean,
  toilet_facility boolean,
  drinking_water boolean,
  electricity boolean,
  kitchen_garden boolean,
  
  -- Equipment and Materials
  weighing_machine boolean,
  height_measuring_scale boolean,
  first_aid_kit boolean,
  teaching_materials boolean,
  toys_available boolean,
  
  -- Records and Documentation
  attendance_register boolean,
  growth_chart_updated boolean,
  vaccination_records boolean,
  nutrition_records boolean,
  
  -- Children Details
  total_registered_children integer DEFAULT 0,
  children_present_today integer DEFAULT 0,
  children_0_3_years integer DEFAULT 0,
  children_3_6_years integer DEFAULT 0,
  
  -- Nutrition Program
  hot_meal_served boolean,
  meal_quality text CHECK (meal_quality IN ('excellent', 'good', 'average', 'poor')),
  take_home_ration boolean,
  
  -- Health Services
  health_checkup_conducted boolean,
  immunization_updated boolean,
  vitamin_a_given boolean,
  iron_tablets_given boolean,
  
  -- Observations
  general_observations text,
  recommendations text,
  action_required text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Document inspection form table
CREATE TABLE IF NOT EXISTS fims_document_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid REFERENCES fims_inspections(id) ON DELETE CASCADE,
  
  -- Document Details
  document_type text,
  document_number text,
  document_date date,
  issuing_authority text,
  
  -- Verification Details
  document_available boolean,
  document_condition text CHECK (document_condition IN ('excellent', 'good', 'damaged', 'missing')),
  information_accurate boolean,
  signatures_present boolean,
  stamps_present boolean,
  
  -- Compliance Check
  meets_requirements boolean,
  deficiencies_found text,
  corrective_action_needed text,
  
  -- Additional Information
  remarks text,
  follow_up_required boolean,
  follow_up_date date,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inspection photos table
CREATE TABLE IF NOT EXISTS fims_inspection_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid REFERENCES fims_inspections(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  photo_name text,
  description text,
  photo_order integer DEFAULT 1,
  uploaded_at timestamptz DEFAULT now()
);

-- Create assignments table for review workflow
CREATE TABLE IF NOT EXISTS fims_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid REFERENCES fims_inspections(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id),
  assigned_by uuid REFERENCES auth.users(id),
  assignment_type text CHECK (assignment_type IN ('inspection', 'review', 'revisit')),
  due_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'rejected')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default categories
INSERT INTO fims_categories (name, name_marathi, description, form_type) VALUES
('Anganwadi Center Inspection Form', 'अंगणवाडी केंद्र तपासणी फॉर्म', 'Inspection form for Anganwadi centers', 'anganwadi'),
('Document Inspection Form', 'दस्तऐवज तपासणी प्रपत्र', 'Form for document verification and inspection', 'document')
ON CONFLICT DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE fims_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fims_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE fims_anganwadi_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fims_document_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fims_inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fims_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fims_categories
CREATE POLICY "Anyone can read categories" ON fims_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage categories" ON fims_categories FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
  WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'admin', 'developer')
));

-- RLS Policies for fims_inspections
CREATE POLICY "Users can read own inspections" ON fims_inspections FOR SELECT TO authenticated 
USING (inspector_id = auth.uid() OR assigned_by = auth.uid() OR reviewed_by = auth.uid());

CREATE POLICY "Admins can read all inspections" ON fims_inspections FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
  WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'admin', 'developer')
));

CREATE POLICY "Users can create inspections" ON fims_inspections FOR INSERT TO authenticated 
WITH CHECK (inspector_id = auth.uid());

CREATE POLICY "Users can update own inspections" ON fims_inspections FOR UPDATE TO authenticated 
USING (inspector_id = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Admins can update all inspections" ON fims_inspections FOR UPDATE TO authenticated 
USING (EXISTS (
  SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
  WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'admin', 'developer')
));

-- RLS Policies for form tables (inherit from inspections)
CREATE POLICY "Users can read own form data" ON fims_anganwadi_forms FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM fims_inspections fi 
  WHERE fi.id = inspection_id AND (fi.inspector_id = auth.uid() OR fi.assigned_by = auth.uid())
));

CREATE POLICY "Admins can read all form data" ON fims_anganwadi_forms FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
  WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'admin', 'developer')
));

CREATE POLICY "Users can manage own form data" ON fims_anganwadi_forms FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM fims_inspections fi 
  WHERE fi.id = inspection_id AND fi.inspector_id = auth.uid()
));

-- Similar policies for document forms
CREATE POLICY "Users can read own document forms" ON fims_document_forms FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM fims_inspections fi 
  WHERE fi.id = inspection_id AND (fi.inspector_id = auth.uid() OR fi.assigned_by = auth.uid())
));

CREATE POLICY "Admins can read all document forms" ON fims_document_forms FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
  WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'admin', 'developer')
));

CREATE POLICY "Users can manage own document forms" ON fims_document_forms FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM fims_inspections fi 
  WHERE fi.id = inspection_id AND fi.inspector_id = auth.uid()
));

-- RLS Policies for photos
CREATE POLICY "Users can read own inspection photos" ON fims_inspection_photos FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM fims_inspections fi 
  WHERE fi.id = inspection_id AND (fi.inspector_id = auth.uid() OR fi.assigned_by = auth.uid())
));

CREATE POLICY "Admins can read all photos" ON fims_inspection_photos FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
  WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'admin', 'developer')
));

CREATE POLICY "Users can manage own inspection photos" ON fims_inspection_photos FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM fims_inspections fi 
  WHERE fi.id = inspection_id AND fi.inspector_id = auth.uid()
));

-- RLS Policies for assignments
CREATE POLICY "Users can read own assignments" ON fims_assignments FOR SELECT TO authenticated 
USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Admins can read all assignments" ON fims_assignments FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
  WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'admin', 'developer')
));

CREATE POLICY "Admins can create assignments" ON fims_assignments FOR INSERT TO authenticated 
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
  WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'admin', 'developer', 'officer')
));

CREATE POLICY "Users can update own assignments" ON fims_assignments FOR UPDATE TO authenticated 
USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fims_inspections_inspector ON fims_inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_fims_inspections_status ON fims_inspections(status);
CREATE INDEX IF NOT EXISTS idx_fims_inspections_date ON fims_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_fims_inspections_location ON fims_inspections(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_fims_assignments_assigned_to ON fims_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_fims_photos_inspection ON fims_inspection_photos(inspection_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_fims_categories_updated_at BEFORE UPDATE ON fims_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fims_inspections_updated_at BEFORE UPDATE ON fims_inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fims_anganwadi_forms_updated_at BEFORE UPDATE ON fims_anganwadi_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fims_document_forms_updated_at BEFORE UPDATE ON fims_document_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fims_assignments_updated_at BEFORE UPDATE ON fims_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for field visit images
INSERT INTO storage.buckets (id, name, public) VALUES ('field-visit-images', 'field-visit-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for field-visit-images bucket
CREATE POLICY "Users can upload their own inspection photos" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'field-visit-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read their own inspection photos" ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'field-visit-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can read all inspection photos" ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'field-visit-images' AND EXISTS (
  SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
  WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'admin', 'developer')
));

CREATE POLICY "Users can update their own inspection photos" ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'field-visit-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own inspection photos" ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'field-visit-images' AND auth.uid()::text = (storage.foldername(name))[1]);