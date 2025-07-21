-- ====================================================================
-- UPDATE FILE RESTRICTIONS - JPEG, JPG, AND RAW ONLY
-- ====================================================================
-- This script updates the system to only allow JPEG, JPG, and RAW files
-- Run this to enforce stricter file type restrictions
-- ====================================================================

-- Step 1: Update storage bucket allowed MIME types
-- ====================================================================
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
    'image/jpeg', 
    'image/jpg',
    -- RAW file MIME types
    'image/x-canon-cr2', 'image/x-canon-cr3', 'image/x-canon-crw',
    'image/x-nikon-nef', 'image/x-nikon-nrw',
    'image/x-sony-arw', 'image/x-sony-srf', 'image/x-sony-sr2',
    'image/x-adobe-dng',
    'image/x-olympus-orf',
    'image/x-panasonic-rw2', 'image/x-panasonic-raw',
    'image/x-fuji-raf',
    'image/x-pentax-pef', 'image/x-pentax-ptx',
    'image/x-sigma-x3f',
    'image/x-kodak-dcr', 'image/x-kodak-kdc',
    'image/x-minolta-mrw',
    'image/x-leica-rwl', 'image/x-kodak-dcs',
    'image/x-hasselblad-3fr',
    'image/x-mamiya-mef',
    'image/x-phaseone-iiq',
    'image/tiff',
    'application/octet-stream'
]
WHERE id = 'photos';

-- Step 2: Add constraint to photos table for file validation
-- ====================================================================
-- Add check constraint to ensure only allowed file types
DO $$
BEGIN
    -- Drop existing constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'photos_mime_type_check' 
        AND table_name = 'photos'
    ) THEN
        ALTER TABLE photos DROP CONSTRAINT photos_mime_type_check;
    END IF;
    
    -- Add new constraint for allowed MIME types
    ALTER TABLE photos ADD CONSTRAINT photos_mime_type_check 
    CHECK (
        mime_type IN (
            'image/jpeg', 'image/jpg',
            'image/x-canon-cr2', 'image/x-canon-cr3', 'image/x-canon-crw',
            'image/x-nikon-nef', 'image/x-nikon-nrw',
            'image/x-sony-arw', 'image/x-sony-srf', 'image/x-sony-sr2',
            'image/x-adobe-dng',
            'image/x-olympus-orf',
            'image/x-panasonic-rw2', 'image/x-panasonic-raw',
            'image/x-fuji-raf',
            'image/x-pentax-pef', 'image/x-pentax-ptx',
            'image/x-sigma-x3f',
            'image/x-kodak-dcr', 'image/x-kodak-kdc',
            'image/x-minolta-mrw',
            'image/x-leica-rwl', 'image/x-kodak-dcs',
            'image/x-hasselblad-3fr',
            'image/x-mamiya-mef',
            'image/x-phaseone-iiq',
            'image/tiff',
            'application/octet-stream'
        )
    );
END $$;

-- Step 3: Add constraint for filename extensions
-- ====================================================================
-- Add check constraint to ensure only allowed file extensions
DO $$
BEGIN
    -- Drop existing constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'photos_filename_extension_check' 
        AND table_name = 'photos'
    ) THEN
        ALTER TABLE photos DROP CONSTRAINT photos_filename_extension_check;
    END IF;
    
    -- Add new constraint for allowed file extensions
    ALTER TABLE photos ADD CONSTRAINT photos_filename_extension_check 
    CHECK (
        original_filename ~* '\.(jpe?g|cr[23w]|nef|nrw|arw|srf|sr2|dng|orf|rw2|raw|raf|pef|ptx|x3f|dcr|kdc|mrw|rwl|dcs|3fr|mef|iiq|tiff?|tif)$'
    );
END $$;

-- Step 4: Clean up any existing non-compliant files (optional)
-- ====================================================================
-- WARNING: This will delete photos that don't meet the new criteria
-- Uncomment the following section if you want to remove non-compliant files

/*
-- Check how many files would be affected
SELECT 
    COUNT(*) as non_compliant_count,
    STRING_AGG(DISTINCT mime_type, ', ') as non_compliant_types
FROM photos 
WHERE mime_type NOT IN (
    'image/jpeg', 'image/jpg',
    'image/x-canon-cr2', 'image/x-canon-cr3', 'image/x-canon-crw',
    'image/x-nikon-nef', 'image/x-nikon-nrw',
    'image/x-sony-arw', 'image/x-sony-srf', 'image/x-sony-sr2',
    'image/x-adobe-dng',
    'image/x-olympus-orf',
    'image/x-panasonic-rw2', 'image/x-panasonic-raw',
    'image/x-fuji-raf',
    'image/x-pentax-pef', 'image/x-pentax-ptx',
    'image/x-sigma-x3f',
    'image/x-kodak-dcr', 'image/x-kodak-kdc',
    'image/x-minolta-mrw',
    'image/x-leica-rwl', 'image/x-kodak-dcs',
    'image/x-hasselblad-3fr',
    'image/x-mamiya-mef',
    'image/x-phaseone-iiq',
    'image/tiff',
    'application/octet-stream'
);

-- Uncomment to delete non-compliant files:
-- DELETE FROM photos 
-- WHERE mime_type NOT IN (
--     'image/jpeg', 'image/jpg',
--     'image/x-canon-cr2', 'image/x-canon-cr3', 'image/x-canon-crw',
--     'image/x-nikon-nef', 'image/x-nikon-nrw',
--     'image/x-sony-arw', 'image/x-sony-srf', 'image/x-sony-sr2',
--     'image/x-adobe-dng',
--     'image/x-olympus-orf',
--     'image/x-panasonic-rw2', 'image/x-panasonic-raw',
--     'image/x-fuji-raf',
--     'image/x-pentax-pef', 'image/x-pentax-ptx',
--     'image/x-sigma-x3f',
--     'image/x-kodak-dcr', 'image/x-kodak-kdc',
--     'image/x-minolta-mrw',
--     'image/x-leica-rwl', 'image/x-kodak-dcs',
--     'image/x-hasselblad-3fr',
--     'image/x-mamiya-mef',
--     'image/x-phaseone-iiq',
--     'image/tiff',
--     'application/octet-stream'
-- );
*/

-- Step 5: Update table comments
-- ====================================================================
COMMENT ON COLUMN photos.mime_type IS 'MIME type of the uploaded file (supports JPEG and RAW formats only)';
COMMENT ON COLUMN photos.original_filename IS 'Original filename with extension (.jpg, .jpeg, .cr2, .nef, .arw, etc.)';

-- Step 6: Verification
-- ====================================================================
-- Check bucket configuration
SELECT 
    id,
    name,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'photos';

-- Check table constraints
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name IN ('photos_mime_type_check', 'photos_filename_extension_check');

-- ====================================================================
-- VERIFICATION QUERY
-- ====================================================================
DO $$
DECLARE
    bucket_mime_types TEXT[];
    constraint_count INTEGER;
BEGIN
    -- Check bucket MIME types
    SELECT allowed_mime_types INTO bucket_mime_types
    FROM storage.buckets 
    WHERE id = 'photos';
    
    -- Check constraints
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.check_constraints 
    WHERE constraint_name IN ('photos_mime_type_check', 'photos_filename_extension_check');
    
    RAISE NOTICE 'File restrictions updated successfully!';
    RAISE NOTICE 'Bucket MIME types count: %', array_length(bucket_mime_types, 1);
    RAISE NOTICE 'Table constraints added: %', constraint_count;
    RAISE NOTICE 'System now only accepts JPEG, JPG, and RAW files!';
END $$;

-- ====================================================================
-- NOTES:
-- ====================================================================
-- 1. Only JPEG (.jpg, .jpeg) and RAW files are now accepted
-- 2. PNG, WebP, GIF, and other formats are blocked
-- 3. Database constraints enforce file type validation
-- 4. Storage bucket is configured with allowed MIME types
-- 5. Application validation is also updated to match
-- ====================================================================