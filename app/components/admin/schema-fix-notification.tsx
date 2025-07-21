"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Database, RefreshCw } from 'lucide-react';

export function SchemaFixNotification() {
  const [dismissed, setDismissed] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const runQuickTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-storage', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestResult('✅ Storage test passed! Upload should work now.');
      } else {
        setTestResult(`❌ Still has issues: ${data.error || data.message}`);
      }
    } catch (error) {
      setTestResult(`❌ Test failed: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  if (dismissed) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex">
        <Database className="w-5 h-5 text-blue-400 mt-0.5 mr-3" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-800">
            🔧 Schema Fix Applied!
          </h4>
          <div className="mt-2 text-sm text-blue-700">
            <p>
              I detected a database schema issue with the <code className="bg-blue-100 px-1 rounded">storage_path</code> column 
              and fixed all API routes to include the required field.
            </p>
            <p className="mt-1">
              <strong>Test your upload now:</strong>
            </p>
          </div>
          
          <div className="mt-3 flex items-center space-x-3">
            <Button
              onClick={runQuickTest}
              disabled={testing}
              size="sm"
              variant="outline"
            >
              {testing ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {testing ? 'Testing...' : 'Test Upload Now'}
            </Button>
            
            <Button
              onClick={() => setDismissed(true)}
              size="sm"
              variant="ghost"
            >
              Dismiss
            </Button>
          </div>

          {testResult && (
            <div className="mt-3 p-2 bg-white rounded border">
              <p className="text-sm">{testResult}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SchemaFixNotification;