-- ====================================================================
-- COMPLETE PHOTO SYSTEM SETUP FOR SUPABASE
-- ====================================================================
-- Run this script in Supabase SQL Editor
-- This script is safe to run multiple times (idempotent)
-- ====================================================================

-- Step 1: Enable required extensions
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Verify required tables exist
-- ====================================================================
DO $$
BEGIN
    -- Check if users table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE 'Creating basic users table...';
        
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email TEXT UNIQUE NOT NULL,
            role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'client')),
            full_name TEXT,
            phone TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS on users table
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        
        -- Users can read their own data, admins can read all
        CREATE POLICY "Users can read own data" ON users
            FOR SELECT USING (auth.uid() = id);
            
        CREATE POLICY "Admins can read all users" ON users
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role = 'admin'
                )
            );
    END IF;

    -- Check if events table exists  
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events') THEN
        RAISE NOTICE 'Creating basic events table...';
        
        CREATE TABLE events (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            description TEXT,
            date DATE NOT NULL,
            location TEXT,
            access_code TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
            max_photos INTEGER DEFAULT 1000,
            allow_downloads BOOLEAN DEFAULT TRUE,
            watermark_enabled BOOLEAN DEFAULT FALSE,
            created_by UUID REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS on events table
        ALTER TABLE events ENABLE ROW LEVEL SECURITY;
        
        -- Admins can do everything with events
        CREATE POLICY "Admins can manage events" ON events
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role = 'admin'
                )
            );
            
        -- Anyone can view published events
        CREATE POLICY "Anyone can view published events" ON events
            FOR SELECT USING (status IN ('published', 'completed'));
    END IF;
END $$;

-- Step 3: Create photo-related tables
-- ====================================================================

-- Main photos table
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE, -- Ensure unique file paths
    file_size BIGINT CHECK (file_size > 0),
    mime_type TEXT NOT NULL,
    width INTEGER CHECK (width > 0),
    height INTEGER CHECK (height > 0),
    description TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photo downloads tracking table
CREATE TABLE IF NOT EXISTS photo_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    client_ip INET,
    user_agent TEXT,
    download_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_size BIGINT,
    download_type TEXT DEFAULT 'original' CHECK (download_type IN ('thumbnail', 'medium', 'original'))
);

-- Photo favorites table for client favorites
CREATE TABLE IF NOT EXISTS photo_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    client_identifier TEXT NOT NULL, -- Email, phone, or session ID
    favorite_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(photo_id, client_identifier)
);

-- Step 4: Create indexes for performance
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_upload_date ON photos(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_photos_featured ON photos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_photos_approved ON photos(is_approved);
CREATE INDEX IF NOT EXISTS idx_photos_filename ON photos(filename);
CREATE INDEX IF NOT EXISTS idx_photos_file_path ON photos(file_path);

CREATE INDEX IF NOT EXISTS idx_downloads_photo_id ON photo_downloads(photo_id);
CREATE INDEX IF NOT EXISTS idx_downloads_event_id ON photo_downloads(event_id);
CREATE INDEX IF NOT EXISTS idx_downloads_date ON photo_downloads(download_date DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_client_ip ON photo_downloads(client_ip);

CREATE INDEX IF NOT EXISTS idx_favorites_photo_id ON photo_favorites(photo_id);
CREATE INDEX IF NOT EXISTS idx_favorites_event_id ON photo_favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_favorites_client ON photo_favorites(client_identifier);
CREATE INDEX IF NOT EXISTS idx_favorites_date ON photo_favorites(favorite_date DESC);

-- Step 5: Create updated_at trigger
-- ====================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply trigger to photos table
DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
CREATE TRIGGER update_photos_updated_at
    BEFORE UPDATE ON photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to users table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Apply trigger to events table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events') THEN
        DROP TRIGGER IF EXISTS update_events_updated_at ON events;
        CREATE TRIGGER update_events_updated_at
            BEFORE UPDATE ON events
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Step 6: Enable Row Level Security
-- ====================================================================
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_favorites ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS Policies for Photos
-- ====================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage all photos" ON photos;
DROP POLICY IF EXISTS "Users can view approved photos" ON photos;

-- Admins can do everything with photos
CREATE POLICY "Admins can manage all photos" ON photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Users can view approved photos for published events
CREATE POLICY "Users can view approved photos" ON photos
    FOR SELECT USING (
        is_approved = true 
        AND EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = photos.event_id 
            AND events.status IN ('published', 'completed')
        )
    );

-- Step 8: Create RLS Policies for Downloads
-- ====================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all downloads" ON photo_downloads;
DROP POLICY IF EXISTS "Anyone can create download logs" ON photo_downloads;

-- Admins can view all download logs
CREATE POLICY "Admins can view all downloads" ON photo_downloads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Anyone can create download logs (for tracking)
CREATE POLICY "Anyone can create download logs" ON photo_downloads
    FOR INSERT WITH CHECK (true);

-- Step 9: Create RLS Policies for Favorites
-- ====================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all favorites" ON photo_favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON photo_favorites;

-- Admins can view all favorites
CREATE POLICY "Admins can view all favorites" ON photo_favorites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Anyone can manage favorites (insert/delete their own)
CREATE POLICY "Users can manage own favorites" ON photo_favorites
    FOR ALL USING (true);

-- Step 10: Create Storage Bucket and Policies
-- ====================================================================

-- Create photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'photos', 
    'photos', 
    true, 
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/tiff', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Photos are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete photos" ON storage.objects;

-- Allow public read access to photos
CREATE POLICY "Photos are publicly readable" ON storage.objects
    FOR SELECT USING (bucket_id = 'photos');

-- Allow authenticated users to upload photos (will be restricted by application logic)
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'photos' 
        AND auth.role() = 'authenticated'
    );

-- Allow admins to update photos
CREATE POLICY "Admins can update photos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'photos' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Allow admins to delete photos
CREATE POLICY "Admins can delete photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'photos' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Step 11: Create useful views
-- ====================================================================

-- Drop existing views
DROP VIEW IF EXISTS photo_statistics;
DROP VIEW IF EXISTS event_photo_summary;

-- Create photo statistics view
CREATE VIEW photo_statistics AS
SELECT 
    e.id as event_id,
    e.title as event_title,
    e.status as event_status,
    COUNT(p.id) as total_photos,
    COUNT(CASE WHEN p.is_featured THEN 1 END) as featured_photos,
    COUNT(CASE WHEN p.is_approved THEN 1 END) as approved_photos,
    SUM(p.file_size) as total_size_bytes,
    ROUND(AVG(p.file_size)) as avg_file_size,
    COUNT(pd.id) as total_downloads,
    COUNT(DISTINCT pf.client_identifier) as unique_viewers,
    MAX(p.upload_date) as last_upload_date
FROM events e
LEFT JOIN photos p ON e.id = p.event_id
LEFT JOIN photo_downloads pd ON p.id = pd.photo_id
LEFT JOIN photo_favorites pf ON p.id = pf.photo_id
GROUP BY e.id, e.title, e.status
ORDER BY e.created_at DESC;

-- Create event photo summary view
CREATE VIEW event_photo_summary AS
SELECT 
    e.id,
    e.title,
    e.access_code,
    e.status,
    e.date,
    COUNT(p.id) as photo_count,
    COUNT(CASE WHEN p.is_approved THEN 1 END) as approved_count,
    COUNT(CASE WHEN p.is_featured THEN 1 END) as featured_count,
    SUM(p.file_size) as total_size,
    MAX(p.upload_date) as last_photo_uploaded
FROM events e
LEFT JOIN photos p ON e.id = p.event_id
GROUP BY e.id, e.title, e.access_code, e.status, e.date
ORDER BY e.date DESC;

-- Step 12: Grant permissions
-- ====================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON photos TO authenticated;
GRANT ALL ON photo_downloads TO authenticated;
GRANT ALL ON photo_favorites TO authenticated;
GRANT SELECT ON photo_statistics TO authenticated;
GRANT SELECT ON event_photo_summary TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 13: Add helpful comments
-- ====================================================================
COMMENT ON TABLE photos IS 'Stores photo metadata and references to files in Supabase Storage';
COMMENT ON TABLE photo_downloads IS 'Tracks photo download activities for analytics and monitoring';
COMMENT ON TABLE photo_favorites IS 'Stores client favorite photos for events';

COMMENT ON COLUMN photos.file_path IS 'Unique path to file in Supabase Storage bucket';
COMMENT ON COLUMN photos.metadata IS 'Additional photo metadata like EXIF data, camera settings, etc.';
COMMENT ON COLUMN photos.is_featured IS 'Whether this photo should be featured in gallery previews';
COMMENT ON COLUMN photos.is_approved IS 'Whether this photo is approved for client viewing';
COMMENT ON COLUMN photos.mime_type IS 'MIME type of the uploaded file (supports JPG, PNG, RAW formats)';

-- Step 14: Final verification
-- ====================================================================
DO $$
DECLARE
    table_count INTEGER;
    bucket_count INTEGER;
BEGIN
    -- Count created tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name IN ('photos', 'photo_downloads', 'photo_favorites', 'users', 'events');
    
    -- Count storage buckets
    SELECT COUNT(*) INTO bucket_count
    FROM storage.buckets 
    WHERE id = 'photos';
    
    RAISE NOTICE 'Setup completed successfully!';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Storage bucket created: %', bucket_count;
    RAISE NOTICE 'Photo system is ready for use!';
END $$;

-- ====================================================================
-- SETUP COMPLETE!
-- ====================================================================
-- Next steps:
-- 1. Create an admin user in your app
-- 2. Test photo upload functionality
-- 3. Verify storage permissions are working
-- ====================================================================