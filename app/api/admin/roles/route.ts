import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { 
  setUserRole, 
  getAllUsersWithRoles, 
  isUserAdmin 
} from '@/app/lib/utils/admin-role-management';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userIsAdmin = await isUserAdmin(supabase);
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin yang diizinkan.' },
        { status: 403 }
      );
    }

    // Get all users with their roles
    const users = await getAllUsersWithRoles(supabase);

    return NextResponse.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Error in GET /api/admin/roles:', error);
    return NextResponse.json(
      { 
        error: 'Terjadi kesalahan server',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userIsAdmin = await isUserAdmin(supabase);
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin yang diizinkan.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, role } = body;

    // Validate input
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email dan role harus diisi' },
        { status: 400 }
      );
    }

    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Role tidak valid. Harus admin atau user.' },
        { status: 400 }
      );
    }

    // Set user role
    const result = await setUserRole(supabase, email, role);

    return NextResponse.json({
      success: true,
      message: `Peran ${email} berhasil diubah menjadi ${role}`,
      data: result
    });

  } catch (error) {
    console.error('Error in POST /api/admin/roles:', error);
    return NextResponse.json(
      { 
        error: 'Gagal mengubah peran pengguna',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userIsAdmin = await isUserAdmin(supabase);
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin yang diizinkan.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, email, role } = body;

    if (action === 'remove_admin') {
      // Remove admin role (set to user)
      const result = await setUserRole(supabase, email, 'user');
      
      return NextResponse.json({
        success: true,
        message: `Peran admin ${email} berhasil dihapus`,
        data: result
      });
    }

    if (action === 'set_admin') {
      // Set admin role
      const result = await setUserRole(supabase, email, 'admin');
      
      return NextResponse.json({
        success: true,
        message: `${email} berhasil dijadikan admin`,
        data: result
      });
    }

    return NextResponse.json(
      { error: 'Action tidak dikenali' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in PUT /api/admin/roles:', error);
    return NextResponse.json(
      { 
        error: 'Gagal memproses permintaan',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}