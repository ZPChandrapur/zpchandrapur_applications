import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvmqkondihsomlebizjj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bXFrb25kaWhzb21sZWJpempqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTQ0NjcsImV4cCI6MjA2OTI3MDQ2N30.W1fSD_RLJjcsIoJhJDnE6Xri9AIxv5DuAlN65iqI6BE';

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

// Test function to verify ERMS connection
export const testERMSConnection = async () => {
  try {
    // Test Supabase Auth user metadata capabilities
    console.log('🔍 Testing Supabase Auth and User Metadata...');
    
    // Check current user and available metadata
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log('ℹ️ No current user session');
    } else if (user) {
      console.log('👤 Current User Info:');
      console.log('   User ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   User Metadata:', user.user_metadata);
      console.log('   App Metadata:', user.app_metadata);
      console.log('   Created At:', user.created_at);
    }
    
    // Check if we can access the auth.users table (usually restricted)
    console.log('🔍 Checking auth.users table access...');
    const { data: authUsers, error: authError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (authError) {
      console.log('❌ Cannot access auth.users table directly:', authError.message);
      console.log('ℹ️ This is normal - auth.users is typically restricted');
    } else {
      console.log('✅ Auth users table accessible:', authUsers);
    }
    
    // Check user_roles table structure
    console.log('🔍 Checking user_roles table structure...');
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);
    
    if (rolesError) {
      console.log('❌ Error accessing user_roles:', rolesError.message);
    } else {
      console.log('✅ User roles table structure:', userRoles);
    }
    
    console.log('🔍 Testing ERMS Schema Connection with provided credentials...');
    console.log('📋 Connection Details:');
    console.log('   URL: https://tvmqkondihsomlebizjj.supabase.co');
    console.log('   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    console.log('   Schema: erms');
    console.log('   Target Table: department');
    
    // Test 1: Basic connection
    console.log('🧪 Step 1: Testing basic Supabase connection...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Basic connection failed:', sessionError);
      return { success: false, error: `Basic connection failed: ${sessionError.message}`, data: null };
    }
    console.log('✅ Basic Supabase connection successful');
    
    // Test 2: ERMS schema access with detailed logging