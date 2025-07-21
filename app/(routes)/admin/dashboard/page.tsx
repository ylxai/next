import { createClient } from '@/app/lib/supabase/server';
import { 
  Calendar, 
  Users, 
  Camera, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function Dashboard() {
  const supabase = await createClient();
  
  // Fetch counts from database
  const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
  const { count: clientsCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'client');
  const { count: photosCount } = await supabase.from('photos').select('*', { count: 'exact', head: true });
  
  // Fetch additional stats
  const { count: activeEventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'active');
  const { count: pendingPhotosCount } = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('is_approved', false);
  const { count: featuredPhotosCount } = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('is_featured', true);
  
  // Fetch recent events
  const { data: recentEvents } = await supabase
    .from('events')
    .select('id, title, date, status')
    .order('created_at', { ascending: false })
    .limit(5);
  
  const statsCards = [
    {
      title: 'Total Events',
      value: eventsCount || 0,
      icon: Calendar,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Active Events',
      value: activeEventsCount || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Total Clients',
      value: clientsCount || 0,
      icon: Users,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Total Photos',
      value: photosCount || 0,
      icon: Camera,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: 'Pending Review',
      value: pendingPhotosCount || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      lightColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Featured Photos',
      value: featuredPhotosCount || 0,
      icon: Star,
      color: 'bg-pink-500',
      lightColor: 'bg-pink-50',
      textColor: 'text-pink-600'
    }
  ];
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to your photo studio management panel</p>
        </div>
        <div className="flex space-x-3">
          <Button asChild>
            <Link href="/admin/events/create">
              <Calendar className="w-4 h-4 mr-2" />
              New Event
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/photos">
              <Camera className="w-4 h-4 mr-2" />
              Upload Photos
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.lightColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                </div>
              </div>
              <div className={`h-2 ${stat.color}`}></div>
            </div>
          );
        })}
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
            {recentEvents && recentEvents.length > 0 ? (
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
                Upload Photos
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
          </div>
        </div>
      </div>
    </div>
  );
}
