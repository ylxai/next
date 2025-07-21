export interface Photo {
  id: string;
  event_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  description: string | null;
  is_featured: boolean;
  is_approved: boolean;
  upload_date: string;
  uploaded_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PhotoWithEvent extends Photo {
  events: {
    id: string;
    title: string;
    access_code: string;
    status: string;
  };
}

export interface PhotoDownload {
  id: string;
  photo_id: string;
  event_id: string;
  client_ip: string | null;
  user_agent: string | null;
  download_date: string;
  file_size: number | null;
}

export interface PhotoFavorite {
  id: string;
  photo_id: string;
  event_id: string;
  client_identifier: string;
  created_at: string;
}

export interface PhotoStatistics {
  event_id: string;
  event_title: string;
  total_photos: number;
  featured_photos: number;
  approved_photos: number;
  total_size_bytes: number;
  total_downloads: number;
  unique_viewers: number;
}

export interface PhotoUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  photoId?: string;
}

export interface PhotoGallerySettings {
  showApprovedOnly: boolean;
  allowDownload: boolean;
  allowFavorites: boolean;
  watermarkEnabled: boolean;
  maxDownloadSize: number;
  thumbnailSize: number;
}

export interface PhotoMetadata {
  camera?: string;
  lens?: string;
  iso?: number;
  aperture?: string;
  shutterSpeed?: string;
  focalLength?: number;
  flash?: boolean;
  captureDate?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  tags?: string[];
  colorProfile?: string;
  orientation?: number;
}

export interface PhotoFilter {
  event_id?: string;
  is_featured?: boolean;
  is_approved?: boolean;
  uploaded_by?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: 'upload_date' | 'filename' | 'file_size';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface BulkPhotoOperation {
  photo_ids: string[];
  operation: 'approve' | 'reject' | 'feature' | 'unfeature' | 'delete';
  value?: boolean;
}

export interface PhotoProcessingJob {
  id: string;
  photo_id: string;
  job_type: 'thumbnail' | 'watermark' | 'resize' | 'compression';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

// Storage related types
export interface PhotoStorageConfig {
  bucketName: string;
  maxFileSize: number; // in bytes
  allowedMimeTypes: string[];
  thumbnailSizes: number[];
  watermarkSettings: {
    enabled: boolean;
    text: string;
    opacity: number;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  };
}

// API response types
export interface PhotoUploadResponse {
  success: boolean;
  photo?: Photo;
  error?: string;
  file_path?: string;
}

export interface PhotoBulkUploadResponse {
  success: boolean;
  results: {
    successful: Photo[];
    failed: {
      filename: string;
      error: string;
    }[];
  };
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface PhotoGalleryResponse {
  photos: Photo[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Client-side types for photo viewing
export interface PhotoViewerState {
  currentPhotoIndex: number;
  photos: Photo[];
  isFullscreen: boolean;
  showMetadata: boolean;
  favorites: Set<string>;
  selectedPhotos: Set<string>;
}

export interface PhotoDownloadOptions {
  size: 'thumbnail' | 'medium' | 'original';
  format: 'jpeg' | 'png' | 'webp';
  quality: number; // 1-100
  watermark: boolean;
}

// Form types
export interface PhotoEditForm {
  description: string;
  is_featured: boolean;
  is_approved: boolean;
  metadata: PhotoMetadata;
}

export interface PhotoUploadForm {
  event_id: string;
  files: FileList;
  description?: string;
  is_featured?: boolean;
  auto_approve?: boolean;
}

// Database join types
export interface PhotoWithStats extends Photo {
  download_count: number;
  favorite_count: number;
  last_downloaded: string | null;
}

export interface EventWithPhotoStats {
  id: string;
  title: string;
  status: string;
  photo_count: number;
  featured_photo_count: number;
  total_downloads: number;
  total_photo_size: number;
  last_photo_upload: string | null;
}