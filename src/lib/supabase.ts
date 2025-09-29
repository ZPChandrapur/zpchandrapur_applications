import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // console.error('Missing Supabase environment variables. Please check your .env file.');
  // console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

// Main client for public schema (auth, roles, permissions)
export const supabase = createClient = configErrors.length === 0 ? (supabaseUrl, supabaseAnonKey, {
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

// ERMS-specific client for erms schema
export const ermsClient = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'erms'
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

// Test function to verify ERMS connection
export const testERMSConnection = async () => {
  try {
    // Test Supabase Auth user metadata capabilities
    
    // Check current user and available metadata
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      // console.log('ℹ️ No current user session');
      // Clear any stale session data if there's an auth error
      await supabase.auth.signOut();
    } else if (user) {
      // console.log('👤 Current User Info:');
      // console.log('   User ID:', user.id);
      // console.log('   Email:', user.email);
    }
    
    // Check if we can access the auth.users table (usually restricted)
    console.log('🔍 Checking auth.users table access...');
    const { data: authUsers, error: authError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    // if (authError) {
    //   console.log('❌ Cannot access  table directly:', authError.message);
    // } else {
    //   console.log('✅ Auth users table accessible:', authUsers);
    // }
    
    // Check user_roles table structure
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);
    
    if (rolesError) {
      console.log('❌ Error accessing user_roles:', rolesError.message);
    } else {
      console.log('✅ User roles table structure:', userRoles);
    }
    
    // console.log('🔍 Testing Schema Connection with provided credentials...');
    
    // Test 1: Basic connection
    console.log('🧪 Step 1: Testing basic connection...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      // Clear any stale session data if there's a session error
      await supabase.auth.signOut();
      console.error('❌ Basic connection failed:', sessionError);
      return { success: false, error: `Basic connection failed: ${sessionError.message}`, data: null };
    }
    // console.log('✅ Basic Supabase connection successful');
    
    // Test 2: ERMS schema access with detailed logging
  } catch (error) {
    // Clear any stale session data if there's an unexpected error
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      // console.error('❌ Error during signOut:', signOutError);
    }
    console.error('❌ Error in testConnection:', error);
    return { success: false, error: error.message, data: null };
  }
}

export const supabase = configErrors.length === 0 ? createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'erms'
    }
  }
}) : null;
 
// Export configuration status for components to check
export const isSupabaseConfigured = configErrors.length === 0;
export const supabaseConfigErrors = configErrors;