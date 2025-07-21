"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase/client';

interface DebugResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export default function UploadDebugPage() {
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    runDiagnostics();
  }, []);

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
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        results.push({
          test: "Storage Access",
          status: "fail",
          message: "Cannot access storage",
          details: bucketsError
        });
      } else {
        const photosBucket = buckets?.find(bucket => bucket.id === 'photos');
        if (!photosBucket) {
          results.push({
            test: "Photos Bucket",
            status: "fail",
            message: "Photos bucket not found - create 'photos' bucket in Supabase Dashboard",
            details: { availableBuckets: buckets?.map(b => b.id) }
          });
        } else {
          results.push({
            test: "Photos Bucket",
            status: "pass",
            message: "Photos bucket exists",
            details: photosBucket
          });
        }
      }

      // 6. Storage Upload Test
      if (buckets?.find(bucket => bucket.id === 'photos')) {
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
            details: error
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
          details: error
        });
      }

    } catch (error) {
      results.push({
        test: "General Error",
        status: "fail",
        message: "Unexpected error during diagnostics",
        details: error
      });
    }

    setDebugResults(results);
    setLoading(false);
  };

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
              <div className="space-y-3 text-blue-800">
                <div>
                  <h3 className="font-medium">If Photos Table fails:</h3>
                  <p className="text-sm">Run this SQL in Supabase SQL Editor:</p>
                  <code className="block bg-blue-100 p-2 rounded mt-1 text-xs">
                    \copy (SELECT * FROM pg_tables WHERE tablename = 'photos') TO stdout;
                  </code>
                </div>
                
                <div>
                  <h3 className="font-medium">If Storage Bucket fails:</h3>
                  <p className="text-sm">Go to Supabase Dashboard → Storage → Create bucket named "photos"</p>
                </div>
                
                <div>
                  <h3 className="font-medium">If Upload Test fails:</h3>
                  <p className="text-sm">Set up storage policies in SQL Editor:</p>
                  <code className="block bg-blue-100 p-2 rounded mt-1 text-xs">
                    CREATE POLICY "Admins can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
                  </code>
                </div>
              </div>
            </div>

            {/* Database Migration Commands */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-900 mb-4">📊 Database Setup</h2>
              <div className="text-yellow-800 space-y-2">
                <p className="text-sm">If the photos table doesn't exist, run this command in your project:</p>
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