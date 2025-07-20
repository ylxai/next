# Photo Studio Web Application

Aplikasi web untuk manajemen foto studio professional dengan fitur admin dashboard, manajemen klien, dan pengelolaan event fotografi.

## ✅ Issues Yang Telah Diperbaiki

### 1. **Deprecated Supabase Auth Helpers**
- ❌ **Sebelum**: Menggunakan `@supabase/auth-helpers-nextjs` (deprecated)
- ✅ **Sesudah**: Menggunakan `@supabase/ssr` (modern)

### 2. **TypeScript Errors**
- ❌ **Sebelum**: Penggunaan `any` type pada error handling
- ✅ **Sesudah**: Proper error handling dengan type safety

### 3. **Missing Dependencies**
- ❌ **Sebelum**: Dependencies tidak terinstall
- ✅ **Sesudah**: Semua dependencies terinstall dan terkonfigurasi

### 4. **Missing Main Page**
- ❌ **Sebelum**: Tidak ada `app/page.tsx`
- ✅ **Sesudah**: Homepage dengan navigasi yang proper

### 5. **Path Resolution Issues**
- ❌ **Sebelum**: Konflik antara `/app/components` dan `/components`
- ✅ **Sesudah**: Path aliasing yang konsisten

## Fitur

- 🔐 **Authentication**: Login dengan Supabase Auth
- 👥 **Admin Dashboard**: Panel admin untuk manajemen
- 📸 **Event Management**: Manajemen event fotografi
- 👤 **Client Management**: Manajemen data klien
- 🎨 **Modern UI**: Menggunakan Tailwind CSS + Shadcn/ui

## Tech Stack

- **Frontend**: Next.js 15.4.2 + React 19.1.0
- **Styling**: Tailwind CSS + Shadcn/ui
- **Backend**: Supabase
- **Language**: TypeScript
- **Form Handling**: React Hook Form + Zod

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Buat file `.env.local` dan tambahkan:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase Setup
1. Buat project di [Supabase](https://supabase.com)
2. Buat tabel `users` dengan kolom:
   - `id` (UUID, primary key)
   - `email` (text)
   - `full_name` (text)
   - `role` (text, default: 'user')
3. Setup Row Level Security (RLS)

### 4. Membuat Admin Pertama
Setelah setup Supabase, buat akun admin:
- Akses `http://localhost:3000/setup-admin`
- Isi form setup admin
- Atau lihat panduan lengkap di [ADMIN_SETUP_GUIDE.md](./ADMIN_SETUP_GUIDE.md)

### 5. Run Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Project Structure

```
app/
├── (routes)/           # Route groups
│   ├── admin/         # Admin pages
│   ├── event/         # Event pages
│   └── login/         # Login page
├── api/               # API routes
├── components/        # React components
├── lib/              # Utilities
│   └── supabase/     # Supabase config
└── globals.css       # Global styles
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Authentication Flow

1. User mengakses halaman login
2. Kredensial diverifikasi via Supabase Auth
3. Middleware memeriksa role user untuk akses admin
4. Redirect ke dashboard jika berhasil

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ⚠️ Important: Start with RLS disabled for initial setup
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- After everything works, you can enable simple RLS policies:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "authenticated_read_own" ON users
--   FOR SELECT USING (auth.uid() = id);

-- ⚠️ See SQL_FIXES.sql for proper RLS setup to avoid infinite recursion
```

## Deployment

1. Build aplikasi: `npm run build`
2. Deploy ke platform pilihan (Vercel, Netlify, dll.)
3. Set environment variables di platform deployment
4. Konfigurasikan domain di Supabase Auth settings

## Troubleshooting

### Build Error: Missing Environment Variables
Pastikan file `.env.local` sudah dibuat dengan variabel Supabase yang benar.

### CSS Error: Unknown Utility Class
Jika ada error Tailwind CSS, pastikan `app/globals.css` sudah ter-import dengan benar.

### Authentication Error
1. Periksa Supabase URL dan API key
2. Pastikan RLS sudah dikonfigurasi dengan benar
3. Periksa domain di Supabase Auth settings

## Contributing

1. Fork repository
2. Buat feature branch
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request
