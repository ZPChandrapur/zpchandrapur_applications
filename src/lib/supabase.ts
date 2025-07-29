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
    console.log('🧪 Step 2: Testing ERMS schema access...');
    console.log('   Using ermsClient.from("department").select("*")...');
    
    const { data: departments, error: ermsError } = await ermsClient
      .from('department')
      .select('*')
      .limit(10);
    
    if (ermsError) {
      console.error('❌ ERMS Schema Access Failed:');
      console.error('   Error Code:', ermsError.code);
      console.error('   Error Message:', ermsError.message);
      console.error('   Error Details:', ermsError.details);
      console.error('   Error Hint:', ermsError.hint);
      return { success: false, error: `ERMS Schema Error: ${ermsError.message}`, data: null };
    }
    
    console.log('✅ ERMS Schema Access Successful!');
    console.log('📊 Raw Department Data:', departments);
    console.log(`📈 Total Records Found: ${departments?.length || 0}`);
    
    if (departments && departments.length > 0) {
      console.log('🔍 Sample Record Structure:', departments[0]);
      console.log('📋 Available Columns:', Object.keys(departments[0]));
    } else {
      console.log('⚠️ No department records found in the table');
    }
    
    return { 
      success: true, 
      error: null, 
      data: departments,
      count: departments?.length || 0,
      schema: 'erms',
      table: 'department'
    };
    
  } catch (error: any) {
    console.error('❌ Unexpected Connection Test Failure:');
    console.error('   Error Type:', error.constructor.name);
    console.error('   Error Message:', error.message);
    console.error('   Error Stack:', error.stack);
    return { success: false, error: `Unexpected error: ${error.message}`, data: null };
  }
};