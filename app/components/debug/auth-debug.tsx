"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, User, Database, Shield } from 'lucide-react';

interface AuthStatus {
  isAuthenticated: boolean;
  user: {
    id: string;
    email?: string;
    email_confirmed_at?: string;
    last_sign_in_at?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  } | null;
  authError: string | null;
  sessionValid: boolean;
  userRole: string | null;
  canUploadPhotos: boolean;
}

export function AuthDebug() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    canInsert: boolean;
    error: string | null;
  } | null>(null);

  const supabase = createClient();

  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    try {
      // Check user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      const status: AuthStatus = {
        isAuthenticated: !!user && !authError,
        user: user,
        authError: authError?.message || sessionError?.message || null,
        sessionValid: !!session && !sessionError,
        userRole: (user?.user_metadata?.role as string) || (user?.app_metadata?.role as string) || null,
        canUploadPhotos: !!user && !!session
      };

      setAuthStatus(status);
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthStatus({
        isAuthenticated: false,
        user: null,
        authError: 'Failed to check authentication status',
        sessionValid: false,
        userRole: null,
        canUploadPhotos: false
      });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const testDatabaseAccess = async () => {
    if (!authStatus?.isAuthenticated) {
      setTestResult({
        canInsert: false,
        error: 'User not authenticated'
      });
      return;
    }

    try {
      // Test if we can insert a dummy photo record
      const testPhoto = {
        filename: 'test-' + Date.now() + '.jpg',
        original_filename: 'test.jpg',
        file_path: 'test/test.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        uploaded_by: authStatus.user?.id || 'unknown',
        is_approved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('photos')
        .insert(testPhoto)
        .select()
        .single();

      if (error) {
        setTestResult({
          canInsert: false,
          error: error.message
        });
      } else {
        // Clean up - delete the test record
        await supabase.from('photos').delete().eq('id', data.id);
        
        setTestResult({
          canInsert: true,
          error: null
        });
      }
    } catch (error) {
      setTestResult({
        canInsert: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Auth & RLS Debug Panel</h2>
                <p className="text-sm text-gray-500">Diagnose authentication and permission issues</p>
              </div>
            </div>
            
            <Button 
              onClick={checkAuthStatus} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Authentication Status */}
          <div className="space-y-4">
            <h3 className="flex items-center text-lg font-medium text-gray-900">
              <User className="w-5 h-5 mr-2" />
              Authentication Status
            </h3>
            
            {authStatus ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${getStatusColor(authStatus.isAuthenticated)}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Authenticated</span>
                    <StatusIcon status={authStatus.isAuthenticated} />
                  </div>
                  {authStatus.authError && (
                    <p className="text-sm mt-2 text-red-600">{authStatus.authError}</p>
                  )}
                </div>

                <div className={`p-4 rounded-lg border ${getStatusColor(authStatus.sessionValid)}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Valid Session</span>
                    <StatusIcon status={authStatus.sessionValid} />
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${getStatusColor(authStatus.canUploadPhotos)}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Can Upload Photos</span>
                    <StatusIcon status={authStatus.canUploadPhotos} />
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">User Role</span>
                    <span className="text-sm font-mono">
                      {authStatus.userRole || 'none'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            )}
          </div>

          {/* User Information */}
          {authStatus?.user && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">User Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="text-sm font-mono text-gray-900 break-all">{authStatus.user.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{authStatus.user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email Confirmed</dt>
                    <dd className="text-sm text-gray-900">
                      {authStatus.user.email_confirmed_at ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-red-600">No</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Sign In</dt>
                    <dd className="text-sm text-gray-900">
                      {authStatus.user.last_sign_in_at ? 
                        new Date(authStatus.user.last_sign_in_at).toLocaleString() : 
                        'Never'
                      }
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Database Access Test */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center text-lg font-medium text-gray-900">
                <Database className="w-5 h-5 mr-2" />
                Database Access Test
              </h3>
              
              <Button 
                onClick={testDatabaseAccess}
                disabled={!authStatus?.isAuthenticated}
                size="sm"
              >
                Test Photo Insert
              </Button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg border ${getStatusColor(testResult.canInsert)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {testResult.canInsert ? 'Database Access: OK' : 'Database Access: Failed'}
                  </span>
                  <StatusIcon status={testResult.canInsert} />
                </div>
                {testResult.error && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-red-700">Error Details:</p>
                    <p className="text-sm text-red-600 font-mono bg-red-100 p-2 rounded mt-1">
                      {testResult.error}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Troubleshooting Actions */}
          <div className="space-y-4">
            <h3 className="flex items-center text-lg font-medium text-gray-900">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Quick Actions
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                onClick={() => window.open('/login', '_blank')}
                className="justify-start"
              >
                <User className="w-4 h-4 mr-2" />
                Login Page
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(authStatus, null, 2));
                  alert('Auth status copied to clipboard');
                }}
                className="justify-start"
                disabled={!authStatus}
              >
                <Database className="w-4 h-4 mr-2" />
                Copy Debug Info
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="justify-start"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Session
              </Button>
            </div>
          </div>

          {/* RLS Troubleshooting Tips */}
          {!authStatus?.canUploadPhotos && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    RLS Policy Issue Detected
                  </h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>If you&apos;re seeing &quot;row-level security policy&quot; errors, try:</p>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                      <li>Make sure you&apos;re logged in with valid credentials</li>
                      <li>Run the RLS setup script in Supabase SQL Editor</li>
                      <li>Check that storage bucket policies are configured</li>
                      <li>Verify uploaded_by field is set correctly in API routes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthDebug;