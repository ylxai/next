# 📋 PANDUAN SETUP DATABASE FOTO STUDIO

## 🚀 URUTAN SCRIPT YANG HARUS DIJALANKAN

### **SCRIPT UTAMA (WAJIB DIJALANKAN PERTAMA)**

#### **1. `01_complete_photo_system.sql`** ⭐
```bash
# Script ini mencakup SEMUA yang dibutuhkan:
✅ Membuat tabel users (jika belum ada)
✅ Membuat tabel events (jika belum ada) 
✅ Membuat tabel photos + photo_downloads + photo_favorites
✅ Membuat Storage bucket "photos"
✅ Setup RLS policies
✅ Setup Storage policies
✅ Membuat indexes untuk performa
✅ Membuat views untuk statistik
```

### **SCRIPT TAMBAHAN (JIKA ADA MASALAH)**

#### **2. `02_create_admin_user.sql`** 👤
```bash
# Membuat admin user dan sample event untuk testing
✅ Admin user dengan role admin
✅ Sample event untuk testing upload
```

#### **3. `03_fix_storage_bucket.sql`** 🔧
```bash
# Fix masalah bucket tidak terdeteksi (COMMON ISSUE)
✅ Fix RLS pada storage.buckets
✅ Recreate bucket dengan settings benar
✅ Fix storage policies
✅ Grant permissions yang benar
```

**JALANKAN SCRIPT SESUAI URUTAN DAN KEBUTUHAN**

---

## 📝 CARA MENJALANKAN

### **Step 1: Buka Supabase Dashboard**
1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri

### **Step 2: Jalankan Script Utama**
1. Copy seluruh isi file `01_complete_photo_system.sql`
2. Paste di SQL Editor
3. Klik **Run** 
4. Tunggu sampai selesai (akan ada pesan success)

### **Step 3: Buat Admin User**
1. Pertama, signup di app Anda dengan email admin
2. Login ke Supabase Dashboard → Authentication → Users  
3. Copy UUID dari user yang baru dibuat
4. Edit file `02_create_admin_user.sql`:
   - Ganti `00000000-0000-0000-0000-000000000000` dengan UUID asli
   - Ganti `admin@photostudio.com` dengan email Anda
5. Jalankan script `02_create_admin_user.sql` di SQL Editor

### **Step 4: Verifikasi Setup**
Jalankan query ini untuk memastikan semua berhasil:
```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('users', 'events', 'photos', 'photo_downloads', 'photo_favorites');

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'photos';

-- Check admin user
SELECT id, email, role FROM users WHERE role = 'admin';

-- Check test event
SELECT id, title, access_code FROM events WHERE access_code = 'WEDDING2024';
```

---

## 🏆 HASIL YANG DIHARAPKAN

Setelah menjalankan script, Anda akan memiliki:

### **✅ Tables Created:**
- `users` - Data pengguna dan admin
- `events` - Data event fotografi  
- `photos` - Metadata foto
- `photo_downloads` - Tracking download
- `photo_favorites` - Foto favorit client

### **✅ Storage Setup:**
- Bucket `photos` dengan limit 50MB
- Support JPG, PNG, RAW files
- Policies untuk read/write

### **✅ Security:**
- Row Level Security (RLS) enabled
- Admin dapat manage semua data
- Client hanya lihat foto approved
- Guest dapat download public photos

### **✅ Performance:**
- Indexes untuk query cepat
- Views untuk statistik
- Triggers untuk updated_at

---

## 🛠️ TROUBLESHOOTING

### **❌ "Photos bucket not found" (MOST COMMON)**
```bash
Problem: Bucket ada di Dashboard tapi app tidak detect
Cause:   RLS pada storage.buckets table
Fix:     Jalankan script 03_fix_storage_bucket.sql
```

### **❌ "Cannot read properties of undefined (reading 'split')"**
```bash
Problem: File validation error saat upload
Cause:   File object invalid atau corrupt
Fix:     Refresh page, coba file lain, atau restart browser
```

### **❌ "Upload failed: 0 successful, 1 failed"**
```bash
Problem: Upload process gagal
Steps:   
1. Check /admin/photos/debug - lihat mana yang fail
2. Jalankan 03_fix_storage_bucket.sql jika storage fail  
3. Jalankan 01_complete_photo_system.sql jika table fail
```

### **❌ "relation does not exist"**
```bash
# Database table belum dibuat:
01_complete_photo_system.sql
```

### **❌ "permission denied for table"**
```sql
-- Grant permissions manual:
GRANT ALL ON photos TO authenticated;
GRANT ALL ON photo_downloads TO authenticated;
GRANT ALL ON photo_favorites TO authenticated;
```

### **❌ "Event not found" saat upload**
```bash
# Buat admin user dan sample event:
02_create_admin_user.sql
```

---

## 🧪 TESTING SETELAH SETUP

### **1. Test di App:**
- Visit: `http://localhost:3000/admin/photos/debug`
- Semua test harus PASS ✅

### **2. Test Manual di Database:**
```sql
-- Test insert photo
INSERT INTO photos (event_id, filename, original_filename, file_path, mime_type)
VALUES (
  (SELECT id FROM events LIMIT 1),
  'test.jpg',
  'test-original.jpg', 
  'test/path/test.jpg',
  'image/jpeg'
);

-- Check if inserted
SELECT * FROM photos WHERE filename = 'test.jpg';
```

### **3. Test Upload:**
- Login sebagai admin
- Buka `/admin/photos` 
- Upload foto test

---

## ❓ FAQ

**Q: Apakah aman menjalankan script berulang kali?**
A: Ya, script menggunakan `IF NOT EXISTS` dan `ON CONFLICT` untuk safety

**Q: Bagaimana jika sudah ada tabel users/events?**
A: Script akan skip pembuatan dan hanya menambah yang missing

**Q: Apakah perlu menjalankan script lain?**
A: Tidak, `01_complete_photo_system.sql` sudah lengkap untuk photo system

**Q: Bagaimana cara reset jika ada masalah?**
A: Drop tables dan jalankan ulang script:
```sql
DROP TABLE IF EXISTS photo_favorites CASCADE;
DROP TABLE IF EXISTS photo_downloads CASCADE; 
DROP TABLE IF EXISTS photos CASCADE;
DELETE FROM storage.buckets WHERE id = 'photos';
-- Lalu jalankan ulang 01_complete_photo_system.sql
```

---

## 📞 SUPPORT

Jika ada error saat setup:
1. Screenshot error message
2. Jalankan diagnostic: `/admin/photos/debug`
3. Copy hasil diagnostic
4. Share untuk troubleshooting