/*
  # Fix Storage Policies and Numeric Field Overflow

  1. Storage Policies
    - Create storage bucket for field-visit-images if not exists
    - Add RLS policies for authenticated users to upload and read images
  
  2. Database Schema Updates
    - Fix numeric field precision for latitude, longitude, and location_accuracy
    - Update columns to handle proper GPS coordinate ranges
  
  3. Table Policies
    - Ensure proper RLS policies for fims_inspection_photos table
*/

-- Create storage bucket for field visit images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('field-visit-images', 'field-visit-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for field-visit-images bucket
DO $$
BEGIN
  -- Allow authenticated users to upload images
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'field-visit-images' AND name = 'Allow authenticated users to upload images'
  ) THEN
    CREATE POLICY "Allow authenticated users to upload images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'field-visit-images');
  END IF;

  -- Allow authenticated users to read images
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'field-visit-images' AND name = 'Allow authenticated users to read images'
  ) THEN
    CREATE POLICY "Allow authenticated users to read images"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'field-visit-images');
  END IF;

  -- Allow authenticated users to delete their own images
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'field-visit-images' AND name = 'Allow authenticated users to delete images'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'field-visit-images');
  END IF;
END $$;

-- Fix numeric field precision for GPS coordinates
DO $$
BEGIN
  -- Update latitude column to handle proper GPS range (-90 to 90)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fims_inspections' AND column_name = 'latitude'
    AND data_type = 'numeric' AND numeric_precision = 10 AND numeric_scale = 8
  ) THEN
    ALTER TABLE fims_inspections ALTER COLUMN latitude TYPE NUMERIC(10,8);
  END IF;

  -- Update longitude column to handle proper GPS range (-180 to 180)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fims_inspections' AND column_name = 'longitude'
    AND data_type = 'numeric' AND numeric_precision = 11 AND numeric_scale = 8
  ) THEN
    ALTER TABLE fims_inspections ALTER COLUMN longitude TYPE NUMERIC(11,8);
  END IF;

  -- Update location_accuracy to handle larger values (up to 99999.99 meters)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fims_inspections' AND column_name = 'location_accuracy'
    AND data_type = 'numeric' AND numeric_precision = 5 AND numeric_scale = 2
  ) THEN
    ALTER TABLE fims_inspections ALTER COLUMN location_accuracy TYPE NUMERIC(8,2);
  END IF;
END $$;

-- Ensure proper RLS policies for fims_inspection_photos table
DO $$
BEGIN
  -- Allow users to insert photos for their own inspections
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fims_inspection_photos' AND policyname = 'Users can insert photos for own inspections'
  ) THEN
    CREATE POLICY "Users can insert photos for own inspections"
    ON fims_inspection_photos FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM fims_inspections fi
        WHERE fi.id = fims_inspection_photos.inspection_id 
        AND fi.inspector_id = auth.uid()
      )
    );
  END IF;
END $$;