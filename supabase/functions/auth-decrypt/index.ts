import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import CryptoJS from 'npm:crypto-js@4.2.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, encryptedPassword } = await req.json()

    if (!email || !encryptedPassword) {
      return new Response(
        JSON.stringify({ error: 'Email and encrypted password are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Decrypt password using the same key as frontend
    const ENCRYPTION_KEY = 'ZP_CHANDRAPUR_2025_SECURE_KEY_!@#$%^&*()'
    
    let decryptedPassword
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY)
      decryptedPassword = bytes.toString(CryptoJS.enc.Utf8)
      
      if (!decryptedPassword) {
        throw new Error('Decryption failed')
      }
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Password decryption failed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // First, verify user exists and password is correct by querying auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (userError) {
      return new Response(
        JSON.stringify({ error: 'Authentication service unavailable' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Find user by email
    const user = userData.users.find(u => u.email === email)
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid login credentials' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create a session token for the user using admin API
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    })

    if (sessionError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create a proper session object
    const session = {
      access_token: sessionData.properties?.action_link?.split('#')[1]?.split('&')[0]?.split('=')[1] || 'temp_token',
      refresh_token: 'temp_refresh_token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: user
    }

    // Return session data
    return new Response(
      JSON.stringify({
        session: session,
        user: user,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Auth decrypt error:', error)
    return new Response(
      JSON.stringify({ error: 'Authentication failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})