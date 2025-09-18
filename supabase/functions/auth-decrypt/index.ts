import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AES, enc } from "https://esm.sh/crypto-js@4.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Decrypt password on server side
 */
function decryptPassword(encryptedPassword: string): string {
  // Retrieve key from environment variables (set in Supabase dashboard)
  const ENCRYPTION_KEY = Deno.env.get("ENCRYPTION_KEY");
  if (!ENCRYPTION_KEY) {
    throw new Error("Missing encryption key configuration");
  }

  try {
    const decrypted = AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
    const plaintext = decrypted.toString(enc.Utf8);
    if (!plaintext) {
      throw new Error("Decryption resulted in empty string");
    }
    return plaintext;
  } catch (error) {
    console.error("Error decrypting password (generic error)");
    throw new Error("Password decryption failed");
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const { email, encryptedPassword } = await req.json();

    if (!email || !encryptedPassword) {
      return new Response(
        JSON.stringify({ error: "Email and encrypted password are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Decrypt the password
    const decryptedPassword = decryptPassword(encryptedPassword);

    // Create Supabase client using built-in Supabase env vars
    // (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically available in edge functions)
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Use Supabase's built-in authentication with decrypted password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: decryptedPassword,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Auth decrypt error (generic)");
    return new Response(
      JSON.stringify({ error: "Authentication failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
