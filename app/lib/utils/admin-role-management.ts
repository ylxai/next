import { createClient } from '@supabase/supabase-js';

// Fungsi untuk menetapkan peran admin (hanya oleh admin)
export async function setUserRole(
  supabase: any, 
  email: string, 
  role: 'admin' | 'user'
) {
  // Pastikan pengguna saat ini adalah admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Tidak terautentikasi');
  }

  // Panggil fungsi database untuk set role
  const { data, error } = await supabase.rpc('set_user_role', {
    user_email: email,
    new_role: role
  });

  if (error) throw error;
  return data;
}

// Fungsi untuk mendapatkan semua users dengan role mereka
export async function getAllUsersWithRoles(
  supabase: any
) {
  const { data, error } = await supabase.rpc('get_all_users_with_roles');
  
  if (error) throw error;
  return data;
}

// Fungsi untuk memeriksa apakah user adalah admin
export async function isUserAdmin(
  supabase: any
) {
  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  
  if (error) throw error;
  return isAdmin;
}

// Fungsi untuk mendapatkan role user saat ini
export async function getCurrentUserRole(
  supabase: any
) {
  const { data, error } = await supabase.rpc('get_current_user_role');
  
  if (error) throw error;
  return data;
}