import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { 
  photoQuerySchema, 
  createPhotoSchema,
  updatePhotoSchema,
  bulkPhotoOperationSchema,
  generateSafeFilename,
  validateImageFile
} from '@/app/lib/validations/photo';
import { uploadPhotoToStorage, extractImageMetadata } from '@/app/lib/utils/storage';

// GET /api/photos - Get photos with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryResult = photoQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten().fieldErrors },  
        { status: 400 }
      );
    }

    const { 
      page = 1, 
      limit = 20, 
      event_id, 
      search, 
      featured, 
      approved, 
      sort = 'upload_date', 
      order = 'desc' 
    } = queryResult.data;

    // Check if user is authenticated and get role
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin';
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('photos')
      .select(`
        *,
        events!inner(
          id,
          title,
          access_code,
          status
        )
      `, { count: 'exact' });

    // Apply filters based on user role
    if (!isAdmin) {
      // Non-admin users can only see approved photos from published/completed events
      query = query
        .eq('is_approved', true)
        .in('events.status', ['published', 'completed']);
    }

    // Apply filters
    if (event_id) {
      query = query.eq('event_id', event_id);
    }

    if (search) {
      query = query.or(`original_filename.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (typeof featured === 'boolean') {
      query = query.eq('is_featured', featured);
    }

    if (typeof approved === 'boolean' && isAdmin) {
      query = query.eq('is_approved', approved);
    }

    // Apply sorting
    const sortOrder = order === 'desc' ? { ascending: false } : { ascending: true };
    query = query.order(sort, sortOrder);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: photos, error, count } = await query;

    if (error) {
      console.error('Error fetching photos:', error);
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      photos: photos || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_next: offset + limit < (count || 0),
        has_previous: page > 1
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/photos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/photos - Upload new photos
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const eventId = formData.get('event_id') as string;
    const description = formData.get('description') as string;
    const isFeatured = formData.get('is_featured') === 'true';
    const autoApprove = formData.get('auto_approve') !== 'false'; // default true

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Verify event exists and user has access
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get uploaded files
    const files = formData.getAll('files') as File[];
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const results: {
      successful: any[];
      failed: Array<{ filename: string; original_filename: string; error: string }>;
    } = {
      successful: [],
      failed: []
    };

    // Process each file
    for (const file of files) {
      try {
        // Upload to storage
        const uploadResult = await uploadPhotoToStorage(file, eventId, {
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

        // Create photo record in database
        const safeFilename = uploadResult.data.path.split('/').pop() || generateSafeFilename(file.name || 'unknown');
        const safeOriginalFilename = file.name || 'unknown.jpg';
        
        const photoData = {
          event_id: eventId,
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
          uploaded_by: user.id,
          metadata: {
            thumbnails: uploadResult.data.thumbnails?.map(t => ({
              size: t.size,
              path: t.path,
              url: t.url
            })) || []
          }
        };

        const { data: photo, error: dbError } = await supabase
          .from('photos')
          .insert(photoData)
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          results.failed.push({
            filename: file.name || 'unknown',
            original_filename: file.name || 'unknown.jpg',
            error: 'Failed to save photo record'
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
      results,
      summary: {
        total: files.length,
        successful: results.successful.length,
        failed: results.failed.length
      }
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/photos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/photos - Bulk operations on photos
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = bulkPhotoOperationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.flatten().fieldErrors }, 
        { status: 400 }
      );
    }

    const { photo_ids, operation, value } = validationResult.data;

    let updateData: any = {};

    switch (operation) {
      case 'approve':
        updateData.is_approved = true;
        break;
      case 'reject':
        updateData.is_approved = false;
        break;
      case 'feature':
        updateData.is_featured = true;
        break;
      case 'unfeature':
        updateData.is_featured = false;
        break;
      case 'delete':
        // For delete, we'll handle it separately
        break;
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    if (operation === 'delete') {
      // Delete photos and their storage files
      const { data: photosToDelete, error: fetchError } = await supabase
        .from('photos')
        .select('id, file_path')
        .in('id', photo_ids);

      if (fetchError) {
        return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
      }

      // Delete from database first
      const { error: deleteError } = await supabase
        .from('photos')
        .delete()
        .in('id', photo_ids);

      if (deleteError) {
        return NextResponse.json({ error: 'Failed to delete photos' }, { status: 500 });
      }

      // TODO: Delete from storage (implement in background job for better performance)
      // For now, we'll skip storage deletion to avoid blocking the response

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${photo_ids.length} photos`,
        affected_count: photo_ids.length
      });
    } else {
      // Update photos
      const { data, error } = await supabase
        .from('photos')
        .update(updateData)
        .in('id', photo_ids)
        .select();

      if (error) {
        return NextResponse.json({ error: 'Failed to update photos' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully ${operation}d ${photo_ids.length} photos`,
        affected_count: photo_ids.length,
        updated_photos: data
      });
    }

  } catch (error) {
    console.error('Unexpected error in PATCH /api/photos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}