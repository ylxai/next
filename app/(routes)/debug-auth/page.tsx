"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { User, Session } from "@supabase/supabase-js";

interface UserData {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export default function AuthDebugPage() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rlsStatus, setRlsStatus] = useState<string>("unknown");
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Session:", session);
      setSession(session);

      // Check user
      const { data: { user } } = await supabase.auth.getUser();
      console.log("User:", user);
      setUser(user);

      if (user) {
        // Check user data in database
        const { data: userData, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        console.log("User data from DB:", userData);
        console.log("DB Error:", dbError);
        
        if (dbError) {
          if (dbError.message.includes('infinite recursion')) {
            setRlsStatus("infinite_recursion");
            setError("RLS Infinite Recursion Detected! Use 'Fix RLS' button below.");
          } else if (dbError.code === 'PGRST116') {
            setRlsStatus("user_not_found");
            setError("User not found in database");
          } else {
            setError("Database error: " + dbError.message);
          }
        } else {
          setUserData(userData);
          setRlsStatus("working");
        }
      }

    } catch (err) {
      console.error("Auth check error:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserData(null);
  };

  const createUserRecord = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
          role: 'user'
        });

      if (error) {
        console.error("Insert error:", error);
        setError("Failed to create user record: " + error.message);
      } else {
        checkAuth(); // Refresh data
      }
    } catch (err) {
      console.error("Create user error:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const makeAdmin = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', user.id);

      if (error) {
        console.error("Update error:", error);
        setError("Failed to make admin: " + error.message);
      } else {
        checkAuth(); // Refresh data
      }
    } catch (err) {
      console.error("Make admin error:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fixRLS = async () => {
    try {
      setError("Attempting to fix RLS policies...");
      
      // This would typically be done via SQL, but we can try to help diagnose
      alert("RLS Fix Required!\n\nPlease run this SQL command in your Supabase SQL Editor:\n\nALTER TABLE users DISABLE ROW LEVEL SECURITY;\n\nThen refresh this page and try again.\n\nFor permanent fix, see SQL_FIXES.sql in the project.");
      
    } catch (err) {
      console.error("Fix RLS error:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Loading auth data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">🔍 Auth Debug Page</h1>
          
          {error && (
            <div className={`border px-4 py-3 rounded mb-4 ${
              rlsStatus === 'infinite_recursion' 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            }`}>
              <strong>Error:</strong> {error}
              
              {rlsStatus === 'infinite_recursion' && (
                <div className="mt-2">
                  <p className="text-sm">🚨 <strong>RLS Infinite Recursion Detected!</strong></p>
                  <p className="text-sm">This happens when RLS policies reference the same table they protect.</p>
                </div>
              )}
            </div>
          )}

          {/* RLS Status Alert */}
          {rlsStatus === 'infinite_recursion' && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    ⚠️ RLS Infinite Recursion Problem
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Your Row Level Security policies are causing infinite recursion.</p>
                    <p className="mt-1"><strong>Quick Fix:</strong> Click &quot;Fix RLS Issues&quot; button below.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Session Info */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">🍪 Session Info:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>

            {/* User Info */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">👤 User Info (from auth.getUser()):</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>

            {/* Database User Info */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">💾 Database User Info:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                {JSON.stringify(userData, null, 2)}
              </pre>
            </div>

            {/* Status Summary */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">📊 Status Summary:</h3>
              <ul className="space-y-1">
                <li>Session exists: {session ? '✅ Yes' : '❌ No'}</li>
                <li>User authenticated: {user ? '✅ Yes' : '❌ No'}</li>
                <li>User in database: {userData ? '✅ Yes' : '❌ No'}</li>
                <li>User role: {userData?.role || 'N/A'}</li>
                <li>Is Admin: {userData?.role === 'admin' ? '✅ Yes' : '❌ No'}</li>
                <li>RLS Status: {
                  rlsStatus === 'working' ? '✅ Working' :
                  rlsStatus === 'infinite_recursion' ? '🚨 Infinite Recursion' :
                  rlsStatus === 'user_not_found' ? '⚠️ User Not Found' :
                  '❓ Unknown'
                }</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-4">🔧 Actions:</h3>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={checkAuth} variant="outline">
                    🔄 Refresh Data
                  </Button>
                  
                  {rlsStatus === 'infinite_recursion' && (
                    <Button onClick={fixRLS} variant="destructive">
                      🛠️ Fix RLS Issues
                    </Button>
                  )}
                  
                  {user && !userData && rlsStatus !== 'infinite_recursion' && (
                    <Button onClick={createUserRecord} variant="secondary">
                      👤 Create User Record
                    </Button>
                  )}
                  
                  {user && userData && userData.role !== 'admin' && (
                    <Button onClick={makeAdmin} variant="default">
                      👑 Make Admin
                    </Button>
                  )}
                  
                  {user && (
                    <Button onClick={signOut} variant="outline">
                      🚪 Sign Out
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* SQL Commands for Manual Fix */}
            {rlsStatus === 'infinite_recursion' && (
              <div className="border rounded p-4 bg-blue-50">
                <h3 className="font-semibold mb-2">🛠️ Manual Fix Commands:</h3>
                <p className="text-sm text-gray-600 mb-2">Run these commands in your Supabase SQL Editor:</p>
                <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-auto">
                  <div>-- Quick fix: Disable RLS temporarily</div>
                  <div className="text-yellow-400">ALTER TABLE users DISABLE ROW LEVEL SECURITY;</div>
                  <br />
                  <div>-- Then refresh this page and try login again</div>
                  <br />
                  <div>-- For permanent fix, see SQL_FIXES.sql file</div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  💡 <strong>Tip:</strong> After running the SQL, refresh this page and try logging in again.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-4">🧭 Navigation:</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                >
                  🏠 Home
                </Button>
                <Button 
                  onClick={() => window.location.href = '/login'}
                  variant="outline"
                >
                  🔑 Login
                </Button>
                <Button 
                  onClick={() => window.location.href = '/setup-admin'}
                  variant="outline"
                >
                  ⚙️ Setup Admin
                </Button>
                {userData?.role === 'admin' && (
                  <Button 
                    onClick={() => window.location.href = '/admin/dashboard'}
                    variant="default"
                  >
                    👑 Admin Dashboard
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}