"use client";

import { 
  Calendar, 
  Users, 
  Camera, 
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';
import { useCachedStats } from '@/app/lib/hooks/use-cached-data';

export function CachedDashboardStats() {
  const { data: stats, isLoading, error } = useCachedStats();

  const statsCards = [
    {
      title: 'Total Events',
      value: stats?.eventsCount || 0,
      icon: Calendar,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Active Events',
      value: stats?.activeEventsCount || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Total Clients',
      value: stats?.clientsCount || 0,
      icon: Users,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Total Photos',
      value: stats?.photosCount || 0,
      icon: Camera,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: 'Pending Review',
      value: stats?.pendingPhotosCount || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      lightColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Featured Photos',
      value: stats?.featuredPhotosCount || 0,
      icon: Star,
      color: 'bg-pink-500',
      lightColor: 'bg-pink-50',
      textColor: 'text-pink-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="bg-gray-200 h-4 w-24 rounded"></div>
                  <div className="bg-gray-200 h-8 w-16 rounded"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
            <div className="h-2 bg-gray-200"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading stats: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value.toLocaleString()}
                  </p>
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
  );
}

export default CachedDashboardStats;