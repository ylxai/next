-- Fix RLS policies for photos table to allow uploads
-- This migration fixes "new row violates row-level security policy" error

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view photos" ON photos;
DROP POLICY IF EXISTS "Users can insert photos" ON photos;
DROP POLICY IF EXISTS "Users can update own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON photos;
DROP POLICY IF EXISTS "Admins can manage all photos" ON photos;

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
    WITH CHECK (
        auth.uid() = uploaded_by OR -- User can upload their own photos
        auth.uid() IN ( -- Or user is admin
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy 3: Allow users to update their own photos or admins to update any
CREATE POLICY "Users can update own photos" ON photos
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = uploaded_by OR -- User owns the photo
        auth.uid() IN ( -- Or user is admin
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() = uploaded_by OR -- User owns the photo
        auth.uid() IN ( -- Or user is admin
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy 4: Allow users to delete their own photos or admins to delete any
CREATE POLICY "Users can delete own photos" ON photos
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = uploaded_by OR -- User owns the photo
        auth.uid() IN ( -- Or user is admin
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy 5: Allow public read access for approved photos (for public gallery)
CREATE POLICY "Public can view approved photos" ON photos
    FOR SELECT
    TO anon
    USING (is_approved = true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON photos TO authenticated;
GRANT SELECT ON photos TO anon;

-- Ensure storage policies allow photo uploads
-- Note: This requires storage bucket policies to be set in Supabase dashboard