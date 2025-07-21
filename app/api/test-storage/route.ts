import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// Test storage bucket access and upload functionality
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        authError: authError?.message
      }, { status: 401 });
    }

    const results = {
      auth: {
        success: true,
        userId: user.id,
        email: user.email
      },
      storage: {
        bucketExists: false,
        canList: false,
        canUpload: false,
        error: null as string | null
      },
      database: {
        canInsert: false,
        error: null as string | null
      }
    };

    // Test 1: Check if photos bucket exists
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        results.storage.error = `Bucket list error: ${bucketError.message}`;
      } else {
        const photosBucket = buckets.find(b => b.name === 'photos');
        results.storage.bucketExists = !!photosBucket;
        
        if (!photosBucket) {
          results.storage.error = 'Photos bucket does not exist';
        }
      }
    } catch (error) {
      results.storage.error = `Bucket check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    // Test 2: Try to list files in photos bucket
    if (results.storage.bucketExists) {
      try {
        const { error: listError } = await supabase.storage
          .from('photos')
          .list('', { limit: 1 });
        
        if (listError) {
          results.storage.error = `List files error: ${listError.message}`;
        } else {
          results.storage.canList = true;
        }
      } catch (error) {
        results.storage.error = `List files failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    // Test 3: Try to upload a test file
    if (results.storage.bucketExists) {
      try {
        const testFileName = `test-${Date.now()}.txt`;
        const testContent = new Blob(['Test file content'], { type: 'text/plain' });
        
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(`test/${testFileName}`, testContent, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          results.storage.error = `Upload error: ${uploadError.message}`;
        } else {
          results.storage.canUpload = true;
          
          // Clean up - delete test file
          await supabase.storage
            .from('photos')
            .remove([`test/${testFileName}`]);
        }
      } catch (error) {
        results.storage.error = `Upload test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    // Test 4: Try database insert (we know this should work)
    try {
      const testPhoto = {
        filename: `test-storage-${Date.now()}.jpg`,
        original_filename: 'test-storage.jpg',
        file_path: 'test/storage-test.jpg', // Keep for backward compatibility
        storage_path: 'test/storage-test.jpg', // Add the required column
        file_size: 1024,
        mime_type: 'image/jpeg',
        uploaded_by: user.id,
        is_approved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: photo, error: dbError } = await supabase
        .from('photos')
        .insert(testPhoto)
        .select()
        .single();

      if (dbError) {
        results.database.error = dbError.message;
      } else {
        results.database.canInsert = true;
        // Clean up
        if (photo?.id) {
          await supabase.from('photos').delete().eq('id', photo.id);
        }
      }
    } catch (error) {
      results.database.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Determine overall success
    const allGood = results.storage.bucketExists && 
                   results.storage.canList && 
                   results.storage.canUpload && 
                   results.database.canInsert;

    return NextResponse.json({
      success: allGood,
      message: allGood ? 'All storage tests passed!' : 'Storage issues detected',
      results,
      recommendations: generateRecommendations(results)
    });

  } catch (error) {
    console.error('Storage test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Storage test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Test actual file upload simulation
export async function POST() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Create a test image file
    const testImageContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(testImageContent.split(',')[1], 'base64');
    const testFile = new Blob([buffer], { type: 'image/png' });
    
    const fileName = `test-upload-${Date.now()}.png`;
    const filePath = `uploads/${fileName}`;

    console.log('Testing file upload:', { fileName, filePath, fileSize: testFile.size });

    // Test storage upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload failed:', uploadError);
      return NextResponse.json({
        success: false,
        error: 'Storage upload failed',
        details: uploadError.message,
        code: uploadError.name,
        statusCode: uploadError.statusCode
      }, { status: 500 });
    }

    console.log('Storage upload successful:', uploadData);

    // Test database insert
    const photoData = {
      filename: fileName,
      original_filename: 'test-upload.png',
      file_path: uploadData.path, // Keep for backward compatibility  
      storage_path: uploadData.path, // Add the required column
      file_size: testFile.size,
      mime_type: 'image/png',
      uploaded_by: user.id,
      is_approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: photo, error: dbError } = await supabase
      .from('photos')
      .insert(photoData)
      .select()
      .single();

    if (dbError) {
      console.error('Database insert failed:', dbError);
      
      // Clean up storage file
      await supabase.storage.from('photos').remove([uploadData.path]);
      
      return NextResponse.json({
        success: false,
        error: 'Database insert failed',
        details: dbError.message,
        uploadSuccessful: true,
        storageData: uploadData
      }, { status: 500 });
    }

    console.log('Database insert successful:', photo);

    // Clean up - delete both storage and database record
    await Promise.all([
      supabase.storage.from('photos').remove([uploadData.path]),
      supabase.from('photos').delete().eq('id', photo.id)
    ]);

    return NextResponse.json({
      success: true,
      message: 'Complete upload test successful!',
      storageData: uploadData,
      databaseData: photo,
      cleanedUp: true
    });

  } catch (error) {
    console.error('Upload test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Upload test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateRecommendations(results: {
  storage: {
    bucketExists: boolean;
    canList: boolean;
    canUpload: boolean;
    error: string | null;
  };
  database: {
    canInsert: boolean;
    error: string | null;
  };
}): string[] {
  const recommendations: string[] = [];
  
  if (!results.storage.bucketExists) {
    recommendations.push('Create "photos" storage bucket in Supabase Dashboard > Storage');
  }
  
  if (results.storage.bucketExists && !results.storage.canList) {
    recommendations.push('Fix storage bucket policies - add SELECT policy for authenticated users');
  }
  
  if (results.storage.bucketExists && !results.storage.canUpload) {
    recommendations.push('Fix storage bucket policies - add INSERT policy for authenticated users');
  }
  
  if (!results.database.canInsert) {
    recommendations.push('Fix RLS policies on photos table (but this should be working based on your debug info)');
  }
  
  if (results.storage.error) {
    recommendations.push(`Storage error: ${results.storage.error}`);
  }
  
  if (results.database.error) {
    recommendations.push(`Database error: ${results.database.error}`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All tests passed! Upload should be working. Check browser console for client-side errors.');
  }
  
  return recommendations;
}