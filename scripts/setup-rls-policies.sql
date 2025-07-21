-- Run this script in your Supabase SQL Editor to fix RLS policies
-- This will resolve "new row violates row-level security policy" errors

-- ==================================================
-- PHOTOS TABLE RLS POLICIES
-- ==================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view photos" ON photos;
DROP POLICY IF EXISTS "Users can insert photos" ON photos;
DROP POLICY IF EXISTS "Users can update own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON photos;
DROP POLICY IF EXISTS "Admins can manage all photos" ON photos;
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

-- Policy 3: Allow users to update their own photos or admins to update any
CREATE POLICY "Users can update own photos" ON photos
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = uploaded_by)
    WITH CHECK (auth.uid() = uploaded_by);

-- Policy 4: Allow users to delete their own photos or admins to delete any
CREATE POLICY "Users can delete own photos" ON photos
    FOR DELETE
    TO authenticated
    USING (auth.uid() = uploaded_by);

-- Policy 5: Allow public read access for approved photos (for public gallery)
CREATE POLICY "Public can view approved photos" ON photos
    FOR SELECT
    TO anon
    USING (is_approved = true);

-- ==================================================
-- EVENTS TABLE RLS POLICIES
-- ==================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view events" ON events;
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;
DROP POLICY IF EXISTS "Public can view active events" ON events;

-- Enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to view all events
CREATE POLICY "Users can view events" ON events
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Allow authenticated users to create events
CREATE POLICY "Users can create events" ON events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Policy 3: Allow users to update their own events
CREATE POLICY "Users can update own events" ON events
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Policy 4: Allow users to delete their own events
CREATE POLICY "Users can delete own events" ON events
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Policy 5: Allow public access to active events by access_code
CREATE POLICY "Public can view active events" ON events
    FOR SELECT
    TO anon
    USING (status = 'active' AND access_code IS NOT NULL);

-- ==================================================
-- USERS TABLE RLS POLICIES (if exists)
-- ==================================================

-- Only enable if you have a custom users table
-- DROP POLICY IF EXISTS "Users can view own profile" ON users;
-- DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view own profile" ON users
--     FOR SELECT
--     TO authenticated
--     USING (auth.uid() = id);

-- CREATE POLICY "Users can update own profile" ON users
--     FOR UPDATE
--     TO authenticated
--     USING (auth.uid() = id)
--     WITH CHECK (auth.uid() = id);

-- ==================================================
-- GRANT PERMISSIONS
-- ==================================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON photos TO authenticated;
GRANT SELECT ON photos TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT ON events TO anon;

-- Grant usage on sequences (for auto-increment IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ==================================================
-- STORAGE BUCKET POLICIES
-- ==================================================

-- Note: Storage bucket policies need to be set in Supabase dashboard or via API
-- Go to Storage > Policies in your Supabase dashboard and add these:

-- 1. Allow authenticated users to upload photos:
--    Operation: INSERT
--    Target roles: authenticated
--    Policy: (bucket_id = 'photos')

-- 2. Allow public read access to approved photos:
--    Operation: SELECT
--    Target roles: public
--    Policy: (bucket_id = 'photos')

-- 3. Allow users to delete their own photos:
--    Operation: DELETE
--    Target roles: authenticated
--    Policy: (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1])

-- ==================================================
-- VERIFICATION QUERIES
-- ==================================================

-- Run these to verify your policies are working:

-- 1. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('photos', 'events') 
AND schemaname = 'public';

-- 2. Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('photos', 'events')
ORDER BY tablename, policyname;

-- 3. Test photo insertion (run this after authenticating)
-- INSERT INTO photos (
--     filename, 
--     original_filename, 
--     file_path, 
--     file_size, 
--     mime_type, 
--     uploaded_by,
--     is_approved
-- ) VALUES (
--     'test.jpg', 
--     'test.jpg', 
--     'photos/test.jpg', 
--     1024, 
--     'image/jpeg', 
--     auth.uid(),
--     true
-- );

NOTIFY pgrst, 'reload schema';