-- ====================================================================
-- CREATE ADMIN USER FOR TESTING
-- ====================================================================
-- Run this AFTER running 01_complete_photo_system.sql
-- This creates a test admin user for the photo system
-- ====================================================================

-- Step 1: Create admin user entry
-- ====================================================================
-- Note: You need to replace 'your-admin-email@example.com' with actual admin email
-- This email should match the one you use to sign up in your app

-- Insert admin user (replace email with your actual admin email)
INSERT INTO users (id, email, role, full_name, phone)
VALUES (
    -- Replace this UUID with your actual auth.users.id from Supabase Auth
    '00000000-0000-0000-0000-000000000000', -- REPLACE WITH REAL UUID
    'admin@photostudio.com',  -- REPLACE WITH YOUR EMAIL
    'admin',
    'Admin User',
    '+62812345678'
)
ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

-- Step 2: Create sample event for testing
-- ====================================================================
INSERT INTO events (title, description, date, location, access_code, status, created_by)
VALUES (
    'Test Wedding - John & Jane',
    'Wedding photography event for testing photo upload system',
    CURRENT_DATE,
    'Jakarta, Indonesia', 
    'WEDDING2024',
    'published',
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
)
ON CONFLICT (access_code) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    status = 'published';

-- Step 3: Verification
-- ====================================================================
-- Check if admin user was created
SELECT 
    id,
    email,
    role,
    full_name,
    created_at
FROM users 
WHERE role = 'admin';

-- Check if test event was created
SELECT 
    id,
    title,
    access_code,
    status,
    date
FROM events 
WHERE access_code = 'WEDDING2024';

-- ====================================================================
-- IMPORTANT NOTES:
-- ====================================================================
-- 1. Replace the UUID and email above with real values
-- 2. The UUID should match your Supabase Auth user ID
-- 3. You can find your Auth user ID in Supabase Dashboard > Authentication > Users
-- 4. After running this, you can login with the admin email and test uploads
-- ====================================================================

-- Step 4: Grant additional permissions if needed
-- ====================================================================
-- Ensure the admin user has proper permissions
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        RAISE NOTICE 'Admin user found: %', admin_user_id;
        RAISE NOTICE 'Setup complete! You can now login and test photo uploads.';
    ELSE
        RAISE WARNING 'No admin user found. Please check the UUID and email in the script.';
    END IF;
END $$;