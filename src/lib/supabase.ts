import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Main client for public schema (auth, roles, permissions)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ERMS-specific client for erms schema
export const ermsClient = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'erms'
  }
});