"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function AdminSetupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak sama");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password harus minimal 6 karakter");
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Gagal membuat user");
        setIsLoading(false);
        return;
      }

      // Step 2: Insert user data with admin role
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          role: 'admin',
          full_name: fullName
        });

      if (dbError) {
        setError("Gagal menyimpan data admin: " + dbError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);

         } catch {
       setError("Terjadi kesalahan saat membuat admin");
       setIsLoading(false);
     }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-green-800">
            <h3 className="text-lg font-medium">Admin berhasil dibuat!</h3>
            <p className="mt-2 text-sm">
              Akun admin telah dibuat dengan email: {email}
            </p>
            <p className="mt-1 text-sm">
              Anda akan diarahkan ke halaman login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Nama Lengkap</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Masukkan nama lengkap"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="email">Email Admin</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@photostudio.com"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi password"
            className="mt-1"
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
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Membuat Admin...
            </span>
          ) : (
            'Buat Admin'
          )}
        </Button>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Halaman ini hanya bisa diakses sekali untuk membuat admin pertama
        </p>
      </div>
    </form>
  );
}