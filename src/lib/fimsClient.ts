import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tvmqkondihsomlebizjj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bXFrb25kaWhzb21sZWJpempqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTQ0NjcsImV4cCI6MjA2OTI3MDQ2N30.W1fSD_RLJjcsIoJhJDnE6Xri9AIxv5DuAlN65iqI6BE';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// FIMS-specific client for fims schema
export const fimsClient = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'fims'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  },
});

// Photo upload utility
export const uploadInspectionPhoto = async (file: File, inspectionId: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${inspectionId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await fimsClient.storage
      .from('inspection-photos')
      .upload(fileName, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = fimsClient.storage
      .from('inspection-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

// Save photo record to database
export const savePhotoRecord = async (inspectionId: string, photoUrl: string, photoName: string, description?: string) => {
  try {
    const { data, error } = await fimsClient
      .from('inspection_photos')
      .insert({
        inspection_id: inspectionId,
        photo_url: photoUrl,
        photo_name: photoName,
        description: description || ''
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving photo record:', error);
    throw error;
  }
};