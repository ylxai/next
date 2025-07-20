import { PhotoUpload } from '@/app/components/admin/photo-upload';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TestPhotoUpload() {
  const testEventId = "test-event-123"; // Replace with actual event ID

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Photo Upload Test</h1>
              <p className="text-gray-600">Test the Photo Gallery Management System - Phase 1</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" asChild>
                <Link href="/admin/dashboard">
                  Admin Dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/test-qr">
                  Test QR
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">📋 Testing Instructions</h2>
          <div className="text-blue-800 space-y-2">
            <p><strong>Before testing:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Ensure you're logged in as an admin user</li>
              <li>Create the Supabase Storage bucket named "photos"</li>
              <li>Run the database migration (photos_schema.sql)</li>
              <li>Set up storage policies as per the Phase 1 guide</li>
              <li>Replace <code className="bg-blue-100 px-1 rounded">testEventId</code> with a real event ID</li>
            </ol>
          </div>
        </div>

        {/* System Check Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">🔧 System Check</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded">
              <strong>Current Event ID:</strong>
              <br />
              <code className="text-blue-600">{testEventId}</code>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>API Endpoint:</strong>
              <br />
              <code className="text-blue-600">/api/photos</code>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>Storage Bucket:</strong>
              <br />
              <code className="text-blue-600">photos</code>
            </div>
          </div>
        </div>

        {/* Phase 1 Features */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">✅ Phase 1 Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Upload Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Drag & drop multiple files</li>
                <li>• File validation (size, type)</li>
                <li>• Real-time upload progress</li>
                <li>• Image preview before upload</li>
                <li>• Bulk upload with options</li>
                <li>• Error handling & feedback</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Backend Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Supabase Storage integration</li>
                <li>• Automatic thumbnail generation</li>
                <li>• Photo metadata extraction</li>
                <li>• Database schema with RLS</li>
                <li>• API endpoints for management</li>
                <li>• Role-based access control</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload Component */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-6">📸 Photo Upload Test</h2>
          
          <PhotoUpload
            eventId={testEventId}
            onUploadComplete={(results) => {
              console.log('Upload completed:', results);
              alert(`Upload complete! ${results.successful.length} successful, ${results.failed.length} failed out of ${results.total} total files.`);
            }}
            onUploadProgress={(progress) => {
              console.log('Upload progress:', progress);
            }}
            maxFiles={20}
          />
        </div>

        {/* Expected Behavior */}
        <div className="bg-gray-50 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold mb-4">🎯 Expected Behavior</h2>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>✅ Successful Upload:</strong> Files should be uploaded to Supabase Storage and records created in database</p>
            <p><strong>✅ Progress Tracking:</strong> You should see upload progress for each file</p>
            <p><strong>✅ Validation:</strong> Invalid files (too large, wrong format) should be rejected</p>
            <p><strong>✅ Database Records:</strong> Check the photos table for new entries</p>
            <p><strong>✅ Storage Files:</strong> Check Supabase Storage → photos bucket for uploaded files</p>
            <p><strong>✅ Thumbnails:</strong> Multiple thumbnail sizes should be generated</p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold text-green-900 mb-3">🚀 Next Steps</h2>
          <div className="text-green-800">
            <p className="mb-3">
              <strong>Phase 1 Complete!</strong> Once photo upload is working, we're ready for Phase 2:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Photo Gallery Interface for clients</li>
              <li>Photo Viewer with lightbox functionality</li>
              <li>Photo download system with watermarking</li>
              <li>Favorites management for clients</li>
              <li>Integration with existing event pages</li>
              <li>Mobile-responsive gallery design</li>
            </ul>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold text-yellow-900 mb-3">🐛 Debug Information</h2>
          <div className="text-yellow-800 text-sm space-y-2">
            <p><strong>Check Browser Console:</strong> Look for upload progress and error messages</p>
            <p><strong>Check Network Tab:</strong> Verify API calls to /api/photos</p>
            <p><strong>Check Supabase Logs:</strong> Dashboard → Logs → API Logs</p>
            <p><strong>Database Query:</strong> <code>SELECT * FROM photos ORDER BY created_at DESC LIMIT 10;</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}