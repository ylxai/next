-- ====================================
-- FIX: Infinite Recursion in RLS Policies
-- ====================================

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Step 2: Temporarily disable RLS for immediate access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ====================================
-- OPTION A: Simple Policies (Recommended for Development)
-- ====================================

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own data
CREATE POLICY "authenticated_read_own" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Allow authenticated users to update their own data
CREATE POLICY "authenticated_update_own" ON users
  FOR UPDATE 
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own data (for signup)
CREATE POLICY "authenticated_insert_own" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ====================================
-- OPTION B: Admin Policies (Without Recursion)
-- ====================================

-- Create a function to check admin role without recursion
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

-- Admin can read all users (using function)
CREATE POLICY "admin_read_all" ON users
  FOR SELECT 
  USING (is_admin());

-- Admin can update all users (using function)
CREATE POLICY "admin_update_all" ON users
  FOR UPDATE 
  USING (is_admin());

-- ====================================
-- OPTION C: Disable RLS Completely (Testing Only)
-- ====================================

-- Uncomment this line if you want to disable RLS completely for testing
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ====================================
-- VERIFICATION QUERIES
-- ====================================

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Test user access
SELECT id, email, role FROM users WHERE id = auth.uid();

-- ====================================
-- EMERGENCY RESET (If still having issues)
-- ====================================

-- Use this if you need to completely reset RLS:
/*
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_own" ON users;
DROP POLICY IF EXISTS "authenticated_update_own" ON users;
DROP POLICY IF EXISTS "authenticated_insert_own" ON users;
DROP POLICY IF EXISTS "admin_read_all" ON users;
DROP POLICY IF EXISTS "admin_update_all" ON users;
DROP FUNCTION IF EXISTS is_admin();
*/