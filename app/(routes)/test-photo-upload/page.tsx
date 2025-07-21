"use client";

import { PhotoUpload } from '@/app/components/admin/photo-upload';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { DateOnly } from '@/app/components/ui/date-display';

interface Event {
  id: string;
  title: string;
  date: string;
  access_code: string;
  status: string;
}

export default function TestPhotoUpload() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    
    const loadData = async () => {
      try {
        // Check user authentication
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError('Please log in to access this page');
          return;
        }
        setUser(user);

        // Check if user is admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userData?.role !== 'admin') {
          setError('Admin access required for photo uploads');
          return;
        }

        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, title, date, access_code, status')
          .order('date', { ascending: false });

        if (eventsError) {
          setError('Failed to load events: ' + eventsError.message);
          return;
        }

        setEvents(eventsData || []);
        
        // Auto-select first event if available
        if (eventsData && eventsData.length > 0) {
          setSelectedEventId(eventsData[0].id);
        }
      } catch (err) {
        setError('Failed to load data: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/admin/dashboard">Admin Dashboard</Link>
              </Button>
            </div>
          </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Photo Upload Test</h1>
              <p className="text-gray-600">Test the Photo Gallery Management System - Phase 1</p>
              {user && (
                <p className="text-sm text-gray-500 mt-1">
                  Logged in as: {user.email}
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" asChild>
                <Link href="/admin/dashboard">
                  Admin Dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/events">
                  Events
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
        {/* Event Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">📅 Select Event</h2>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No events found. Create an event first.</p>
              <Button asChild>
                <Link href="/admin/events/create">Create Event</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose an event to upload photos to:
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {event.date} ({event.status})
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedEventId && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Selected Event Details:</h3>
                  {(() => {
                    const selected = events.find(e => e.id === selectedEventId);
                    return selected ? (
                      <div className="text-blue-800 text-sm space-y-1">
                        <p><strong>ID:</strong> {selected.id}</p>
                        <p><strong>Title:</strong> {selected.title}</p>
                        <p><strong>Date:</strong> <DateOnly date={selected.date} /></p>
                        <p><strong>Access Code:</strong> {selected.access_code}</p>
                        <p><strong>Status:</strong> {selected.status}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">📋 Testing Instructions</h2>
          <div className="text-blue-800 space-y-2">
            <p><strong>System Status:</strong></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Authentication: ✓ Logged in</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Admin Role: ✓ Verified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${events.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm">Events: {events.length > 0 ? '✓' : '✗'} {events.length} found</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-sm">API Endpoint: /api/photos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-sm">Storage: Supabase Storage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-sm">Bucket: photos</span>
                </div>
              </div>
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
                <li>• Supports JPEG, JPG, RAW files only</li>
                <li>• 50MB maximum file size</li>
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
        {selectedEventId ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-6">📸 Photo Upload Test</h2>
            
            <PhotoUpload
              eventId={selectedEventId}
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
        ) : (
          <div className="bg-gray-100 rounded-lg p-6 text-center">
            <p className="text-gray-500">Please select an event to enable photo upload.</p>
          </div>
        )}

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

        {/* Debug Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold text-yellow-900 mb-3">🐛 Debug Information</h2>
          <div className="text-yellow-800 text-sm space-y-2">
            <p><strong>Check Browser Console:</strong> Look for upload progress and error messages</p>
            <p><strong>Check Network Tab:</strong> Verify API calls to /api/photos</p>
            <p><strong>Check Supabase Logs:</strong> Dashboard → Logs → API Logs</p>
            <p><strong>Database Query:</strong> <code>SELECT * FROM photos ORDER BY created_at DESC LIMIT 10;</code></p>
            <p><strong>User ID:</strong> {user?.id}</p>
            <p><strong>Selected Event ID:</strong> {selectedEventId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}