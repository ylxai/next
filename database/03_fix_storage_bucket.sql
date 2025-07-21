-- ====================================================================
-- FIX STORAGE BUCKET ACCESS ISSUES
-- ====================================================================
-- This script fixes common storage bucket access problems
-- Run this if bucket exists but app can't detect it
-- ====================================================================

-- Step 1: Check if bucket actually exists
-- ====================================================================
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'photos';

-- Step 2: Recreate bucket with proper settings if needed
-- ====================================================================
-- Delete and recreate bucket if it has wrong settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'photos', 
    'photos', 
    true, 
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/tiff', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/tiff', 'application/octet-stream'];

-- Step 3: Fix RLS on storage.buckets table
-- ====================================================================
-- Check current RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'buckets' AND schemaname = 'storage';

-- Disable RLS on storage.buckets to allow reading
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Or if you need RLS, create proper policy
-- ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
-- 
-- DROP POLICY IF EXISTS "Allow bucket access" ON storage.buckets;
-- CREATE POLICY "Allow bucket access" ON storage.buckets
--     FOR SELECT USING (true);

-- Step 4: Clean up and recreate storage policies
-- ====================================================================

-- Drop all existing storage policies for photos bucket
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Get all policies for storage.objects
    FOR policy_record IN
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname LIKE '%photo%'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON storage.objects';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Create new, working storage policies
CREATE POLICY "Photos bucket - public read" ON storage.objects
    FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Photos bucket - authenticated upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'photos' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Photos bucket - authenticated update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'photos' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Photos bucket - authenticated delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'photos' 
        AND auth.role() = 'authenticated'
    );

-- Step 5: Grant necessary permissions
-- ====================================================================
-- Grant storage permissions to authenticated users
GRANT SELECT ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;

-- Step 6: Test bucket access
-- ====================================================================
-- This should now work from the app
SELECT 
    'Bucket found!' as status,
    id,
    name,
    public,
    file_size_limit
FROM storage.buckets 
WHERE id = 'photos';

-- Check policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%photo%'
ORDER BY policyname;

-- Step 7: Test upload capability
-- ====================================================================
-- Try to list objects in bucket (should work now)
SELECT 
    name,
    bucket_id,
    created_at
FROM storage.objects 
WHERE bucket_id = 'photos'
LIMIT 5;

-- ====================================================================
-- VERIFICATION QUERY
-- ====================================================================
-- Run this to verify everything is working:

DO $$
DECLARE
    bucket_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Check bucket exists
    SELECT COUNT(*) INTO bucket_count
    FROM storage.buckets 
    WHERE id = 'photos';
    
    -- Check policies exist
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname LIKE '%photo%';
    
    IF bucket_count > 0 AND policy_count > 0 THEN
        RAISE NOTICE 'SUCCESS: Bucket and policies are properly configured!';
        RAISE NOTICE 'Bucket count: %, Policy count: %', bucket_count, policy_count;
    ELSE
        RAISE WARNING 'ISSUE: Bucket count: %, Policy count: %', bucket_count, policy_count;
    END IF;
END $$;

-- ====================================================================
-- MANUAL BUCKET CREATION (IF NEEDED)
-- ====================================================================
-- If the bucket still doesn't work, you can create it manually:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "Create bucket"
-- 3. Name: "photos"
-- 4. Set as Public: YES
-- 5. Then run the policies above manually
-- ====================================================================