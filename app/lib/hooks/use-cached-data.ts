"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/app/lib/supabase/client';

// Query keys for cache management
export const QUERY_KEYS = {
  EVENTS: ['events'] as const,
  PHOTOS: ['photos'] as const,
  CLIENTS: ['clients'] as const,
  STATS: ['stats'] as const,
  EVENT_DETAIL: (id: string) => ['events', id] as const,
  PHOTO_DETAIL: (id: string) => ['photos', id] as const,
} as const;

// Cache configuration
const CACHE_CONFIG = {
  // Short cache for frequently changing data
  SHORT_CACHE: 2 * 60 * 1000, // 2 minutes
  // Medium cache for semi-static data
  MEDIUM_CACHE: 5 * 60 * 1000, // 5 minutes
  // Long cache for static data
  LONG_CACHE: 15 * 60 * 1000, // 15 minutes
} as const;

// Hook for cached events
export function useCachedEvents() {
  return useQuery({
    queryKey: QUERY_KEYS.EVENTS,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date, status, access_code')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: CACHE_CONFIG.MEDIUM_CACHE,
    gcTime: CACHE_CONFIG.LONG_CACHE,
  });
}

// Hook for cached photos with filtering
export function useCachedPhotos(options?: {
  limit?: number;
  filter?: string;
  eventId?: string;
}) {
  const { limit = 20, filter, eventId } = options || {};
  
  return useQuery({
    queryKey: [...QUERY_KEYS.PHOTOS, { limit, filter, eventId }],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from('photos')
        .select(`
          *,
          events!inner(
            id,
            title,
            access_code
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (filter === 'featured') {
        query = query.eq('is_featured', true);
      } else if (filter === 'pending') {
        query = query.eq('is_approved', false);
      } else if (filter === 'approved') {
        query = query.eq('is_approved', true);
      }

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    staleTime: CACHE_CONFIG.SHORT_CACHE,
    gcTime: CACHE_CONFIG.MEDIUM_CACHE,
  });
}

// Hook for cached dashboard stats
export function useCachedStats() {
  return useQuery({
    queryKey: QUERY_KEYS.STATS,
    queryFn: async () => {
      const supabase = createClient();
      
      // Fetch all stats in parallel
      const [
        { count: eventsCount },
        { count: activeEventsCount },
        { count: clientsCount },
        { count: photosCount },
        { count: pendingPhotosCount },
        { count: featuredPhotosCount }
      ] = await Promise.all([
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'client'),
        supabase.from('photos').select('*', { count: 'exact', head: true }),
        supabase.from('photos').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('photos').select('*', { count: 'exact', head: true }).eq('is_featured', true)
      ]);

      return {
        eventsCount: eventsCount || 0,
        activeEventsCount: activeEventsCount || 0,
        clientsCount: clientsCount || 0,
        photosCount: photosCount || 0,
        pendingPhotosCount: pendingPhotosCount || 0,
        featuredPhotosCount: featuredPhotosCount || 0
      };
    },
    staleTime: CACHE_CONFIG.MEDIUM_CACHE,
    gcTime: CACHE_CONFIG.LONG_CACHE,
  });
}

// Hook for cached recent events
export function useCachedRecentEvents(limit = 5) {
  return useQuery({
    queryKey: [...QUERY_KEYS.EVENTS, 'recent', limit],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date, status')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    },
    staleTime: CACHE_CONFIG.MEDIUM_CACHE,
    gcTime: CACHE_CONFIG.LONG_CACHE,
  });
}

// Hook for invalidating cache
export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  const invalidateEvents = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EVENTS });
  };

  const invalidatePhotos = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PHOTOS });
  };

  const invalidateStats = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STATS });
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };

  return {
    invalidateEvents,
    invalidatePhotos,
    invalidateStats,
    invalidateAll,
  };
}

// Prefetch utility for preloading data
export function usePrefetchData() {
  const queryClient = useQueryClient();

  const prefetchEvents = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.EVENTS,
      queryFn: async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('events')
          .select('id, title, date, status, access_code')
          .order('date', { ascending: false });
        
        if (error) throw error;
        return data;
      },
      staleTime: CACHE_CONFIG.MEDIUM_CACHE,
    });
  };

  const prefetchStats = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.STATS,
      queryFn: async () => {
        const supabase = createClient();
        const { count: photosCount } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true });
        
        return { photosCount: photosCount || 0 };
      },
      staleTime: CACHE_CONFIG.MEDIUM_CACHE,
    });
  };

  return {
    prefetchEvents,
    prefetchStats,
  };
}