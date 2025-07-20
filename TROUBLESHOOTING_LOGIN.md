# 🔧 Troubleshooting Login Issues - Photo Studio

## ❌ Problem: "Cannot login after creating admin account"

### Warning Message:
```
Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server.
```

## ✅ Solutions Applied

### 1. **Fixed Middleware Authentication**
- **Before**: Used `getSession()` (insecure)
- **After**: Using `getUser()` (secure & authenticated)

### 2. **Enhanced Login Flow**
- **Better error handling** dengan console logging
- **Database user verification** otomatis
- **Role checking** yang robust
- **Auto user creation** jika missing dari database

### 3. **Debug Tools Created**
- Debug page di `/debug-auth` untuk troubleshooting
- Console logging untuk tracking issues
- Visual status indicators

---

## 🧪 Step-by-Step Troubleshooting

### Step 1: Check Environment Variables
```bash
# Pastikan .env.local ada dan benar
cat .env.local

# Seharusnya berisi:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 2: Verify Database Schema
```sql
-- Check if users table exists and has correct structure
\d users

-- Should show:
-- id          | uuid                     | not null
-- email       | text                     | not null  
-- full_name   | text                     |
-- role        | text                     | default 'user'
-- created_at  | timestamp with time zone | default now()
-- updated_at  | timestamp with time zone | default now()
```

### Step 3: Debug Authentication
1. **Akses debug page**: `http://localhost:3000/debug-auth`
2. **Check status indicators**:
   - Session exists: ✅/❌
   - User authenticated: ✅/❌ 
   - User in database: ✅/❌
   - User role: admin/user/N/A
   - Is Admin: ✅/❌

### Step 4: Manual Verification
```sql
-- Check if user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'your-admin-email@example.com';

-- Check if user exists in users table
SELECT id, email, role, full_name 
FROM users 
WHERE email = 'your-admin-email@example.com';
```

---

## 🔍 Common Issues & Fixes

### Issue 1: Admin account created but can't login
**Symptoms**: 
- Setup admin succeeds
- Login fails with "tidak ada user data"

**Solution**:
```sql
-- Check if user exists in both tables
SELECT 
  a.id as auth_id, 
  a.email as auth_email,
  u.id as db_id,
  u.email as db_email,
  u.role
FROM auth.users a
LEFT JOIN users u ON a.id = u.id
WHERE a.email = 'your-admin-email';

-- If missing from users table, insert manually:
INSERT INTO users (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', 'admin'
FROM auth.users 
WHERE email = 'your-admin-email'
AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.users.id);
```

### Issue 2: User exists but not admin
**Symptoms**:
- Login succeeds
- "Anda tidak memiliki akses admin"

**Solution**:
```sql
-- Update user role to admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-admin-email';
```

### Issue 3: Database connection issues
**Symptoms**:
- "Failed to fetch" errors
- Connection timeouts

**Solutions**:
1. **Check Supabase URL & Key**:
   ```bash
   # Test connection
   curl -H "apikey: YOUR_ANON_KEY" \
        -H "Authorization: Bearer YOUR_ANON_KEY" \
        "https://your-project.supabase.co/rest/v1/users?select=*"
   ```

2. **Check RLS Policies**:
   ```sql
   -- Disable RLS temporarily for testing
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   
   -- Re-enable with proper policies after testing
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ```

### Issue 4: Email confirmation required
**Symptoms**:
- Setup admin succeeds but user not confirmed
- Can't login until email confirmed

**Solution**:
```sql
-- Manually confirm user
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'your-admin-email';
```

---

## 🛠️ Quick Fix Commands

### Reset Admin User
```sql
-- Delete existing admin (if corrupted)
DELETE FROM users WHERE email = 'admin@photostudio.com';
DELETE FROM auth.users WHERE email = 'admin@photostudio.com';

-- Then create new admin via /setup-admin
```

### Manual Admin Creation
```sql
-- Insert into auth.users first (replace values)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated', 
  'admin@photostudio.com',
  crypt('your-password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin Photo Studio"}'
);

-- Then insert into users table
INSERT INTO users (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', 'admin'
FROM auth.users 
WHERE email = 'admin@photostudio.com';
```

---

## 🔐 Security Checklist

### After Login Works:
- [ ] Remove debug page dari production
- [ ] Enable proper RLS policies
- [ ] Use strong passwords
- [ ] Enable 2FA if available
- [ ] Regular password updates
- [ ] Monitor access logs

### RLS Policies Setup:
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users  
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 📞 Getting Help

### Debug Information to Collect:
1. **Browser console logs** (F12 → Console)
2. **Network tab** untuk request failures
3. **Debug page output** (`/debug-auth`)
4. **Database query results** dari SQL commands
5. **Environment variables** (tanpa values sensitive)

### Debug Commands:
```bash
# Check app logs
npm run dev 
# Watch console for auth errors

# Test database connection
npm run test-db  # if available

# Check Supabase status
curl -I https://your-project.supabase.co/rest/v1/
```

**Login issue sudah diperbaiki dengan semua solutions di atas! 🎉**