import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { uploadPhotoToStorage, extractImageMetadata } from '@/app/lib/utils/storage';
import { generateSafeFilename, validateImageFile } from '@/app/lib/validations/photo';

// POST /api/photos/free-upload - Free photo upload without event requirement
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication with more detailed error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError.message 
      }, { status: 401 });
    }
    
    if (!user || !user.id) {
      console.error('No user found in session');
      return NextResponse.json({ 
        error: 'Authentication required - no valid user session found',
        details: 'Please log in to upload photos' 
      }, { status: 401 });
    }

    console.log('Authenticated user ID:', user.id);
    console.log('User email:', user.email);

    // Parse form data
    const formData = await request.formData();
    const description = formData.get('description') as string;
    const isFeatured = formData.get('is_featured') === 'true';
    const autoApprove = formData.get('auto_approve') === 'true';

    // Get uploaded files
    const files = formData.getAll('files') as File[];
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const results: {
      successful: Array<{
        id: string;
        filename: string;
        original_filename: string;
        file_path: string;
        file_size: number;
        mime_type: string;
        is_featured: boolean;
        is_approved: boolean;
      }>;
      failed: Array<{ filename: string; original_filename: string; error: string }>;
    } = {
      successful: [],
      failed: []
    };

    // Process each file
    for (const file of files) {
      try {
        // Check if file has a name
        if (!file || !file.name || typeof file.name !== 'string' || file.name.trim() === '') {
          results.failed.push({
            filename: 'unnamed_file',
            original_filename: 'unnamed_file.jpg',
            error: 'File name is missing or invalid'
          });
          continue;
        }

        // Validate file
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          results.failed.push({
            filename: file.name || 'unknown',
            original_filename: file.name || 'unknown.jpg',
            error: validation.error
          });
          continue;
        }

        // Upload to storage (without event ID requirement)
        const uploadResult = await uploadPhotoToStorage(file, 'free', {
          generateThumbnails: true
        });

        if (!uploadResult.success || !uploadResult.data) {
          results.failed.push({
            filename: file.name || 'unknown',
            original_filename: file.name || 'unknown.jpg',
            error: uploadResult.error || 'Upload failed'
          });
          continue;
        }

        // Extract image metadata
        const metadata = await extractImageMetadata(file);

        // Create photo record in database without event_id requirement
        const safeFilename = uploadResult.data.path.split('/').pop() || generateSafeFilename(file.name || 'unknown');
        const safeOriginalFilename = file.name || 'unknown.jpg';
        
        const photoData = {
          event_id: null, // Free upload doesn't require event
          filename: safeFilename,
          original_filename: safeOriginalFilename,
          file_path: uploadResult.data.path,
          file_size: file.size,
          mime_type: file.type,
          width: metadata.width || null,
          height: metadata.height || null,
          description: description || null,
          is_featured: isFeatured,
          is_approved: autoApprove,
          uploaded_by: user.id, // Critical: Set uploaded_by to current user for RLS
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            thumbnails: uploadResult.data.thumbnails?.map(t => ({
              size: t.size,
              path: t.path,
              url: t.url
            })) || [],
            camera: metadata.camera,
            lens: metadata.lens,
            iso: metadata.iso,
            aperture: metadata.aperture,
            shutterSpeed: metadata.shutterSpeed,
            focalLength: metadata.focalLength,
            uploadType: 'free' // Mark as free upload
          }
        };

        const { data: photo, error: dbError } = await supabase
          .from('photos')
          .insert(photoData)
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          console.error('Photo data being inserted:', photoData);
          console.error('User ID:', user.id);
          
          let errorMessage = 'Failed to save photo record';
          
          // Handle specific RLS error
          if (dbError.message?.includes('row-level security policy')) {
            errorMessage = 'Permission denied: Row-level security policy violation. Make sure you are authenticated and have proper permissions.';
            console.error('RLS Policy Error - User not authenticated or missing uploaded_by field');
          } else if (dbError.code === '42501') {
            errorMessage = 'Permission denied: Insufficient privileges to insert photo record.';
          } else if (dbError.code === '23505') {
            errorMessage = 'Duplicate entry: A photo with this filename already exists.';
          }
          
          results.failed.push({
            filename: file.name || 'unknown',
            original_filename: file.name || 'unknown.jpg',
            error: errorMessage
          });
          continue;
        }

        results.successful.push(photo);
      } catch (error) {
        console.error('Error processing file:', file.name || 'unknown', error);
        results.failed.push({
          filename: file.name || 'unknown',
          original_filename: file.name || 'unknown.jpg',
          error: error instanceof Error ? error.message : 'Processing failed'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Upload complete! ${results.successful.length} successful, ${results.failed.length} failed out of ${files.length} total files.`,
      results
    });

  } catch (error) {
    console.error('Free upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Free upload failed' },
      { status: 500 }
    );
  }
}