"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase/client';
import { validateImageFile, validatePhotoMetadata } from '@/app/lib/validations/photo';

interface StorageInfo {
  bucketExists: boolean;
  canUpload: boolean;
  canRead: boolean;
  error?: string;
}

interface SystemStatus {
  auth: boolean;
  admin: boolean;
  database: boolean;
  storage: StorageInfo;
  apiEndpoint: boolean;
}

export default function TestPhotoValidation() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    auth: false,
    admin: false,
    database: false,
    storage: { bucketExists: false, canUpload: false, canRead: false },
    apiEndpoint: false
  });
  const [loading, setLoading] = useState(true);
  const [validationResults, setValidationResults] = useState<any[]>([]);

  useEffect(() => {
    runSystemCheck();
  }, []);

  const runSystemCheck = async () => {
    setLoading(true);
    const supabase = createClient();
    const status: SystemStatus = {
      auth: false,
      admin: false,
      database: false,
      storage: { bucketExists: false, canUpload: false, canRead: false },
      apiEndpoint: false
    };

    try {
      // 1. Check Authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      status.auth = !userError && !!user;

      if (status.auth && user) {
        // 2. Check Admin Role
        const { data: userData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        status.admin = !roleError && userData?.role === 'admin';

        // 3. Check Database Access
        const { data: events, error: dbError } = await supabase
          .from('events')
          .select('id, title')
          .limit(1);
        
        status.database = !dbError;

        // 4. Check Storage
        status.storage = await checkStorageSetup(supabase);

        // 5. Check API Endpoint
        status.apiEndpoint = await checkApiEndpoint();
      }
    } catch (error) {
      console.error('System check error:', error);
    }

    setSystemStatus(status);
    setLoading(false);
  };

  const checkStorageSetup = async (supabase: any): Promise<StorageInfo> => {
    const storageInfo: StorageInfo = {
      bucketExists: false,
      canUpload: false,
      canRead: false
    };

    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        storageInfo.error = `Failed to list buckets: ${listError.message}`;
        return storageInfo;
      }

      const photosBucket = buckets?.find((bucket: any) => bucket.id === 'photos');
      storageInfo.bucketExists = !!photosBucket;

      if (storageInfo.bucketExists) {
        // Test upload capability
        try {
          const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
          const testPath = `test-${Date.now()}.txt`;
          
          const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(testPath, testFile);

          if (!uploadError) {
            storageInfo.canUpload = true;
            
            // Test read capability
            const { data: urlData } = await supabase.storage
              .from('photos')
              .getPublicUrl(testPath);
            
            storageInfo.canRead = !!urlData?.publicUrl;

            // Clean up test file
            await supabase.storage
              .from('photos')
              .remove([testPath]);
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

  const checkApiEndpoint = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/photos?limit=1', {
        method: 'GET',
      });
      return response.ok || response.status === 401; // 401 is expected if not logged in
    } catch (error) {
      return false;
    }
  };

  const runValidationTests = () => {
    const testFiles = [
      // Valid standard image files
      new File([''], 'test.jpg', { type: 'image/jpeg' }),
      new File([''], 'test.png', { type: 'image/png' }),
      new File([''], 'test.webp', { type: 'image/webp' }),
      
      // Valid RAW files
      new File([''], 'canon.cr2', { type: 'image/x-canon-cr2' }),
      new File([''], 'nikon.nef', { type: 'image/x-nikon-nef' }),
      new File([''], 'sony.arw', { type: 'image/x-sony-arw' }),
      new File([''], 'adobe.dng', { type: 'image/x-adobe-dng' }),
      new File([''], 'olympus.orf', { type: 'image/x-olympus-orf' }),
      new File([''], 'fuji.raf', { type: 'image/x-fuji-raf' }),
      
      // RAW files with fallback MIME type
      new File([''], 'raw_fallback.cr2', { type: 'application/octet-stream' }),
      
      // Invalid files
      new File([''], 'test.txt', { type: 'text/plain' }),
      new File([''], 'test.pdf', { type: 'application/pdf' }),
      new File([''], 'test.mp4', { type: 'video/mp4' }),
      
      // Size tests (simulated)
      Object.assign(new File([''], 'large.jpg', { type: 'image/jpeg' }), { size: 60 * 1024 * 1024 }), // 60MB - should fail
      Object.assign(new File([''], 'good_size.jpg', { type: 'image/jpeg' }), { size: 25 * 1024 * 1024 }), // 25MB - should pass
      Object.assign(new File([''], 'small.jpg', { type: 'image/jpeg' }), { size: 1024 }), // 1KB - should pass
    ];

    const results = testFiles.map(file => {
      const validation = validateImageFile(file);
      return {
        filename: file.name,
        type: file.type,
        size: file.size,
        validation
      };
    });

    setValidationResults(results);
  };

  const StatusIndicator = ({ status, label }: { status: boolean; label: string }) => (
    <div className="flex items-center space-x-2">
      <span className={`w-3 h-3 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`}></span>
      <span className="text-sm">{label}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Running system check...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Photo System Diagnostics</h1>
              <p className="text-gray-600">Validate photo functionality and Supabase Storage setup</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={runSystemCheck}>
                Re-run Check
              </Button>
              <Button variant="outline" asChild>
                <Link href="/test-photo-upload">Photo Upload Test</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/dashboard">Admin Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* System Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-6">🔧 System Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Authentication & Access</h3>
              <div className="space-y-2">
                <StatusIndicator status={systemStatus.auth} label="User Authentication" />
                <StatusIndicator status={systemStatus.admin} label="Admin Role" />
                <StatusIndicator status={systemStatus.database} label="Database Access" />
                <StatusIndicator status={systemStatus.apiEndpoint} label="API Endpoint" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Storage System</h3>
              <div className="space-y-2">
                <StatusIndicator status={systemStatus.storage.bucketExists} label="Photos Bucket Exists" />
                <StatusIndicator status={systemStatus.storage.canUpload} label="Can Upload Files" />
                <StatusIndicator status={systemStatus.storage.canRead} label="Can Read Files" />
              </div>
              {systemStatus.storage.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                  <p className="text-red-800 text-sm">{systemStatus.storage.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Storage Setup Instructions */}
        {!systemStatus.storage.bucketExists && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-4">⚠️ Storage Setup Required</h2>
            <div className="text-yellow-800 space-y-4">
              <p>The Supabase Storage bucket "photos" is not set up. Follow these steps:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Go to your Supabase Dashboard → Storage</li>
                <li>Click "Create a new bucket"</li>
                <li>Name it "photos" and make it public</li>
                <li>Set up the following policies in SQL Editor:</li>
              </ol>
              
              <div className="bg-yellow-100 rounded p-4 mt-4">
                <h4 className="font-medium mb-2">SQL Policies to Run:</h4>
                <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
{`-- Create bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Allow public read access
CREATE POLICY "Photos are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

-- Allow admin uploads
CREATE POLICY "Admins can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'photos' 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow admin updates
CREATE POLICY "Admins can update photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'photos' 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow admin deletes
CREATE POLICY "Admins can delete photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'photos' 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* File Validation Tests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">🧪 File Validation Tests</h2>
            <Button onClick={runValidationTests}>Run Validation Tests</Button>
          </div>

          {validationResults.length > 0 && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">File</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Size</th>
                      <th className="text-left p-3">Valid</th>
                      <th className="text-left p-3">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResults.map((result, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3 font-mono">{result.filename}</td>
                        <td className="p-3">{result.type}</td>
                        <td className="p-3">{(result.size / 1024 / 1024).toFixed(2)} MB</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            result.validation.isValid 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {result.validation.isValid ? '✓ Valid' : '✗ Invalid'}
                          </span>
                        </td>
                        <td className="p-3 text-red-600 text-xs">
                          {result.validation.error || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">🚀 Next Steps</h2>
          <div className="text-blue-800 space-y-2">
            {!systemStatus.auth && (
              <p>• Please log in as an admin user</p>
            )}
            {!systemStatus.storage.bucketExists && (
              <p>• Set up the Supabase Storage bucket "photos" (see instructions above)</p>
            )}
            {systemStatus.auth && systemStatus.admin && systemStatus.storage.bucketExists && (
              <p>• ✅ System is ready! You can proceed to test photo uploads.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}