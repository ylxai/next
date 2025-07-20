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
        setUserData(userData);
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Session Info */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">🍪 Session Info:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>

            {/* User Info */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">👤 User Info (from auth.getUser()):</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>

            {/* Database User Info */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">💾 Database User Info:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
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
              </ul>
            </div>

            {/* Actions */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-4">🔧 Actions:</h3>
              <div className="space-x-4">
                <Button onClick={checkAuth} variant="outline">
                  🔄 Refresh Data
                </Button>
                
                {user && !userData && (
                  <Button onClick={createUserRecord} variant="secondary">
                    👤 Create User Record
                  </Button>
                )}
                
                {user && userData && userData.role !== 'admin' && (
                  <Button onClick={makeAdmin} variant="destructive">
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

            {/* Navigation */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-4">🧭 Navigation:</h3>
              <div className="space-x-4">
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