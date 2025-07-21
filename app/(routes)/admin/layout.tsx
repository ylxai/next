import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { AdminSidebar } from '@/app/components/admin/admin-sidebar';

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
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-hidden">
        <div className="max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
} 