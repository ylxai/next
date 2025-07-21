-- Database functions for admin role management
-- These functions should be executed in your Supabase SQL Editor

-- 1. Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  );
$$;

-- 2. Function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM user_roles WHERE user_id = auth.uid()),
    'user'
  );
$$;

-- 3. Function to set user role (admin only)
CREATE OR REPLACE FUNCTION set_user_role(user_email text, new_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  current_user_is_admin boolean;
BEGIN
  -- Check if current user is admin
  SELECT is_admin() INTO current_user_is_admin;
  
  IF NOT current_user_is_admin THEN
    RAISE EXCEPTION 'Akses ditolak. Hanya admin yang dapat mengubah peran pengguna.';
  END IF;
  
  -- Validate role
  IF new_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Peran tidak valid. Harus admin atau user.';
  END IF;
  
  -- Get user ID from email
  SELECT au.id INTO target_user_id
  FROM auth.users au
  WHERE au.email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna dengan email % tidak ditemukan.', user_email;
  END IF;
  
  -- Insert or update user role
  INSERT INTO user_roles (user_id, role, updated_at)
  VALUES (target_user_id, new_role, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;
  
  RETURN json_build_object(
    'success', true,
    'user_email', user_email,
    'new_role', new_role,
    'updated_at', NOW()
  );
END;
$$;

-- 4. Function to get all users with their roles (admin only)
CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS table(
  id uuid,
  email text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak. Hanya admin yang dapat melihat daftar pengguna.';
  END IF;
  
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    COALESCE(ur.role, 'user') as role,
    au.created_at,
    au.last_sign_in_at
  FROM auth.users au
  LEFT JOIN user_roles ur ON au.id = ur.user_id
  WHERE au.email IS NOT NULL
  ORDER BY au.created_at DESC;
END;
$$;

-- 5. Function to remove user role (admin only)
CREATE OR REPLACE FUNCTION remove_user_role(user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  current_user_is_admin boolean;
BEGIN
  -- Check if current user is admin
  SELECT is_admin() INTO current_user_is_admin;
  
  IF NOT current_user_is_admin THEN
    RAISE EXCEPTION 'Akses ditolak. Hanya admin yang dapat menghapus peran pengguna.';
  END IF;
  
  -- Get user ID from email
  SELECT au.id INTO target_user_id
  FROM auth.users au
  WHERE au.email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna dengan email % tidak ditemukan.', user_email;
  END IF;
  
  -- Delete user role (defaults to 'user')
  DELETE FROM user_roles 
  WHERE user_id = target_user_id;
  
  RETURN json_build_object(
    'success', true,
    'user_email', user_email,
    'message', 'Peran admin dihapus, pengguna kembali ke role user',
    'updated_at', NOW()
  );
END;
$$;

-- 6. Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 7. Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for user_roles
-- Policy for users to see their own role
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy for admins to manage all roles
CREATE POLICY "Admins can manage all roles" ON user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION set_user_role(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_with_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION remove_user_role(text) TO authenticated;

-- 10. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Example: Create first admin user (replace 'admin@example.com' with actual admin email)
-- INSERT INTO user_roles (user_id, role)
-- SELECT au.id, 'admin'
-- FROM auth.users au
-- WHERE au.email = 'admin@example.com'
-- ON CONFLICT (user_id) DO NOTHING;