import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Import crypto for decryption
import { AES, enc } from 'https://esm.sh/crypto-js@4.1.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Encryption key - should match the one in frontend
const ENCRYPTION_KEY = 'ZP_CHANDRAPUR_2025_SECURE_KEY_!@#$%^&*()';

/**
 * Decrypt password on server side
 */
function decryptPassword(encryptedPassword: string): string {
  try {
    const decrypted = AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
    return decrypted.toString(enc.Utf8);
  } catch (error) {
    console.error('Error decrypting password:', error);
    throw new Error('Password decryption failed');
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, encryptedPassword } = await req.json();

    if (!email || !encryptedPassword) {
      return new Response(
        JSON.stringify({ error: 'Email and encrypted password are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Decrypt the password
    const decryptedPassword = decryptPassword(encryptedPassword);
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate with decrypted password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: decryptedPassword,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return session data
    return new Response(
      JSON.stringify({
        session: data.session,
        user: data.user,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Auth decrypt error:', error);
    return new Response(
      JSON.stringify({ error: 'Authentication failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});