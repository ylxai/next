
import { createClient } from '@supabase/supabase-js'; 

/**
 * @typedef {Object} DenoEnv
 * @property {function(string): (string|undefined)} get
 * @property {function(string, string): void} set
 * @property {function(): Object.<string, string>} toObject
 */

/**
 * @typedef {Object} Deno
 * @property {DenoEnv} env
 * @property {function(function(Request): (Response|Promise<Response>)): void} serve
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {  // @ts-ignore    
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') { 
    return new Response('ok', { headers: corsHeaders });
  }

  // Validasi header otorisasi
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Tidak terautentikasi', { 
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,  
    Deno.env.get('SUPABASE_ANON_KEY')!, 
    { 
      global: { 
        headers: { Authorization: authHeader } 
      } 
    }
  );

  // Periksa apakah pengguna adalah admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return new Response('Tidak terautentikasi', { 
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }

  // Gunakan fungsi is_admin() dari database
  const { data: isAdmin, error } = await supabase
    .rpc('is_admin');

  if (error || !isAdmin) {
    return new Response('Akses ditolak. Hanya admin yang diizinkan.', { 
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }

  // Contoh endpoint admin
  return new Response(JSON.stringify({
    message: 'Selamat datang, Admin!',
    user: {
      id: user.id,
      email: user.email
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});