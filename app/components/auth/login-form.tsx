"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error("Auth error:", authError);
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Login gagal - tidak ada user data");
        setIsLoading(false);
        return;
      }

      console.log("Login berhasil:", authData.user.email);

      // Step 2: Verify user role in database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.error("Database error:", userError);
        
        // If user doesn't exist in users table, create them
        if (userError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              full_name: authData.user.user_metadata?.full_name || null,
              role: 'user'
            });

          if (insertError) {
            console.error("Insert error:", insertError);
            setError("Gagal membuat profile user: " + insertError.message);
            setIsLoading(false);
            return;
          }

          // Redirect to regular user page or show message
          setError("User berhasil dibuat tapi bukan admin. Hubungi administrator untuk akses admin.");
          setIsLoading(false);
          return;
        } else {
          setError("Gagal mengambil data user: " + userError.message);
          setIsLoading(false);
          return;
        }
      }

      console.log("User data:", userData);

      // Step 3: Check if user is admin
      if (userData.role === 'admin') {
        console.log("Admin login berhasil, redirecting...");
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        setError("Anda tidak memiliki akses admin. Hubungi administrator.");
        // Optionally sign out non-admin users
        await supabase.auth.signOut();
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error("Unexpected error:", error);
      setError("Terjadi kesalahan tidak terduga saat login");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Masuk ke Photo Studio
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Login dengan akun admin Anda
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <Label htmlFor="email" className="sr-only">
                Email
              </Label>
              <Input 
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Alamat email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password" className="sr-only">
                Password
              </Label>
              <Input 
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <Button 
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memuat...
                </span>
              ) : (
                'Masuk'
              )}
            </Button>
          </div>
        </form>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun admin?{' '}
            <a href="/setup-admin" className="font-medium text-indigo-600 hover:text-indigo-500">
              Setup Admin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 