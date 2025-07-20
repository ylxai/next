import { createClient } from '@/app/lib/supabase/server'; 
import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
  
  // Verifikasi role admin
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
  
  // Buat event baru
  const { title, date, description } = await req.json();
  
  // Generate access code
  const accessCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      title,
      date,
      description,
      access_code: accessCode
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
  
  return NextResponse.json(event);
} 