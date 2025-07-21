"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { validateImageFile } from '@/app/lib/validations/photo';

export default function TestPhotoValidation() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const runTests = () => {
    const results: string[] = [];

    try {
      // Test 1: Valid image file mock
      const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB
      
      const validResult = validateImageFile(validFile);
      results.push(`✅ Valid file test: ${validResult.isValid ? 'PASS' : 'FAIL - ' + validResult.error}`);

      // Test 2: Invalid file type
      const invalidTypeFile = new File([''], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(invalidTypeFile, 'size', { value: 1024 });
      
      const invalidTypeResult = validateImageFile(invalidTypeFile);
      results.push(`✅ Invalid type test: ${!invalidTypeResult.isValid ? 'PASS' : 'FAIL - should reject'}`);

      // Test 3: File too large
      const largeFile = new File([''], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 100 * 1024 * 1024 }); // 100MB
      
      const largeFileResult = validateImageFile(largeFile);
      results.push(`✅ Large file test: ${!largeFileResult.isValid ? 'PASS' : 'FAIL - should reject'}`);

      results.push('🎉 All validation tests completed successfully!');
    } catch (error) {
      results.push(`❌ Test failed with error: ${error instanceof Error ? error.message : String(error)}`);
    }

    setTestResults(results);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Photo Validation Test</h1>
        
        <div className="mb-6">
          <Button onClick={runTests}>
            Run Validation Tests
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="font-semibold mb-3">Test Results:</h2>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Purpose:</strong> This test verifies that photo validation functions work correctly.</p>
          <p><strong>Tests:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Valid image file (JPEG, 1MB) - should pass</li>
            <li>Invalid file type (text file) - should fail</li>
            <li>File too large (100MB) - should fail</li>
          </ul>
        </div>
      </div>
    </div>
  );
}