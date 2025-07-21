"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  Star, 
  CheckCircle, 
  Clock, 
  Eye,
  Download,
  Trash2,
  Grid3X3,
  List,
  Filter
} from 'lucide-react';
import { DateOnly } from '@/app/components/ui/date-display';

interface Photo {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  description: string | null;
  is_featured: boolean;
  is_approved: boolean;
  created_at: string;
  events?: {
    id: string;
    title: string;
  } | null;
}

interface PhotoGalleryProps {
  className?: string;
  maxPhotos?: number;
}

export function PhotoGallery({ className = '', maxPhotos = 20 }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'featured' | 'pending' | 'approved'>('all');

  // Fetch photos
  const fetchPhotos = async () => {
    try {
      setLoading(true);
      
      let url = `/api/photos?limit=${maxPhotos}&sort_by=upload_date&sort_order=desc`;
      
      // Add filter parameters
      if (filter === 'featured') {
        url += '&is_featured=true';
      } else if (filter === 'pending') {
        url += '&is_approved=false';
      } else if (filter === 'approved') {
        url += '&is_approved=true';
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }

      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [filter, maxPhotos]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const index = Math.min(i, sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, index)).toFixed(2)) + ' ' + sizes[index];
  };

  // Get photo URL (assuming we have public URLs)
  const getPhotoUrl = (photo: Photo): string => {
    // This would typically come from your Supabase storage public URL
    return `/api/photos/${photo.id}/preview`;
  };

  // Filter counts
  const filterCounts = {
    all: photos.length,
    featured: photos.filter(p => p.is_featured).length,
    pending: photos.filter(p => !p.is_approved).length,
    approved: photos.filter(p => p.is_approved).length,
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Photo Gallery</h3>
          <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
              <div className="bg-gray-200 h-4 rounded mb-1"></div>
              <div className="bg-gray-200 h-3 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Photo Gallery</h3>
          <p className="text-sm text-gray-500">Recent uploads and featured photos</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Photos', count: filterCounts.all },
          { key: 'featured', label: 'Featured', count: filterCounts.featured },
          { key: 'pending', label: 'Pending', count: filterCounts.pending },
          { key: 'approved', label: 'Approved', count: filterCounts.approved },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(tab.key as any)}
            className="text-sm"
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Photos Grid/List */}
      {photos.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No photos found</h4>
          <p className="text-gray-500 mb-4">
            {filter === 'all' 
              ? 'Upload some photos to get started'
              : `No ${filter} photos available`}
          </p>
          <Button>
            <Camera className="w-4 h-4 mr-2" />
            Upload Photos
          </Button>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-4'
        }>
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              className={
                viewMode === 'grid'
                  ? 'bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow'
                  : 'bg-white rounded-lg border border-gray-200 p-4 flex items-center space-x-4 hover:shadow-sm transition-shadow'
              }
            >
              {viewMode === 'grid' ? (
                <>
                  {/* Grid View */}
                  <div className="aspect-square bg-gray-100 relative group">
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <Button size="sm" variant="secondary">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Status badges */}
                    <div className="absolute top-2 right-2 flex flex-col space-y-1">
                      {photo.is_featured && (
                        <div className="bg-yellow-500 text-white p-1 rounded-full">
                          <Star className="w-3 h-3" />
                        </div>
                      )}
                      {photo.is_approved ? (
                        <div className="bg-green-500 text-white p-1 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="bg-yellow-500 text-white p-1 rounded-full">
                          <Clock className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 text-sm truncate" title={photo.original_filename}>
                        {photo.original_filename}
                      </h4>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>{formatFileSize(photo.file_size)}</p>
                        {photo.width && photo.height && (
                          <p>{photo.width} × {photo.height}</p>
                        )}
                        <p><DateOnly date={photo.created_at} /></p>
                      </div>

                      {photo.events && (
                        <div className="text-xs">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            {photo.events.title}
                          </span>
                        </div>
                      )}

                      {photo.description && (
                        <p className="text-xs text-gray-600 truncate" title={photo.description}>
                          {photo.description}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* List View */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Camera className="w-6 h-6 text-gray-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate" title={photo.original_filename}>
                          {photo.original_filename}
                        </h4>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{formatFileSize(photo.file_size)}</span>
                          {photo.width && photo.height && (
                            <span>{photo.width} × {photo.height}</span>
                          )}
                          <span><DateOnly date={photo.created_at} /></span>
                        </div>

                        {photo.description && (
                          <p className="text-sm text-gray-600 mt-1 truncate" title={photo.description}>
                            {photo.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {photo.is_featured && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                        {photo.is_approved ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                        
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {photo.events && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {photo.events.title}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Show More Button */}
      {photos.length >= maxPhotos && (
        <div className="text-center">
          <Button variant="outline">
            Load More Photos
          </Button>
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;