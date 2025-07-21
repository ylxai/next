import { AdminSetupForm } from "@/app/components/admin/admin-setup-form";
import { createClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminSetupPage() {
  const supabase = await createClient();
  
  // Check if any admin already exists
  const { data: adminExists } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1);
  
  // If admin already exists, redirect to login
  if (adminExists && adminExists.length > 0) {
    redirect('/login');
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Setup Admin Pertama
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Buat akun admin untuk pertama kali
          </p>
        </div>
        <AdminSetupForm />
      </div>
    </div>
  );
}