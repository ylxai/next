import { createClient } from '@/app/lib/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TestEventInsert, TestTableStructure, TestRLSPolicies } from '@/app/components/admin/debug-buttons';

export default async function DebugEventFormPage() {
  const supabase = await createClient();

  // Test database connection
  let dbConnection = 'Unknown';
  let userInfo = null;
  let eventsCount = 0;
  let clientsCount = 0;

  try {
    // Test basic connection
    const { error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    dbConnection = testError ? 'Failed' : 'Connected';

    // Get current user info
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      userInfo = userData;
    }

    // Count records
    const { count: eventsCountResult } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });
    eventsCount = eventsCountResult || 0;

    const { count: clientsCountResult } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
    clientsCount = clientsCountResult || 0;

  } catch (error) {
    console.error('Debug error:', error);
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Event Form Debug Page</h1>
        
        {/* Database Connection Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Database Connection</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              dbConnection === 'Connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="font-medium">{dbConnection}</span>
          </div>
        </div>

        {/* User Information */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Current User</h2>
          {userInfo ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {userInfo.id}</p>
              <p><strong>Email:</strong> {userInfo.email}</p>
              <p><strong>Name:</strong> {userInfo.name || 'Not set'}</p>
              <p><strong>Role:</strong> {userInfo.role}</p>
              <p><strong>Created:</strong> {new Date(userInfo.created_at).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-red-600">No user logged in or user data not found</p>
          )}
        </div>

        {/* Data Counts */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Data Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Events:</strong> {eventsCount}</p>
            </div>
            <div>
              <p><strong>Clients:</strong> {clientsCount}</p>
            </div>
          </div>
        </div>

        {/* Quick Tests */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Quick Database Tests</h2>
          <div className="space-y-3">
            <TestEventInsert />
            <TestTableStructure />
            <TestRLSPolicies />
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-blue-900">Debugging Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li><strong>Check Database Connection:</strong> Should show &quot;Connected&quot; above</li>
            <li><strong>Verify User Role:</strong> Must be &quot;admin&quot; to create events</li>
            <li><strong>Test Manual Insert:</strong> Click &quot;Test Event Insert&quot; button</li>
            <li><strong>Check Browser Console:</strong> Look for error messages when submitting form</li>
            <li><strong>Verify Required Fields:</strong> All marked fields must be filled</li>
            <li><strong>Check RLS Policies:</strong> Ensure admin can insert into events table</li>
          </ol>
        </div>

        {/* Navigation */}
        <div className="flex space-x-4">
          <Button asChild>
            <Link href="/admin/events/create">Test Event Form</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

