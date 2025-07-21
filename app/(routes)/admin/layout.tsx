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
    <div className="min-h-screen bg-gray-50">
      <main className="w-full p-6">
        {children}
      </main>
    </div>
  );
} 