import { redirect } from 'next/navigation';
import Link from "next/link";
import { createClient } from '@/app/lib/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // Verifikasi admin role
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (error || !userData || userData.role !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-800 text-white p-4">
        <div className="text-xl font-bold mb-6">Admin Panel</div>
        <nav className="space-y-2">
          <Link href="/admin/dashboard" className="block p-2 hover:bg-slate-700 rounded">
            Dashboard
          </Link>
          <Link href="/admin/events" className="block p-2 hover:bg-slate-700 rounded">
            Events
          </Link>
          <Link href="/admin/clients" className="block p-2 hover:bg-slate-700 rounded">
            Clients
          </Link>
          <Link href="/admin/photos" className="block p-2 hover:bg-slate-700 rounded">
            Photos
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
} 