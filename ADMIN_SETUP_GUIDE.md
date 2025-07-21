# 👤 Panduan Membuat Akun Admin - Photo Studio

## 🎯 Overview

Ada beberapa cara untuk membuat akun admin dalam aplikasi Photo Studio. Pilih metode yang paling sesuai dengan situasi Anda.

## 🚀 Metode 1: Auto Setup Admin (Paling Mudah)

### Langkah-langkah:
1. **Pastikan Database Ready**
   ```sql
   -- Pastikan tabel users sudah ada dengan structure ini:
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email TEXT UNIQUE NOT NULL,
     full_name TEXT,
     role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Akses Halaman Setup Admin**
   - Buka aplikasi: `http://localhost:3000`
   - Klik tombol "Setup Admin (Pertama Kali)"
   - Atau langsung ke: `http://localhost:3000/setup-admin`

3. **Isi Form Setup Admin**
   - **Nama Lengkap**: Masukkan nama lengkap admin
   - **Email**: Email yang akan digunakan untuk login (contoh: admin@photostudio.com)
   - **Password**: Minimal 6 karakter, buat yang kuat
   - **Konfirmasi Password**: Ulangi password yang sama

4. **Submit & Login**
   - Klik "Buat Admin"
   - Jika berhasil, Anda akan diarahkan ke halaman login
   - Login dengan email dan password yang baru dibuat

### ✅ Keuntungan Metode Ini:
- ✅ Otomatis membuat user di Auth dan Database
- ✅ Validasi password dan email
- ✅ Interface yang user-friendly
- ✅ Hanya bisa digunakan sekali (keamanan)
- ✅ Auto-redirect setelah selesai

---

## 🔧 Metode 2: Manual via Supabase Dashboard

### Langkah 1: Buat User di Authentication
1. Buka **Supabase Dashboard** → **Authentication** → **Users**
2. Klik **"Add user"**
3. Isi form:
   - **Email**: admin@photostudio.com (atau email pilihan Anda)
   - **Password**: Password yang kuat
   - **Auto Confirm User**: ✅ Centang ini
4. Klik **"Create user"**

### Langkah 2: Set Role Admin di Database
1. Buka **Supabase Dashboard** → **Table Editor** → **users**
2. Cari user yang baru dibuat berdasarkan email
3. Jika belum ada record, klik **"Insert"** → **"Insert row"**
4. Isi data:
   ```json
   {
     "id": "user-id-dari-auth", // Copy dari auth.users
     "email": "admin@photostudio.com",
     "full_name": "Admin Photo Studio",
     "role": "admin"
   }
   ```
5. Jika sudah ada record, edit kolom `role` dari `'user'` menjadi `'admin'`
6. **Save** perubahan

---

## 💻 Metode 3: Via SQL Script

Jalankan script SQL ini di Supabase SQL Editor:

```sql
-- 1. Insert user ke auth.users (ganti dengan data Anda)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@photostudio.com',
  crypt('your-password', gen_salt('bf')), -- Ganti 'your-password'
  NOW(),
  NOW(),
  NOW()
);

-- 2. Insert ke tabel users dengan role admin
INSERT INTO users (
  id,
  email,
  full_name,
  role
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@photostudio.com'),
  'admin@photostudio.com',
  'Admin Photo Studio',
  'admin'
);
```

---

## 🔐 Metode 4: Membuat Admin dari User Biasa

Jika sudah ada user biasa yang ingin dijadikan admin:

```sql
-- Update role user menjadi admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

---

## 🛡️ Keamanan & Best Practices

### Password Guidelines:
- ✅ Minimal 8 karakter (bukan 6 untuk admin)
- ✅ Kombinasi huruf besar, kecil, angka, simbol
- ✅ Hindari informasi personal (nama, tanggal lahir)
- ✅ Gunakan password manager

### Email Guidelines:
- ✅ Gunakan email domain bisnis: `admin@yourdomain.com`
- ✅ Hindari email personal untuk admin
- ✅ Pastikan akses email tetap terjaga

### Security Tips:
- 🚨 **Penting**: Hapus atau disable halaman `/setup-admin` setelah admin pertama dibuat
- 🚨 Jangan share kredensial admin
- 🚨 Aktifkan 2FA jika tersedia
- 🚨 Regular password update

---

## 🧪 Testing Login Admin

### 1. Test di Development:
```bash
npm run dev
# Buka http://localhost:3000/login
# Login dengan email dan password admin
```

### 2. Verifikasi Role:
- Login berhasil → diarahkan ke `/admin/dashboard`
- Jika gagal → periksa role di database
- Jika error → periksa console browser dan server logs

### 3. Test Middleware:
- Coba akses `/admin/events` tanpa login → harus redirect ke `/login`
- Login sebagai user biasa → harus tidak bisa akses admin pages

---

## 🔍 Troubleshooting

### Problem: Setup admin page tidak muncul
**Solution**: 
- Periksa apakah sudah ada admin di database
- Hapus data admin di database untuk reset

### Problem: Error saat membuat admin
**Solutions**:
1. **Email sudah ada**: 
   ```sql
   DELETE FROM auth.users WHERE email = 'admin@photostudio.com';
   DELETE FROM users WHERE email = 'admin@photostudio.com';
   ```

2. **Database connection error**:
   - Periksa environment variables `.env.local`
   - Pastikan Supabase URL dan API key benar

3. **Role tidak ter-set**:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-admin-email';
   ```

### Problem: Login berhasil tapi tidak bisa akses admin
**Solution**:
```sql
-- Periksa role user
SELECT id, email, role FROM users WHERE email = 'admin@photostudio.com';

-- Update role jika belum admin
UPDATE users SET role = 'admin' WHERE email = 'admin@photostudio.com';
```

---

## 📋 Database Schema untuk Admin

Pastikan tabel `users` memiliki structure lengkap:

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Admins can read all users
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Users can update their own data
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

---

## 🎉 Setelah Admin Dibuat

1. **Login ke aplikasi** dengan kredensial admin
2. **Setup profile lengkap** di dashboard admin
3. **Buat user/client** pertama untuk testing
4. **Upload foto/portfolio** pertama
5. **Test semua fitur** admin panel

**Selamat! Admin account sudah siap digunakan! 🎊**