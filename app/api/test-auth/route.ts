import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// Test authentication and database access
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth check result:', { user: user?.id, error: authError });

    if (authError) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        details: authError.message,
        authError: authError
      }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No user found',
        message: 'User not authenticated'
      }, { status: 401 });
    }

    // Test database connection
    const { data: testQuery, error: dbError } = await supabase
      .from('photos')
      .select('count(*)')
      .limit(1);

    console.log('Database test result:', { data: testQuery, error: dbError });

    // Test if we can insert a dummy record
    const testPhoto = {
      filename: 'test-auth-' + Date.now() + '.jpg',
      original_filename: 'test-auth.jpg',
      file_path: 'test/auth-test.jpg', // Keep for backward compatibility
      storage_path: 'test/auth-test.jpg', // Add the required column
      file_size: 1024,
      mime_type: 'image/jpeg',
      uploaded_by: user.id,
      is_approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('photos')
      .insert(testPhoto)
      .select()
      .single();

    console.log('Insert test result:', { data: insertResult, error: insertError });

    // Clean up - delete the test record if it was created
    if (insertResult?.id) {
      await supabase.from('photos').delete().eq('id', insertResult.id);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || user.app_metadata?.role
      },
      database: {
        canRead: !dbError,
        canInsert: !insertError,
        readError: dbError?.message,
        insertError: insertError?.message
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Test with POST to simulate form data
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        authError: authError?.message
      }, { status: 401 });
    }

    // Get form data like in real upload
    const formData = await request.formData();
    const testFile = formData.get('test') as string || 'test-upload';

    // Try to insert like real upload
    const photoData = {
      filename: `${testFile}-${Date.now()}.jpg`,
      original_filename: `${testFile}.jpg`,
      file_path: `test/${testFile}.jpg`, // Keep for backward compatibility
      storage_path: `test/${testFile}.jpg`, // Add the required column
      file_size: 1024,
      mime_type: 'image/jpeg',
      uploaded_by: user.id, // Critical for RLS
      is_approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Testing insert with data:', photoData);

    const { data: photo, error: dbError } = await supabase
      .from('photos')
      .insert(photoData)
      .select()
      .single();

    if (dbError) {
      console.error('Insert failed:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database insert failed',
        dbError: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint,
        userData: {
          userId: user.id,
          email: user.email
        }
      }, { status: 500 });
    }

    // Clean up
    if (photo?.id) {
      await supabase.from('photos').delete().eq('id', photo.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Upload simulation successful',
      insertedId: photo.id,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('POST test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}