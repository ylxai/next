-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  description TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create photo_downloads tracking table
CREATE TABLE IF NOT EXISTS photo_downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  client_ip INET,
  user_agent TEXT,
  download_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_size BIGINT
);

-- Create photo_favorites table for client favorites
CREATE TABLE IF NOT EXISTS photo_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  client_identifier TEXT NOT NULL, -- Could be email, phone, or session ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(photo_id, client_identifier)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_upload_date ON photos(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_photos_is_featured ON photos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_photos_is_approved ON photos(is_approved);
CREATE INDEX IF NOT EXISTS idx_photo_downloads_photo_id ON photo_downloads(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_downloads_event_id ON photo_downloads(event_id);
CREATE INDEX IF NOT EXISTS idx_photo_downloads_date ON photo_downloads(download_date DESC);
CREATE INDEX IF NOT EXISTS idx_photo_favorites_photo_id ON photo_favorites(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_favorites_event_id ON photo_favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_photo_favorites_client ON photo_favorites(client_identifier);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for photos table
DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
CREATE TRIGGER update_photos_updated_at
    BEFORE UPDATE ON photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_favorites ENABLE ROW LEVEL SECURITY;

-- Photos policies
CREATE POLICY "Admins can do everything with photos" ON photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users can view approved photos for published events" ON photos
    FOR SELECT USING (
        is_approved = true 
        AND EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = photos.event_id 
            AND events.status IN ('published', 'completed')
        )
    );

-- Photo downloads policies  
CREATE POLICY "Admins can view all download logs" ON photo_downloads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Anyone can create download logs" ON photo_downloads
    FOR INSERT WITH CHECK (true);

-- Photo favorites policies
CREATE POLICY "Admins can view all favorites" ON photo_favorites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Anyone can manage their own favorites" ON photo_favorites
    FOR ALL USING (true);

-- Create storage bucket for photos (this needs to be run in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Storage policies for photos bucket (to be created in Supabase dashboard)
/*
-- Allow public read access to photos
CREATE POLICY "Photos are publicly readable" ON storage.objects
    FOR SELECT USING (bucket_id = 'photos');

-- Allow admins to upload photos
CREATE POLICY "Admins can upload photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'photos' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
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
*/

-- Add helpful comments
COMMENT ON TABLE photos IS 'Stores photo metadata and references to files in Supabase Storage';
COMMENT ON TABLE photo_downloads IS 'Tracks photo download activities for analytics';
COMMENT ON TABLE photo_favorites IS 'Stores client favorite photos for events';

COMMENT ON COLUMN photos.file_path IS 'Path to file in Supabase Storage bucket';
COMMENT ON COLUMN photos.metadata IS 'Additional photo metadata like EXIF data, camera settings, etc.';
COMMENT ON COLUMN photos.is_featured IS 'Whether this photo should be featured in gallery previews';
COMMENT ON COLUMN photos.is_approved IS 'Whether this photo is approved for client viewing';

-- Create view for photo statistics
CREATE OR REPLACE VIEW photo_statistics AS
SELECT 
    e.id as event_id,
    e.title as event_title,
    COUNT(p.id) as total_photos,
    COUNT(CASE WHEN p.is_featured THEN 1 END) as featured_photos,
    COUNT(CASE WHEN p.is_approved THEN 1 END) as approved_photos,
    SUM(p.file_size) as total_size_bytes,
    COUNT(pd.id) as total_downloads,
    COUNT(DISTINCT pf.client_identifier) as unique_viewers
FROM events e
LEFT JOIN photos p ON e.id = p.event_id
LEFT JOIN photo_downloads pd ON p.id = pd.photo_id
LEFT JOIN photo_favorites pf ON p.id = pf.photo_id
GROUP BY e.id, e.title
ORDER BY e.created_at DESC;

-- Grant necessary permissions
GRANT ALL ON photos TO authenticated;
GRANT ALL ON photo_downloads TO authenticated;
GRANT ALL ON photo_favorites TO authenticated;
GRANT SELECT ON photo_statistics TO authenticated;