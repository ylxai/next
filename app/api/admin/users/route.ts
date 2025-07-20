import { createClient } from '@/app/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  
  // Cek apakah user yang membuat adalah admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Verifikasi role admin (perlu query table users)
  const { data: adminData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (!adminData || adminData.role !== 'admin') {
    return NextResponse.json(
      { message: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Buat user baru
  const { name, email, password } = await req.json();
  
  const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  if (signUpError) {
    return NextResponse.json(
      { message: signUpError.message },
      { status: 400 }
    );
  }
  
  // Tambahkan data user ke table users
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: newUser.user.id,
      email,
      name,
      role: 'client'
    });
  
  if (insertError) {
    return NextResponse.json(
      { message: insertError.message },
      { status: 400 }
    );
  }
  
  return NextResponse.json({ message: 'Client created successfully' });
} 