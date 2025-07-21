"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Camera,
  Settings,
  LogOut,
  ChevronRight,
  Home
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/lib/utils';

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const sidebarItems: SidebarItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/events',
    label: 'Events',
    icon: Calendar,
  },
  {
    href: '/admin/clients',
    label: 'Clients',
    icon: Users,
  },
  {
    href: '/admin/photos',
    label: 'Photos',
    icon: Camera,
  },
];

const bottomItems: SidebarItem[] = [
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: Settings,
  },
];

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={cn(
      "flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm",
      className
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
            <p className="text-xs text-gray-500">Photo Studio Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Main Navigation
          </p>
          
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  active
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={cn(
                    "w-5 h-5 transition-colors",
                    active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  <span>{item.label}</span>
                </div>
                
                {active && (
                  <ChevronRight className="w-4 h-4 text-blue-600" />
                )}
                
                {item.badge && (
                  <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Quick Actions
          </p>
          
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start" asChild>
              <Link href="/admin/events/create">
                <Calendar className="w-4 h-4 mr-2" />
                New Event
              </Link>
            </Button>
            
            <Button variant="outline" size="sm" className="w-full justify-start" asChild>
              <Link href="/admin/photos">
                <Camera className="w-4 h-4 mr-2" />
                Upload Photos
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Quick Stats</p>
              <p className="text-xs text-gray-500">Today's overview</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Active Events</span>
              <span className="font-medium text-gray-900">12</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Photos</span>
              <span className="font-medium text-gray-900">2,847</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Pending Reviews</span>
              <span className="font-medium text-yellow-600">23</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-gray-200 space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                active
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-colors",
                active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
              )} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
        
        {/* Back to Site */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start mt-2"
          asChild
        >
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Back to Site
          </Link>
        </Button>
      </div>
    </aside>
  );
}

export default AdminSidebar;