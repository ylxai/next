"use client";

import { useState } from "react"; // Import useState dari react untuk state management
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
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
  const supabase = createClient(); // Supabase client untuk autentikasi

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Mencegah reload halaman saat submit
    setIsLoading(true); // Mengatur loading menjadi true
    setError(null); // Mengatur error menjadi null

    try {
      const { error } = await supabase.auth.signInWithPassword({ // Sign in dengan email dan password
        email, // Email yang akan digunakan untuk sign in
        password, // Password yang akan digunakan untuk sign in
      });

      if (error) { // Jika ada error saat sign in
        setError(error.message); // Mengatur error dengan pesan error dari supabase
        return; // Mengembalikan fungsi jika ada error
      }

      router.push("/admin/dashboard"); // Redirect ke dashboard jika berhasil login
      router.refresh(); // Refresh halaman untuk memperbarui state
    } catch {
      setError("Terjadi kesalahan saat login"); // Mengatur error dengan pesan umum
    } finally { // Finally akan dijalankan terlepas dari berhasil atau error
      setIsLoading(false); // Mengatur loading menjadi false
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"> {/* Container utama untuk form login */}
      <div className="max-w-md w-full space-y-8"> {/* Container untuk form dengan max width dan spacing */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900"> {/* Judul halaman login */}
            Masuk ke Photo Studio {/* Teks judul */}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}> {/* Form dengan spacing dan handler submit */}
          <div className="rounded-md shadow-sm -space-y-px"> {/* Container untuk input fields */}
            <div> {/* Container untuk input email */}
              <Label htmlFor="email" className="sr-only"> {/* Label untuk email, hidden secara visual */}
                Email {/* Teks label */}
              </Label>
              <Input 
                id="email" // ID untuk input email
                name="email" // Name untuk input email
                type="email" // Type email untuk validasi
                autoComplete="email" // Autocomplete untuk email
                required // Input wajib diisi
                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" // Styling untuk input
                placeholder="Alamat email" // Placeholder untuk input
                value={email} // Value dari state email
                onChange={(e) => setEmail(e.target.value)} // Handler untuk mengubah state email
              />
            </div>
            <div> {/* Container untuk input password */}
              <Label htmlFor="password" className="sr-only"> {/* Label untuk password, hidden secara visual */}
                Password {/* Teks label */}
              </Label>
              <Input 
                id="password" // ID untuk input password
                name="password" // Name untuk input password
                type="password" // Type password untuk menyembunyikan input
                autoComplete="current-password" // Autocomplete untuk password
                required // Input wajib diisi
                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" // Styling untuk input
                placeholder="Password" // Placeholder untuk input
                value={password} // Value dari state password
                onChange={(e) => setPassword(e.target.value)} // Handler untuk mengubah state password
              />
            </div>
          </div>

          {error && ( // Jika ada error, tampilkan pesan error
            <div className="text-red-600 text-sm text-center"> {/* Styling untuk pesan error */}
              {error} {/* Teks error */}
            </div>
          )}

          <div> {/* Container untuk button submit */}
            <Button 
              type="submit" // Type submit untuk form
              disabled={isLoading} // Disable button saat loading
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" // Styling untuk button
            >
              {isLoading ? "Memuat..." : "Masuk"} {/* Teks button berdasarkan state loading */}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 