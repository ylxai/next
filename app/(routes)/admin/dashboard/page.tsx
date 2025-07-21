"use client";

import { 
  Calendar, 
  Users, 
  Camera, 
  Upload,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FreePhotoUpload } from '@/app/components/admin/free-photo-upload';
import { PhotoGallery } from '@/app/components/admin/photo-gallery';
import { AdminNav } from '@/app/components/admin/admin-nav';
import { CachedDashboardStats } from '@/app/components/admin/cached-dashboard-stats';
import { useCachedRecentEvents } from '@/app/lib/hooks/use-cached-data';
import { RLSEmergencyFix } from '@/app/components/admin/rls-emergency-fix';

export default function Dashboard() {
  // Use cached recent events with React Query
  const { data: recentEvents = [], isLoading: eventsLoading } = useCachedRecentEvents(5);
  
  return (
    <div className="space-y-8">
      {/* Navigation Header */}
      <AdminNav />

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to your photo studio management panel</p>
      </div>

            {/* Stats Grid - Using cached data */}
      <CachedDashboardStats />

      {/* RLS Emergency Fix - Show prominently if there are upload issues */}
      <RLSEmergencyFix />

      {/* Free Photo Upload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Quick Photo Upload</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Upload className="w-4 h-4" />
                <span>Free upload without event requirement</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <FreePhotoUpload maxFiles={10} />
          </div>
        </div>

        {/* Photo Gallery */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <PhotoGallery maxPhotos={12} />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/events">View All</Link>
                </Button>
              </div>
            </div>
            <div className="p-6">
              {eventsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 py-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-gray-200 h-4 w-3/4 rounded"></div>
                        <div className="bg-gray-200 h-3 w-1/2 rounded"></div>
                      </div>
                      <div className="bg-gray-200 h-6 w-16 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : recentEvents && recentEvents.length > 0 ? (
                <div className="space-y-4">
                  {recentEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{event.title}</p>
                          <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        event.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : event.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No events found</p>
                  <Button className="mt-4" asChild>
                    <Link href="/admin/events/create">Create Your First Event</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-4">
              <Button className="w-full justify-start" asChild>
                <Link href="/admin/events/create">
                  <Calendar className="w-4 h-4 mr-3" />
                  Create New Event
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/photos">
                  <Camera className="w-4 h-4 mr-3" />
                  Manage Photos
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/clients">
                  <Users className="w-4 h-4 mr-3" />
                  Manage Clients
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/photos?filter=pending">
                  <Clock className="w-4 h-4 mr-3" />
                  Review Pending Photos
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/debug/auth">
                  <Clock className="w-4 h-4 mr-3" />
                  Debug Auth & RLS
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/test-auth');
                    const result = await response.json();
                    alert(JSON.stringify(result, null, 2));
                  } catch (error) {
                    alert('Test failed: ' + error);
                  }
                }}
              >
                <Clock className="w-4 h-4 mr-3" />
                Test Auth & Upload
              </Button>
            </div>
          </div>
        </div>
    </div>
  );
}
