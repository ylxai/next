import { redirect } from 'next/navigation';
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
  
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-800 text-white p-4">
        <div className="text-xl font-bold mb-6">Admin Panel</div>
        <nav className="space-y-2">
          <a href="/admin/dashboard" className="block p-2 hover:bg-slate-700 rounded">Dashboard</a>
          <a href="/admin/events" className="block p-2 hover:bg-slate-700 rounded">Events</a>
          <a href="/admin/clients" className="block p-2 hover:bg-slate-700 rounded">Clients</a>
          <a href="/admin/photos" className="block p-2 hover:bg-slate-700 rounded">Photos</a>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
} 