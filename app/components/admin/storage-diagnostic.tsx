"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, HardDrive, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface StorageTestResult {
  success: boolean;
  message: string;
  results: {
    auth: {
      success: boolean;
      userId: string;
      email: string;
    };
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
  };
  recommendations: string[];
}

export function StorageDiagnostic() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StorageTestResult | null>(null);
  const [uploadTesting, setUploadTesting] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    details?: string;
  } | null>(null);

  const runStorageTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-storage');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Test failed: ${error}`,
        results: {
          auth: { success: false, userId: '', email: '' },
          storage: { bucketExists: false, canList: false, canUpload: false, error: 'Test failed' },
          database: { canInsert: false, error: 'Test failed' }
        },
        recommendations: ['Failed to run storage test']
      });
    } finally {
      setLoading(false);
    }
  };

  const runUploadTest = async () => {
    setUploadTesting(true);
    setUploadResult(null);

    try {
      const response = await fetch('/api/test-storage', {
        method: 'POST'
      });
      
      const data = await response.json();
      setUploadResult(data);
    } catch (error) {
      setUploadResult({
        success: false,
        error: 'Upload test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setUploadTesting(false);
    }
  };

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <HardDrive className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Storage & Upload Diagnostic</h2>
            <p className="text-sm text-gray-500">Test storage bucket and upload functionality</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={runStorageTest}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <HardDrive className="w-4 h-4 mr-2" />
            )}
            Test Storage Access
          </Button>

          <Button
            onClick={runUploadTest}
            disabled={uploadTesting}
            variant="outline"
            className="w-full"
          >
            {uploadTesting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Test Full Upload
          </Button>
        </div>

        {/* Storage Test Results */}
        {result && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Storage Test Results</h3>
            
            <div className={`p-4 rounded-lg border ${getStatusColor(result.success)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Overall Status</span>
                <StatusIcon status={result.success} />
              </div>
              <p className="text-sm">{result.message}</p>
            </div>

            {/* Detailed Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg border ${getStatusColor(result.results.storage.bucketExists)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Bucket Exists</span>
                  <StatusIcon status={result.results.storage.bucketExists} />
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${getStatusColor(result.results.storage.canList)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Can List Files</span>
                  <StatusIcon status={result.results.storage.canList} />
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${getStatusColor(result.results.storage.canUpload)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Can Upload</span>
                  <StatusIcon status={result.results.storage.canUpload} />
                </div>
              </div>
            </div>

            {/* Storage Error */}
            {result.results.storage.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800">Storage Error</h4>
                <p className="text-sm text-red-700 mt-1">{result.results.storage.error}</p>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800">Recommendations</h4>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  {result.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Upload Test Results */}
        {uploadResult && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Upload Test Results</h3>
            
            <div className={`p-4 rounded-lg border ${getStatusColor(uploadResult.success)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Upload Test</span>
                <StatusIcon status={uploadResult.success} />
              </div>
              <p className="text-sm">{uploadResult.message || uploadResult.error}</p>
              
              {uploadResult.details && (
                <p className="text-sm mt-2 font-mono bg-gray-100 p-2 rounded">
                  {uploadResult.details}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Storage Bucket Setup Guide */}
        {result && !result.results.storage.bucketExists && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  Storage Bucket Missing
                </h4>
                <div className="mt-2 text-sm text-yellow-700 space-y-2">
                  <p><strong>Quick Fix:</strong></p>
                  <ol className="list-decimal ml-5 space-y-1">
                    <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
                    <li>Open your project</li>
                    <li>Go to <strong>Storage</strong> in the left sidebar</li>
                    <li>Click <strong>&quot;New bucket&quot;</strong></li>
                    <li>Name it <strong>&quot;photos&quot;</strong></li>
                    <li>Make it <strong>Public</strong></li>
                    <li>Click <strong>&quot;Create bucket&quot;</strong></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Storage Policies Setup */}
        {result && result.results.storage.bucketExists && !result.results.storage.canUpload && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  Storage Policies Missing
                </h4>
                <div className="mt-2 text-sm text-yellow-700 space-y-2">
                  <p><strong>Quick Fix:</strong></p>
                  <ol className="list-decimal ml-5 space-y-1">
                    <li>Go to Supabase Dashboard → Storage → photos bucket</li>
                    <li>Click <strong>&quot;Policies&quot;</strong> tab</li>
                    <li>Click <strong>&quot;New policy&quot;</strong></li>
                    <li>Template: <strong>&quot;Allow authenticated uploads&quot;</strong></li>
                    <li>Operations: <strong>INSERT</strong></li>
                    <li>Target roles: <strong>authenticated</strong></li>
                    <li>Policy: <code className="bg-yellow-100 px-1 rounded">bucket_id = &apos;photos&apos;</code></li>
                    <li>Click <strong>&quot;Save policy&quot;</strong></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {result && result.success && uploadResult && uploadResult.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-green-800">
                  ✅ Storage & Upload Working!
                </h4>
                <div className="mt-2 text-sm text-green-700">
                  <p>All storage tests passed. Upload should be working now!</p>
                  <p className="mt-1">If uploads still fail, check:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Browser console for JavaScript errors</li>
                    <li>File size limits (default: 50MB)</li>
                    <li>Network connectivity</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StorageDiagnostic;