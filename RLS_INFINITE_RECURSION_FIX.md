# 🚨 RLS Infinite Recursion Fix - URGENT

## ❌ **Problem**: 
```
Gagal mengambil data user: infinite recursion detected in policy for relation "users"
```

## 🔍 **Root Cause**
RLS (Row Level Security) policies yang mengacu pada tabel yang sama dengan yang mereka lindungi, menciptakan **circular dependency**.

**Contoh Problematic Policy**:
```sql
-- ❌ INI SALAH - Menyebabkan infinite recursion
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users  -- 🚨 Query users table dalam policy users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## ✅ **INSTANT FIX** (Immediate Solution)

### Step 1: Disable RLS Temporarily
```sql
-- Jalankan di Supabase SQL Editor
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Step 2: Test Login
- Refresh aplikasi
- Coba login admin lagi
- Should work now! ✅

---

## 🛠️ **PERMANENT FIX** (Recommended)

### Option A: Simple Policies (Recommended for Development)
```sql
-- 1. Drop semua policies yang bermasalah
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- 2. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Create safe policies (no recursion)
CREATE POLICY "authenticated_read_own" ON users
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "authenticated_update_own" ON users
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "authenticated_insert_own" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
```

### Option B: Admin Policies with Function (Advanced)
```sql
-- 1. Create function to check admin (avoids recursion)
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create admin policies using function
CREATE POLICY "admin_read_all" ON users
  FOR SELECT 
  USING (is_admin());

CREATE POLICY "admin_update_all" ON users
  FOR UPDATE 
  USING (is_admin());
```

---

## 🧪 **How to Test**

### Via Debug Page:
1. Buka `http://localhost:3000/debug-auth`
2. Check "RLS Status" indicator
3. Should show "✅ Working" instead of "🚨 Infinite Recursion"

### Via Login:
1. Login dengan admin credentials
2. Should redirect ke `/admin/dashboard` ✅
3. No more database errors

### Via Browser Console:
```javascript
// Should return user data, not error
console.log("User data loaded successfully");
```

---

## 🔧 **Debug Tools Available**

### 1. Debug Page
- URL: `/debug-auth`
- Shows RLS status
- One-click fix button
- SQL commands ready to copy

### 2. Console Logging
```javascript
// Check browser console (F12) for:
"Login berhasil: user@example.com"
"User data: {id: '...', role: 'admin'}"
```

### 3. SQL Verification
```sql
-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Test user access
SELECT id, email, role FROM users WHERE id = auth.uid();
```

---

## 🚨 **Prevention**

### ❌ DON'T Do This:
```sql
-- Recursion: Policy queries same table it protects
CREATE POLICY "bad_policy" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE ...)  -- 🚨 RECURSIVE!
  );
```

### ✅ DO This Instead:
```sql
-- Safe: Policy uses auth.uid() directly
CREATE POLICY "good_policy" ON users
  FOR SELECT USING (auth.uid() = id);

-- Safe: Policy uses separate function
CREATE POLICY "good_admin_policy" ON users
  FOR SELECT USING (is_admin());
```

---

## 📋 **Quick Commands Reference**

### Emergency Reset:
```sql
-- Nuclear option: Remove all RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Production Setup:
```sql
-- Minimal safe policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "auth_update_own" ON users FOR UPDATE USING (auth.uid() = id);
```

### Check Status:
```sql
-- Verify RLS is working
\d+ users
SELECT * FROM pg_policies WHERE tablename = 'users';
```

---

## 🎯 **Next Steps After Fix**

1. ✅ **Test login** - Should work now
2. ✅ **Access admin dashboard** - Should redirect properly  
3. ✅ **Setup proper RLS** for production (Option A or B above)
4. ✅ **Remove debug page** before production deployment
5. ✅ **Monitor logs** untuk ensure no more recursion errors

---

## 📞 **Still Having Issues?**

### Check These:
1. **Environment variables** - Supabase URL & key correct?
2. **Network connection** - Can reach Supabase?
3. **User exists** - In both auth.users and users tables?
4. **Role set** - User has 'admin' role?

### Get Help:
1. Use `/debug-auth` page for diagnosis
2. Check browser console for errors
3. Run SQL verification commands
4. Check Supabase dashboard logs

**🎉 RLS Infinite Recursion should now be FIXED! Login dapat berfungsi normal.**