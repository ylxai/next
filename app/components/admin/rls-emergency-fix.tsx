"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button'; 
import { AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';
export function RLSEmergencyFix() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isFixed, setIsFixed] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    setResult('Testing authentication...');

    try {
      const response = await fetch('/api/test-auth');
      const data = await response.json();
      
      if (data.success) {
        setResult('✅ Authentication working! Upload should work now.');
        setIsFixed(true);
      } else {
        setResult(`❌ Auth failed: ${data.error}\n${data.details || ''}`);
        setIsFixed(false);
      }
    } catch (error) {
      setResult(`❌ Test failed: ${error}`);
      setIsFixed(false);
    } finally {
      setLoading(false);
    }
  };

  const testUpload = async () => {
    setLoading(true);
    setResult('Testing upload simulation...');

    try {
      const formData = new FormData();
      formData.append('test', 'emergency-test');

      const response = await fetch('/api/test-auth', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult('✅ Upload test successful! RLS is working correctly.');
        setIsFixed(true);
      } else {
        setResult(`❌ Upload failed: ${data.error}\nCode: ${data.code || 'N/A'}\nDetails: ${data.dbError || data.details || 'None'}`);
        setIsFixed(false);
      }
    } catch (error) {
      setResult(`❌ Upload test failed: ${error}`);
      setIsFixed(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">RLS Emergency Fix</h2>
            <p className="text-sm text-gray-500">Fix "row-level security policy" errors</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Emergency Instructions */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <Shield className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-red-800">
                RLS Policy Error - Quick Fix
              </h4>
              <div className="mt-2 text-sm text-red-700">
                <p><strong>Step 1:</strong> Copy the SQL script below</p>
                <p><strong>Step 2:</strong> Go to Supabase Dashboard → SQL Editor</p>
                <p><strong>Step 3:</strong> Paste and run the script</p>
                <p><strong>Step 4:</strong> Test upload below</p>
              </div>
            </div>
          </div>
        </div>

        {/* SQL Script */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">Emergency SQL Script</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{`-- Emergency RLS Fix - Run in Supabase SQL Editor
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;
GRANT ALL ON photos TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Re-enable with simple policies
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_insert_photos" ON photos;
CREATE POLICY "authenticated_insert_photos" ON photos
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_photos" ON photos;  
CREATE POLICY "authenticated_select_photos" ON photos
    FOR SELECT TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';`}</pre>
          </div>
          
          <Button
            onClick={() => {
              const script = `-- Emergency RLS Fix - Run in Supabase SQL Editor
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;
GRANT ALL ON photos TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Re-enable with simple policies
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_insert_photos" ON photos;
CREATE POLICY "authenticated_insert_photos" ON photos
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_photos" ON photos;  
CREATE POLICY "authenticated_select_photos" ON photos
    FOR SELECT TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';`;
              
              navigator.clipboard.writeText(script);
              alert('SQL script copied to clipboard! Paste it in Supabase SQL Editor.');
            }}
            variant="outline"
            size="sm"
          >
            📋 Copy SQL Script
          </Button>
        </div>

        {/* Test Buttons */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Test After Running SQL</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={testAuth}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? '⏳ Testing...' : '🔐 Test Authentication'}
            </Button>

            <Button
              onClick={testUpload}
              disabled={loading}
              className="w-full"
            >
              {loading ? '⏳ Testing...' : '📤 Test Upload'}
            </Button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className={`p-4 rounded-lg ${
            isFixed 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              {isFixed ? (
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 mr-3" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
              )}
              <div>
                <h4 className={`text-sm font-medium ${
                  isFixed ? 'text-green-800' : 'text-red-800'
                }`}>
                  Test Results
                </h4>
                <div className={`mt-2 text-sm ${
                  isFixed ? 'text-green-700' : 'text-red-700'
                }`}>
                  <pre className="whitespace-pre-wrap">{result}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {isFixed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-green-800">
                  ✅ RLS Fixed! Upload Should Work Now
                </h4>
                <div className="mt-2 text-sm text-green-700">
                  <p>Try uploading a photo using the free upload above. If it still fails, check:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Make sure you&apos;re logged in</li>
                    <li>Check browser console for any errors</li>
                    <li>Verify storage bucket policies in Supabase</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">
                Still Having Issues?
              </h4>
              <div className="mt-2 text-sm text-blue-700">
                <p>If the error persists after running the SQL script:</p>
                <ol className="list-decimal ml-5 mt-1 space-y-1">
                  <li>Check if you&apos;re logged in to your app</li>
                  <li>Go to <code className="bg-blue-100 px-1 rounded">/debug/auth</code> for detailed diagnostics</li>
                  <li>Verify your Supabase project settings</li>
                  <li>Check storage bucket policies in Supabase dashboard</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RLSEmergencyFix;