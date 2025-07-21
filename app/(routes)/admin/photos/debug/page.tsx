"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';    
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase/client';

interface DebugResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string | object | null;
}

interface StorageInfo {
  bucketExists: boolean;
  canUpload: boolean;
  canRead: boolean;
  error?: string;
}

export default function UploadDebugPage() {
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: DebugResult[] = [];
    const supabase = createClient();

    try {
      // 1. Authentication Test
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        results.push({
          test: "Authentication",
          status: "fail",
          message: "User not authenticated",
          details: userError
        });
        setDebugResults(results);
        setLoading(false);
        return;
      } else {
        setUser(user);
        results.push({
          test: "Authentication",
          status: "pass",
          message: `Authenticated as: ${user.email}`,
          details: { userId: user.id }
        });
      }

      // 2. Admin Role Test
      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (roleError) {
        results.push({
          test: "User Role Check",
          status: "fail",
          message: "Failed to check user role",
          details: roleError
        });
      } else if (userData?.role !== 'admin') {
        results.push({
          test: "User Role Check",
          status: "fail",
          message: `User role is '${userData?.role}', admin required`,
          details: userData
        });
      } else {
        results.push({
          test: "User Role Check",
          status: "pass",
          message: "User has admin role",
          details: userData
        });
      }

      // 3. Events Table Test
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title')
        .limit(1);

      if (eventsError) {
        results.push({
          test: "Events Table",
          status: "fail",
          message: "Cannot access events table",
          details: eventsError
        });
      } else if (!events || events.length === 0) {
        results.push({
          test: "Events Table",
          status: "warning",
          message: "No events found - create an event first",
          details: { eventsCount: 0 }
        });
      } else {
        results.push({
          test: "Events Table",
          status: "pass",
          message: `Found ${events.length} event(s)`,
          details: { eventsCount: events.length, firstEvent: events[0] }
        });
      }

      // 4. Photos Table Test
      const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('id, original_filename')
        .limit(1);

      if (photosError) {
        results.push({
          test: "Photos Table",
          status: "fail",
          message: "Cannot access photos table - run database migration",
          details: photosError
        });
      } else {
        results.push({
          test: "Photos Table",
          status: "pass",
          message: `Photos table accessible (${photos?.length || 0} photos)`,
          details: { photosCount: photos?.length || 0 }
        });
      }

      // 5. Storage Bucket Test
      const storageInfo = await checkStorageSetup(supabase);
      results.push({
        test: "Storage Access",
        status: storageInfo.bucketExists ? "pass" : "fail",
        message: storageInfo.bucketExists ? "Storage bucket accessible" : `Storage bucket not found. ${storageInfo.error || ''}`,
        details: storageInfo
      });

      // 6. Storage Upload Test
      if (storageInfo.bucketExists) {
        try {
          const testFile = new File(['test content'], 'test-upload.txt', { type: 'text/plain' });
          const testPath = `debug/test-${Date.now()}.txt`;
          
          const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(testPath, testFile);

          if (uploadError) {
            results.push({
              test: "Storage Upload Test",
              status: "fail",
              message: "Upload test failed - check storage policies",
              details: uploadError
            });
          } else {
            results.push({
              test: "Storage Upload Test",
              status: "pass",
              message: "Upload test successful",
              details: { testPath }
            });

            // Clean up test file
            await supabase.storage.from('photos').remove([testPath]);
          }
        } catch (error) {
          results.push({
            test: "Storage Upload Test",
            status: "fail",
            message: "Upload test error",
            details: String(error)
          });
        }
      }

      // 7. API Endpoint Test
      try {
        const response = await fetch('/api/photos?limit=1');
        const data = await response.json();
        
        if (!response.ok) {
          results.push({
            test: "API Endpoint",
            status: "fail",
            message: `API returned ${response.status}: ${data.error || response.statusText}`,
            details: { status: response.status, data }
          });
        } else {
          results.push({
            test: "API Endpoint",
            status: "pass",
            message: "API endpoint accessible",
            details: { status: response.status, photosCount: data.photos?.length || 0 }
          });
        }
      } catch (error) {
        results.push({
          test: "API Endpoint",
          status: "fail",
          message: "API endpoint error",
          details: String(error)
        });
      }

    } catch (error) {
      results.push({
        test: "General Error",
        status: "fail",
        message: "Unexpected error during diagnostics",
        details: String(error)
      });
    }

    setDebugResults(results);
    setLoading(false);
  };

  const checkStorageSetup = async (supabase: ReturnType<typeof createClient>): Promise<StorageInfo> => {
    const storageInfo: StorageInfo = {
      bucketExists: false,
      canUpload: false,
      canRead: false
    };

    try {
      // Method 1: Try to list buckets (might fail due to RLS)
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.warn('List buckets failed:', listError.message);
        storageInfo.error = `Failed to list buckets: ${listError.message}. This might be due to RLS on storage.buckets table.`;
        
        // Method 2: Try direct bucket access even if list fails
        try {
          const { data: files, error: filesError } = await supabase.storage
            .from('photos')
            .list('', { limit: 1 });
          
          if (!filesError) {
            storageInfo.bucketExists = true;
            storageInfo.error = 'Bucket exists but list access is restricted. This is usually due to RLS on storage.buckets.';
          }
        } catch (directError) {
          storageInfo.error += ` Direct access also failed: ${directError}`;
        }
      } else {
        const photosBucket = buckets?.find((bucket: { id: string }) => bucket.id === 'photos');
        storageInfo.bucketExists = !!photosBucket;
        
        if (!photosBucket && buckets) {
          storageInfo.error = `Bucket 'photos' not found. Available buckets: ${buckets.map((b: { id: string }) => b.id).join(', ') || 'none'}`;
        }
      }

      // Test upload capability if bucket exists or we suspect it exists
      if (storageInfo.bucketExists || storageInfo.error?.includes('exists but list access')) {
        try {
          const testFile = new File(['test content'], 'test-upload.txt', { type: 'text/plain' });
          const testPath = `debug/test-${Date.now()}.txt`;
          
          const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(testPath, testFile);

          if (!uploadError) {
            storageInfo.canUpload = true;
            storageInfo.bucketExists = true; // Confirm bucket exists if upload works
            
            // Test read capability
            const { data: urlData } = await supabase.storage
              .from('photos')
              .getPublicUrl(testPath);
            
            storageInfo.canRead = !!urlData?.publicUrl;

            // Clean up test file
            await supabase.storage.from('photos').remove([testPath]);
            
            // Clear error if upload works
            if (storageInfo.error?.includes('list access is restricted')) {
              storageInfo.error = 'Bucket works but list access is restricted (RLS issue on storage.buckets)';
            }
          } else {
            storageInfo.error = `Upload test failed: ${uploadError.message}`;
          }
        } catch (testError) {
          storageInfo.error = `Storage test failed: ${testError}`;
        }
      }
    } catch (error) {
      storageInfo.error = `Storage check failed: ${error}`;
    }

    return storageInfo;
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warning': return '⚠️';
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass': return 'text-green-600';
      case 'fail': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upload Debug Center</h1>
            <p className="text-gray-600">Comprehensive diagnostics for photo upload issues</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? 'Running...' : 'Re-run Diagnostics'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/photos">Back to Photos</Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Running comprehensive diagnostics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Test Results */}
            <div className="space-y-4">
              {debugResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getStatusIcon(result.status)}</span>
                      <div>
                        <h3 className="font-semibold">{result.test}</h3>
                        <p className={`text-sm ${getStatusColor(result.status)}`}>
                          {result.message}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {result.details && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                        Show details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Fixes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">🔧 Quick Fixes</h2>
              <div className="space-y-4 text-blue-800">
                
                <div>
                  <h3 className="font-medium">If Photos Table fails:</h3>
                  <p className="text-sm">Run the complete setup script:</p>
                  <code className="block bg-blue-100 p-2 rounded mt-1 text-xs">
                    -- Copy entire content of database/01_complete_photo_system.sql to SQL Editor
                  </code>
                </div>
                
                <div>
                  <h3 className="font-medium">If Storage Bucket fails (MOST COMMON):</h3>
                  <p className="text-sm font-medium text-red-700">This is usually a RLS (Row Level Security) issue on storage.buckets</p>
                  <p className="text-sm mt-1">Run this SQL to fix bucket access:</p>
                  <code className="block bg-blue-100 p-2 rounded mt-1 text-xs overflow-x-auto">
{`-- Fix storage bucket access
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
GRANT SELECT ON storage.buckets TO authenticated;

-- Recreate bucket with proper settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', true, 52428800, 
ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/tiff', 'application/octet-stream'])
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = EXCLUDED.allowed_mime_types;`}
                  </code>
                  <p className="text-sm mt-2 text-yellow-700">
                    <strong>Or run:</strong> <code>database/03_fix_storage_bucket.sql</code> for complete fix
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">If Upload Test fails:</h3>
                  <p className="text-sm">Fix storage policies:</p>
                  <code className="block bg-blue-100 p-2 rounded mt-1 text-xs">
{`-- Clear old policies and create new ones
DROP POLICY IF EXISTS "Photos are publicly readable" ON storage.objects;
CREATE POLICY "Photos bucket - public read" ON storage.objects
    FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Photos bucket - authenticated upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');`}
                  </code>
                </div>

                <div>
                  <h3 className="font-medium">If File Validation fails:</h3>
                  <p className="text-sm">This error usually means the file object is invalid:</p>
                  <code className="block bg-blue-100 p-2 rounded mt-1 text-xs">
                    Error: Cannot read properties of undefined (reading &apos;split&apos;)
                  </code>
                  <p className="text-sm mt-1">Solution: Refresh the page and try uploading a different file.</p>
                </div>
              </div>
            </div>

            {/* Database Migration Commands */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-900 mb-4">📊 Database Setup</h2>
              <div className="text-yellow-800 space-y-2">
                <p className="text-sm">If the photos table doesn&apos;t exist, run this command in your project:</p>
                <code className="block bg-yellow-100 p-2 rounded text-xs">
                  psql [your-supabase-connection-string] -f database/photos_schema.sql
                </code>
                <p className="text-sm mt-2">Or copy the contents of <code>database/photos_schema.sql</code> to Supabase SQL Editor</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}