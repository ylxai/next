// Direct import of Supabase client - no type references needed
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

  try {
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

    if (error) {
      console.error('Error checking admin status:', error);
      return new Response('Terjadi kesalahan sistem', { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    if (!isAdmin) {
      return new Response('Akses ditolak. Hanya admin yang diizinkan.', { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        // Return admin dashboard data
        return new Response(JSON.stringify({
          message: 'Selamat datang, Admin!',
          user: {
            id: user.id,
            email: user.email
          },
          timestamp: new Date().toISOString()
        }), {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        });

      case 'POST':
        // Handle admin operations
        const body = await req.json();
        const { action, payload } = body;

        switch (action) {
          case 'get_users':
            // Get all users with roles
            const { data: users, error: usersError } = await supabase
              .rpc('get_all_users_with_roles');
            
            if (usersError) {
              throw usersError;
            }

            return new Response(JSON.stringify({
              success: true,
              data: users
            }), {
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              }
            });

          case 'set_role':
            // Set user role
            const { email, role } = payload;
            
            if (!email || !role) {
              return new Response(JSON.stringify({
                success: false,
                error: 'Email dan role harus diisi'
              }), {
                status: 400,
                headers: { 
                  ...corsHeaders, 
                  'Content-Type': 'application/json' 
                }
              });
            }

            const { data: roleData, error: roleError } = await supabase
              .rpc('set_user_role', {
                user_email: email,
                new_role: role
              });

            if (roleError) {
              throw roleError;
            }

            return new Response(JSON.stringify({
              success: true,
              message: `Peran ${email} berhasil diubah menjadi ${role}`,
              data: roleData
            }), {
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              }
            });

          default:
            return new Response(JSON.stringify({
              success: false,
              error: 'Action tidak dikenali'
            }), {
              status: 400,
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              }
            });
        }

      default:
        return new Response('Method tidak didukung', { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
    }

  } catch (error) {
    console.error('Error in admin-validation function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Terjadi kesalahan server',
      message: error.message
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    });
  }
});