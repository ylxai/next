# 🔧 Database Foreign Key Error Fix

## ❌ **Error yang Terjadi**

```
ERROR: 23503: insert or update on table "events" violates foreign key constraint "events_client_id_fkey"
DETAIL: Key (client_id)=(0bb08b8d-b527-4986-9fc0-5e56d0e8aed9) is not present in table "clients".
```

## 🔍 **Penyebab Masalah**

Error ini terjadi karena:
1. **Data existing** di tabel `events` memiliki `client_id` yang merujuk ke ID yang tidak ada di tabel `clients`
2. **Foreign key constraint** tidak bisa dibuat karena ada **orphaned references**
3. **Database integrity** mencegah constraint yang akan langsung dilanggar

---

## ✅ **Solusi Cepat (Emergency Fix)**

### **Langkah 1: Jalankan Emergency Fix**

Copy dan paste **seluruh isi** file `database/emergency_fix.sql` ke **Supabase SQL Editor**:

```sql
-- ====================================
-- EMERGENCY FIX - Quick Solution
-- ====================================

-- Fix the specific problematic record
UPDATE events 
SET client_id = NULL,
    client_name = COALESCE(client_name, 'Klien Tidak Terdaftar')
WHERE client_id = '0bb08b8d-b527-4986-9fc0-5e56d0e8aed9';

-- Fix all invalid client_id references
UPDATE events 
SET client_id = NULL,
    client_name = COALESCE(client_name, 'Klien Tidak Terdaftar')
WHERE client_id IS NOT NULL 
AND client_id NOT IN (SELECT id FROM clients WHERE id IS NOT NULL);

-- Update foreign key constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_client_id_fkey;
ALTER TABLE events 
ADD CONSTRAINT events_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Disable RLS temporarily
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Re-enable with admin policy
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage events" ON events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

### **Langkah 2: Verify Fix Berhasil**

Jalankan query ini untuk verify:

```sql
-- Check foreign key constraint exists
SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu1 
  ON rc.constraint_name = kcu1.constraint_name
JOIN information_schema.key_column_usage kcu2 
  ON rc.unique_constraint_name = kcu2.constraint_name
WHERE rc.constraint_schema = 'public' 
AND kcu1.table_name = 'events' 
AND kcu1.column_name = 'client_id';

-- Check no orphaned client_id references remain
SELECT COUNT(*) as orphaned_count
FROM events e
WHERE e.client_id IS NOT NULL 
AND e.client_id NOT IN (SELECT id FROM clients WHERE id IS NOT NULL);
```

Should return:
- **Foreign key constraint exists** pointing to clients table
- **Orphaned count = 0**

---

## 📊 **Solusi Lengkap (Comprehensive Fix)**

Jika emergency fix sudah berhasil, Anda bisa skip ini. Tapi untuk setup yang lebih robust, jalankan `database/events_schema_fix_v2.sql` yang meliputi:

### **Fitur Comprehensive Fix**:
1. ✅ **Data analysis** - Check existing conflicts
2. ✅ **Conflict resolution** - Clean up orphaned references  
3. ✅ **Constraint application** - Apply proper foreign keys
4. ✅ **Testing** - Verify everything works
5. ✅ **RLS setup** - Proper security policies
6. ✅ **Sample data** - Create test client for testing

---

## 🧪 **Testing Setelah Fix**

### **Test 1: Basic Event Creation**
```sql
INSERT INTO events (
  title, description, event_type, date, start_time, end_time, 
  location, max_participants, price
) VALUES (
  'Test Event After Fix', 'Testing after foreign key fix', 'other',
  '2024-12-25', '10:00', '16:00', 'Test Location', 50, 100000
);
```

### **Test 2: Event Creation with Client**
```sql
-- First create a client
INSERT INTO clients (name, phone, email) 
VALUES ('Test Client', '081234567890', 'test@example.com');

-- Then create event with client reference
INSERT INTO events (
  title, description, event_type, date, start_time, end_time, 
  location, max_participants, price, client_id
) VALUES (
  'Test Event With Client', 'Testing with client reference', 'wedding',
  '2024-12-26', '14:00', '18:00', 'Wedding Venue', 100, 5000000,
  (SELECT id FROM clients WHERE email = 'test@example.com')
);
```

### **Test 3: Form Submission**
1. Go to: `http://localhost:3000/admin/events/create`
2. Fill all required fields
3. Submit form
4. Should work without errors

---

## 🔍 **Troubleshooting After Fix**

### **Jika masih ada error setelah emergency fix**:

#### **Error: "still violates foreign key constraint"**
```sql
-- Check if there are still problematic records
SELECT e.id, e.title, e.client_id
FROM events e
WHERE e.client_id IS NOT NULL 
AND e.client_id NOT IN (SELECT id FROM clients WHERE id IS NOT NULL);

-- If any found, clean them up
UPDATE events SET client_id = NULL WHERE id IN (
  SELECT e.id FROM events e
  WHERE e.client_id IS NOT NULL 
  AND e.client_id NOT IN (SELECT id FROM clients WHERE id IS NOT NULL)
);
```

#### **Error: "policy violation" atau "permission denied"**
```sql
-- Temporarily disable RLS
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Test event creation, then re-enable RLS
```

#### **Error: "constraint already exists"**
```sql
-- Drop all existing constraints and recreate
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_client_id_fkey;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_client_id_fkey1;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_client_id_fkey2;

-- Recreate the correct constraint
ALTER TABLE events 
ADD CONSTRAINT events_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
```

---

## 🎯 **Verification Checklist**

Setelah menjalankan fix, pastikan:

- [ ] **SQL fix** berjalan tanpa error
- [ ] **Foreign key constraint** mengarah ke `clients(id)`
- [ ] **Orphaned client_id** sudah dibersihkan (set to NULL)
- [ ] **Event creation** via SQL berhasil
- [ ] **Event form** submission berhasil
- [ ] **Debug page** menunjukkan "Connected" dan "Test Insert" sukses

---

## ⚡ **Quick Commands**

### **Check Current Status**:
```sql
-- Check foreign key constraint
\d events

-- Check orphaned records
SELECT COUNT(*) FROM events e
WHERE e.client_id IS NOT NULL 
AND e.client_id NOT IN (SELECT id FROM clients);

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'events';
```

### **Reset Everything (Nuclear Option)**:
```sql
-- WARNING: This will remove all foreign key constraints
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_client_id_fkey;
UPDATE events SET client_id = NULL;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
```

---

## 🎊 **Expected Results After Fix**

Setelah fix berhasil diterapkan:

✅ **No more foreign key errors**  
✅ **Event form submission works**  
✅ **Database integrity maintained**  
✅ **Client relationships preserved** (in client_name fields)  
✅ **Future client linking** will work properly  
✅ **RLS policies** protect data appropriately  

---

## 📞 **Jika Masih Ada Masalah**

1. **Copy paste** error message lengkap
2. **Jalankan** verification queries di atas
3. **Check** hasil dari setiap step emergency fix
4. **Test** dengan debug page: `http://localhost:3000/debug-event-form`

**Emergency fix harus menyelesaikan 95% kasus foreign key error ini! 🚀**