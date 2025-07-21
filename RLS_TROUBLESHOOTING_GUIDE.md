# 🔒 RLS TROUBLESHOOTING GUIDE

## 🚨 ERROR: "new row violates row-level security policy"

### **Root Cause:**
Row-Level Security (RLS) policies di Supabase memblokir operasi insert/update/delete karena user tidak memiliki permission yang tepat.

## 🛠️ QUICK FIX - STEP BY STEP

### **1. 🔑 Setup RLS Policies in Supabase**

**Copy dan paste script ini di Supabase SQL Editor:**

```sql
-- Fix RLS policies for photos upload
-- Run this in Supabase > SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view photos" ON photos;
DROP POLICY IF EXISTS "Users can insert photos" ON photos;
DROP POLICY IF EXISTS "Users can update own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON photos;
DROP POLICY IF EXISTS "Public can view approved photos" ON photos;

-- Enable RLS on photos table
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow all authenticated users to view photos
CREATE POLICY "Users can view photos" ON photos
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Allow authenticated users to insert photos
CREATE POLICY "Users can insert photos" ON photos
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = uploaded_by);

-- Policy 3: Allow users to update their own photos
CREATE POLICY "Users can update own photos" ON photos
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = uploaded_by)
    WITH CHECK (auth.uid() = uploaded_by);

-- Policy 4: Allow users to delete their own photos
CREATE POLICY "Users can delete own photos" ON photos
    FOR DELETE
    TO authenticated
    USING (auth.uid() = uploaded_by);

-- Policy 5: Allow public read access for approved photos
CREATE POLICY "Public can view approved photos" ON photos
    FOR SELECT
    TO anon
    USING (is_approved = true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON photos TO authenticated;
GRANT SELECT ON photos TO anon;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

### **2. 📂 Setup Storage Bucket Policies**

**Di Supabase Dashboard > Storage > Policies:**

1. **Create policy untuk UPLOAD:**
   - Name: `Allow authenticated upload`
   - Allowed operations: `INSERT`
   - Target roles: `authenticated`  
   - Policy: `bucket_id = 'photos'`

2. **Create policy untuk READ:**
   - Name: `Public can view photos`
   - Allowed operations: `SELECT`
   - Target roles: `public`
   - Policy: `bucket_id = 'photos'`

3. **Create policy untuk DELETE:**
   - Name: `Users can delete own photos`
   - Allowed operations: `DELETE`
   - Target roles: `authenticated`
   - Policy: `bucket_id = 'photos'`

### **3. 🔍 Verify RLS Policies**

**Run verification queries di Supabase SQL Editor:**

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'photos' 
AND schemaname = 'public';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'photos'
ORDER BY policyname;
```

Expected results:
- `rowsecurity` should be `true`
- You should see 5 policies listed

### **4. 🧪 Test Authentication**

**Test di browser console:**

```javascript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// If no user, login first
if (!user) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'your-email@example.com',
    password: 'your-password'
  });
  console.log('Login result:', data, error);
}
```

## 🚨 COMMON ISSUES & SOLUTIONS

### **Issue 1: User not authenticated**

**Symptoms:**
```bash
Error: Authentication required - no valid user session found
```

**Solution:**
```bash
1. Make sure you're logged in
2. Check browser localStorage for auth token
3. Verify session is not expired
4. Try login again
```

### **Issue 2: uploaded_by field not set**

**Symptoms:**
```bash
Error: new row violates row-level security policy for table "photos"
```

**Solution:**
```typescript
// Make sure API sets uploaded_by correctly
const photoData = {
  // ... other fields
  uploaded_by: user.id, // CRITICAL: Must match auth.uid()
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};
```

### **Issue 3: Storage bucket permissions**

**Symptoms:**
```bash
Error: Failed to upload to storage
```

**Solution:**
```bash
1. Go to Supabase > Storage > photos bucket
2. Make sure bucket is public
3. Set up proper storage policies (see step 2 above)
4. Check bucket exists and is named 'photos'
```

### **Issue 4: Table permissions missing**

**Symptoms:**
```bash
Error: permission denied for table photos
```

**Solution:**
```sql
-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON photos TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

## 🔧 DEBUGGING TOOLS

### **1. Check Current User & Session**

```typescript
// Add this to your component for debugging
useEffect(() => {
  const checkAuth = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('Current user:', user);
    console.log('Auth error:', error);
    
    if (user) {
      console.log('User ID:', user.id);
      console.log('User email:', user.email);
      console.log('User role:', user.user_metadata?.role);
    }
  };
  
  checkAuth();
}, []);
```

### **2. Test Database Insert**

```sql
-- Test manual insert in Supabase SQL Editor
-- (Make sure you're authenticated first)
INSERT INTO photos (
    filename, 
    original_filename, 
    file_path, 
    file_size, 
    mime_type, 
    uploaded_by,
    is_approved
) VALUES (
    'test.jpg', 
    'test.jpg', 
    'photos/test.jpg', 
    1024, 
    'image/jpeg', 
    auth.uid(),  -- This should work if authenticated
    true
);
```

### **3. Monitor API Logs**

```bash
# Check browser DevTools > Network tab
# Look for 401/403 errors
# Check response body for detailed error messages

# Check server logs for:
- "Authentication error"
- "RLS Policy Error"
- "Database error"
```

## 📊 VERIFICATION CHECKLIST

### **✅ Pre-Upload Checklist:**

- [ ] User is logged in (`auth.uid()` returns value)
- [ ] RLS policies are enabled on `photos` table
- [ ] Storage bucket `photos` exists and is accessible
- [ ] Storage policies allow authenticated upload
- [ ] API route sets `uploaded_by: user.id`

### **✅ Post-Fix Verification:**

```bash
1. Try upload a test photo
2. Check console for any errors
3. Verify photo appears in Supabase photos table
4. Check uploaded_by field matches user ID
5. Test photo appears in gallery
```

## 🎯 TROUBLESHOOTING BY ERROR MESSAGE

### **"Authentication required"**
- User not logged in
- Session expired
- Auth token invalid

**Fix:** Login again, check session

### **"row-level security policy violation"**
- RLS policies not set up correctly
- uploaded_by field missing/incorrect
- User doesn't have permission

**Fix:** Run RLS setup script above

### **"Failed to upload to storage"**
- Storage bucket missing
- Storage policies not configured
- Bucket not accessible

**Fix:** Setup storage policies

### **"Permission denied for table photos"**
- Table permissions not granted
- User role insufficient

**Fix:** Grant table permissions

## 🚀 TESTING WORKFLOW

### **1. Manual Test:**
```bash
1. Login to your app
2. Go to admin dashboard
3. Try upload a photo via free upload
4. Check for any console errors
5. Verify photo appears in gallery
```

### **2. API Test:**
```bash
curl -X POST http://localhost:3000/api/photos/free-upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@test.jpg" \
  -F "description=Test upload" \
  -F "auto_approve=true"
```

### **3. Database Test:**
```sql
-- Check if photo was inserted correctly
SELECT id, filename, uploaded_by, created_at 
FROM photos 
ORDER BY created_at DESC 
LIMIT 5;
```

## ⚡ QUICK COMMANDS

### **Reset All RLS Policies:**
```sql
-- Nuclear option: disable RLS temporarily for testing
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
```

### **Check Auth Status:**
```javascript
// In browser console
const user = await supabase.auth.getUser();
console.log(user);
```

### **Force Re-login:**
```javascript
// Clear session and login again
await supabase.auth.signOut();
await supabase.auth.signInWithPassword({
  email: 'your-email@domain.com',
  password: 'your-password'
});
```

## 🎉 SUCCESS INDICATORS

**✅ Upload working correctly when you see:**

```bash
✅ Console: "Authenticated user ID: [uuid]"
✅ Console: "Photo uploaded successfully"
✅ Network: POST /api/photos/free-upload returns 200
✅ Database: New row in photos table with correct uploaded_by
✅ UI: Photo appears in gallery immediately
✅ No console errors about RLS or permissions
```

**Setup RLS policies dengan script di atas, dan upload foto akan berfungsi dengan sempurna!** 🚀✨