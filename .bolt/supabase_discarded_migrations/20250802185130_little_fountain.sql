/*
  # Move FIMS tables to fims schema

  1. Schema Creation
    - Create `fims` schema
    - Move all FIMS-related tables from public to fims schema

  2. Tables to Move
    - `fims_categories`
    - `fims_inspections`
    - `fims_anganwadi_forms`
    - `fims_document_forms`
    - `fims_inspection_photos`
    - `fims_assignments`

  3. Security
    - Recreate all RLS policies in the new schema
    - Maintain all existing permissions and constraints
*/

-- Create fims schema
CREATE SCHEMA IF NOT EXISTS fims;

-- Move fims_categories table
CREATE TABLE IF NOT EXISTS fims.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_marathi text NOT NULL,
  description text,
  form_type text NOT NULL CHECK (form_type = ANY (ARRAY['anganwadi'::text, 'document'::text])),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Move fims_inspections table
CREATE TABLE IF NOT EXISTS fims.inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_number text UNIQUE NOT NULL,
  category_id uuid REFERENCES fims.categories(id),
  inspector_id uuid REFERENCES public.users(id),
  assigned_by uuid REFERENCES public.users(id),
  location_name text NOT NULL,
  latitude numeric(10,8),
  longitude numeric(11,8),
  location_accuracy numeric(5,2),
  address text,
  planned_date date,
  inspection_date timestamptz,
  status text DEFAULT 'planned' CHECK (status = ANY (ARRAY['planned'::text, 'in_progress'::text, 'draft'::text, 'submitted'::text, 'under_review'::text, 'approved'::text, 'rejected'::text, 'reassigned'::text])),
  form_data jsonb DEFAULT '{}',
  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamptz,
  review_comments text,
  approved_by uuid REFERENCES public.users(id),
  approved_at timestamptz,
  is_compliant boolean,
  non_compliance_reason text,
  requires_revisit boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Move fims_anganwadi_forms table
CREATE TABLE IF NOT EXISTS fims.anganwadi_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid REFERENCES fims.inspections(id) ON DELETE CASCADE,
  anganwadi_name text,
  anganwadi_number text,
  supervisor_name text,
  helper_name text,
  village_name text,
  building_condition text CHECK (building_condition = ANY (ARRAY['excellent'::text, 'good'::text, 'average'::text, 'poor'::text])),
  room_availability boolean,
  toilet_facility boolean,
  drinking_water boolean,
  electricity boolean,
  kitchen_garden boolean,
  weighing_machine boolean,
  height_measuring_scale boolean,
  first_aid_kit boolean,
  teaching_materials boolean,
  toys_available boolean,
  attendance_register boolean,
  growth_chart_updated boolean,
  vaccination_records boolean,
  nutrition_records boolean,
  total_registered_children integer DEFAULT 0,
  children_present_today integer DEFAULT 0,
  children_0_3_years integer DEFAULT 0,
  children_3_6_years integer DEFAULT 0,
  hot_meal_served boolean,
  meal_quality text CHECK (meal_quality = ANY (ARRAY['excellent'::text, 'good'::text, 'average'::text, 'poor'::text])),
  take_home_ration boolean,
  health_checkup_conducted boolean,
  immunization_updated boolean,
  vitamin_a_given boolean,
  iron_tablets_given boolean,
  general_observations text,
  recommendations text,
  action_required text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Move fims_document_forms table
CREATE TABLE IF NOT EXISTS fims.document_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid REFERENCES fims.inspections(id) ON DELETE CASCADE,
  document_type text,
  document_number text,
  document_date date,
  issuing_authority text,
  document_available boolean,
  document_condition text CHECK (document_condition = ANY (ARRAY['excellent'::text, 'good'::text, 'damaged'::text, 'missing'::text])),
  information_accurate boolean,
  signatures_present boolean,
  stamps_present boolean,
  meets_requirements boolean,
  deficiencies_found text,
  corrective_action_needed text,
  remarks text,
  follow_up_required boolean,
  follow_up_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Move fims_inspection_photos table
CREATE TABLE IF NOT EXISTS fims.inspection_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid REFERENCES fims.inspections(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  photo_name text,
  description text,
  photo_order integer DEFAULT 1,
  uploaded_at timestamptz DEFAULT now()
);

-- Move fims_assignments table
CREATE TABLE IF NOT EXISTS fims.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid REFERENCES fims.inspections(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES public.users(id),
  assigned_by uuid REFERENCES public.users(id),
  assignment_type text CHECK (assignment_type = ANY (ARRAY['inspection'::text, 'review'::text, 'revisit'::text])),
  due_date date,
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'completed'::text, 'rejected'::text])),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fims_inspections_date ON fims.inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_fims_inspections_inspector ON fims.inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_fims_inspections_location ON fims.inspections(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_fims_inspections_status ON fims.inspections(status);
CREATE INDEX IF NOT EXISTS idx_fims_photos_inspection ON fims.inspection_photos(inspection_id);
CREATE INDEX IF NOT EXISTS idx_fims_assignments_assigned_to ON fims.assignments(assigned_to);

-- Enable RLS on all tables
ALTER TABLE fims.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fims.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE fims.anganwadi_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fims.document_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fims.inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fims.assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categories
CREATE POLICY "Anyone can read categories" ON fims.categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage categories" ON fims.categories
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name = ANY (ARRAY['super_admin'::text, 'admin'::text, 'developer'::text])
  ));

-- Create RLS policies for inspections
CREATE POLICY "Users can read own inspections" ON fims.inspections
  FOR SELECT TO authenticated
  USING (inspector_id = auth.uid() OR assigned_by = auth.uid() OR reviewed_by = auth.uid());

CREATE POLICY "Admins can read all inspections" ON fims.inspections
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name = ANY (ARRAY['super_admin'::text, 'admin'::text, 'developer'::text])
  ));

CREATE POLICY "Users can create inspections" ON fims.inspections
  FOR INSERT TO authenticated
  WITH CHECK (inspector_id = auth.uid());

CREATE POLICY "Users can update own inspections" ON fims.inspections
  FOR UPDATE TO authenticated
  USING (inspector_id = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Admins can update all inspections" ON fims.inspections
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name = ANY (ARRAY['super_admin'::text, 'admin'::text, 'developer'::text])
  ));

-- Create RLS policies for anganwadi forms
CREATE POLICY "Users can manage own form data" ON fims.anganwadi_forms
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM fims.inspections fi
    WHERE fi.id = fims.anganwadi_forms.inspection_id 
    AND fi.inspector_id = auth.uid()
  ));

CREATE POLICY "Users can read own form data" ON fims.anganwadi_forms
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM fims.inspections fi
    WHERE fi.id = fims.anganwadi_forms.inspection_id 
    AND (fi.inspector_id = auth.uid() OR fi.assigned_by = auth.uid())
  ));

CREATE POLICY "Admins can read all form data" ON fims.anganwadi_forms
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name = ANY (ARRAY['super_admin'::text, 'admin'::text, 'developer'::text])
  ));

-- Create RLS policies for document forms
CREATE POLICY "Users can manage own document forms" ON fims.document_forms
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM fims.inspections fi
    WHERE fi.id = fims.document_forms.inspection_id 
    AND fi.inspector_id = auth.uid()
  ));

CREATE POLICY "Users can read own document forms" ON fims.document_forms
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM fims.inspections fi
    WHERE fi.id = fims.document_forms.inspection_id 
    AND (fi.inspector_id = auth.uid() OR fi.assigned_by = auth.uid())
  ));

CREATE POLICY "Admins can read all document forms" ON fims.document_forms
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name = ANY (ARRAY['super_admin'::text, 'admin'::text, 'developer'::text])
  ));

-- Create RLS policies for inspection photos
CREATE POLICY "Users can manage own inspection photos" ON fims.inspection_photos
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM fims.inspections fi
    WHERE fi.id = fims.inspection_photos.inspection_id 
    AND fi.inspector_id = auth.uid()
  ));

CREATE POLICY "Users can read own inspection photos" ON fims.inspection_photos
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM fims.inspections fi
    WHERE fi.id = fims.inspection_photos.inspection_id 
    AND (fi.inspector_id = auth.uid() OR fi.assigned_by = auth.uid())
  ));

CREATE POLICY "Admins can read all photos" ON fims.inspection_photos
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name = ANY (ARRAY['super_admin'::text, 'admin'::text, 'developer'::text])
  ));

-- Create RLS policies for assignments
CREATE POLICY "Users can read own assignments" ON fims.assignments
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Users can update own assignments" ON fims.assignments
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Admins can create assignments" ON fims.assignments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name = ANY (ARRAY['super_admin'::text, 'admin'::text, 'developer'::text, 'officer'::text])
  ));

CREATE POLICY "Admins can read all assignments" ON fims.assignments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name = ANY (ARRAY['super_admin'::text, 'admin'::text, 'developer'::text])
  ));

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION fims.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fims_categories_updated_at
  BEFORE UPDATE ON fims.categories
  FOR EACH ROW EXECUTE FUNCTION fims.update_updated_at_column();

CREATE TRIGGER update_fims_inspections_updated_at
  BEFORE UPDATE ON fims.inspections
  FOR EACH ROW EXECUTE FUNCTION fims.update_updated_at_column();

CREATE TRIGGER update_fims_anganwadi_forms_updated_at
  BEFORE UPDATE ON fims.anganwadi_forms
  FOR EACH ROW EXECUTE FUNCTION fims.update_updated_at_column();

CREATE TRIGGER update_fims_document_forms_updated_at
  BEFORE UPDATE ON fims.document_forms
  FOR EACH ROW EXECUTE FUNCTION fims.update_updated_at_column();

CREATE TRIGGER update_fims_assignments_updated_at
  BEFORE UPDATE ON fims.assignments
  FOR EACH ROW EXECUTE FUNCTION fims.update_updated_at_column();

-- Migrate existing data if tables exist in public schema
DO $$
BEGIN
  -- Migrate categories
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fims_categories') THEN
    INSERT INTO fims.categories (id, name, name_marathi, description, form_type, is_active, created_at, updated_at)
    SELECT id, name, name_marathi, description, form_type, is_active, created_at, updated_at
    FROM public.fims_categories
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Migrate inspections
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fims_inspections') THEN
    INSERT INTO fims.inspections (id, inspection_number, category_id, inspector_id, assigned_by, location_name, latitude, longitude, location_accuracy, address, planned_date, inspection_date, status, form_data, reviewed_by, reviewed_at, review_comments, approved_by, approved_at, is_compliant, non_compliance_reason, requires_revisit, created_at, updated_at)
    SELECT id, inspection_number, category_id, inspector_id, assigned_by, location_name, latitude, longitude, location_accuracy, address, planned_date, inspection_date, status, form_data, reviewed_by, reviewed_at, review_comments, approved_by, approved_at, is_compliant, non_compliance_reason, requires_revisit, created_at, updated_at
    FROM public.fims_inspections
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Migrate anganwadi forms
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fims_anganwadi_forms') THEN
    INSERT INTO fims.anganwadi_forms (id, inspection_id, anganwadi_name, anganwadi_number, supervisor_name, helper_name, village_name, building_condition, room_availability, toilet_facility, drinking_water, electricity, kitchen_garden, weighing_machine, height_measuring_scale, first_aid_kit, teaching_materials, toys_available, attendance_register, growth_chart_updated, vaccination_records, nutrition_records, total_registered_children, children_present_today, children_0_3_years, children_3_6_years, hot_meal_served, meal_quality, take_home_ration, health_checkup_conducted, immunization_updated, vitamin_a_given, iron_tablets_given, general_observations, recommendations, action_required, created_at, updated_at)
    SELECT id, inspection_id, anganwadi_name, anganwadi_number, supervisor_name, helper_name, village_name, building_condition, room_availability, toilet_facility, drinking_water, electricity, kitchen_garden, weighing_machine, height_measuring_scale, first_aid_kit, teaching_materials, toys_available, attendance_register, growth_chart_updated, vaccination_records, nutrition_records, total_registered_children, children_present_today, children_0_3_years, children_3_6_years, hot_meal_served, meal_quality, take_home_ration, health_checkup_conducted, immunization_updated, vitamin_a_given, iron_tablets_given, general_observations, recommendations, action_required, created_at, updated_at
    FROM public.fims_anganwadi_forms
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Migrate document forms
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fims_document_forms') THEN
    INSERT INTO fims.document_forms (id, inspection_id, document_type, document_number, document_date, issuing_authority, document_available, document_condition, information_accurate, signatures_present, stamps_present, meets_requirements, deficiencies_found, corrective_action_needed, remarks, follow_up_required, follow_up_date, created_at, updated_at)
    SELECT id, inspection_id, document_type, document_number, document_date, issuing_authority, document_available, document_condition, information_accurate, signatures_present, stamps_present, meets_requirements, deficiencies_found, corrective_action_needed, remarks, follow_up_required, follow_up_date, created_at, updated_at
    FROM public.fims_document_forms
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Migrate inspection photos
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fims_inspection_photos') THEN
    INSERT INTO fims.inspection_photos (id, inspection_id, photo_url, photo_name, description, photo_order, uploaded_at)
    SELECT id, inspection_id, photo_url, photo_name, description, photo_order, uploaded_at
    FROM public.fims_inspection_photos
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Migrate assignments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fims_assignments') THEN
    INSERT INTO fims.assignments (id, inspection_id, assigned_to, assigned_by, assignment_type, due_date, status, notes, created_at, updated_at)
    SELECT id, inspection_id, assigned_to, assigned_by, assignment_type, due_date, status, notes, created_at, updated_at
    FROM public.fims_assignments
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;