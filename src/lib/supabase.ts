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
    console.log('🔍 Testing ERMS Schema Connection...');
    
    // Test 1: Basic connection
    const { data: basicTest, error: basicError } = await supabase.auth.getSession();
    console.log('✅ Basic Supabase connection:', basicTest ? 'Success' : 'Failed');
    
    // Test 2: ERMS schema access
    const { data: departments, error: ermsError } = await ermsClient
      .from('department')
      .select('*')
      .limit(10);
    
    if (ermsError) {
      console.error('❌ ERMS Schema Error:', ermsError);
      return { success: false, error: ermsError.message, data: null };
    }
    
    console.log('✅ ERMS Schema Connection Success!');
    console.log('📊 Department Data:', departments);
    console.log(`📈 Found ${departments?.length || 0} departments`);
    
    return { 
      success: true, 
      error: null, 
      data: departments,
      count: departments?.length || 0
    };
    
  } catch (error: any) {
    console.error('❌ Connection Test Failed:', error);
    return { success: false, error: error.message, data: null };
  }
};