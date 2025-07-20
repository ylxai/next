"use client";

import { useState } from "react"; // Import useState dari react untuk state management
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// TODO: The following imports may be missing or have incorrect paths. 
// Please ensure these components exist at the specified paths or update the import paths accordingly.
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = useState(""); // State untuk email
  const [password, setPassword] = useState(""); // State untuk password
  const [error, setError] = useState<string | null>(null); // State untuk error
  const [isLoading, setIsLoading] = useState(false); // State untuk loading
  const router = useRouter(); // Router untuk navigasi
  const supabase = createClientComponentClient(); // Supabase client untuk autentikasi

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Mencegah reload halaman saat submit
    setIsLoading(true); // Mengatur loading menjadi true
    setError(null); // Mengatur error menjadi null

    try {
      const { error } = await supabase.auth.signInWithPassword({ // Sign in dengan email dan password
        email, // Email yang akan digunakan untuk sign in
        password, // Password yang akan digunakan untuk sign in
      });

      if (error) {
        throw error;
      }

      router.refresh(); // Refresh halaman
      router.push("/admin/dashboard"); // Navigasi ke halaman admin/dashboard
    } catch (error: any) {
      setError(error.message || "Login gagal. Silakan coba lagi."); // Mengatur error menjadi pesan error
    } finally {
      setIsLoading(false); // Mengatur loading menjadi false
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-6 bg-white dark:bg-slate-900 rounded-lg shadow-md">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Masuk ke akun Anda
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? "Masuk..." : "Masuk"}
        </Button>
      </form>
    </div>
  );
} 