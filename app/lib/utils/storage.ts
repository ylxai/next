import { createClient } from '@/app/lib/supabase/client';
import { generateSafeFilename, validateImageFile } from '@/app/lib/validations/photo';

// Storage configuration
export const STORAGE_CONFIG = {
  BUCKET_NAME: 'photos',
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg'
  ],
  THUMBNAIL_SIZES: [150, 300, 600, 1200],
  QUALITY: {
    thumbnail: 75,
    medium: 85,
    original: 95
  }
};

// Generate storage path for photos
export function generatePhotoPath(eventId: string, filename: string): string {
  const datePath = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `events/${eventId}/${datePath}/${filename}`;
}

// Generate thumbnail path
export function generateThumbnailPath(originalPath: string, size: number): string {
  const pathParts = originalPath.split('/');
  const filename = pathParts[pathParts.length - 1];
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const extension = filename.split('.').pop();
  
  pathParts[pathParts.length - 1] = `${nameWithoutExt}_thumb_${size}.${extension}`;
  return pathParts.join('/');
}

// Upload single photo to Supabase Storage
export async function uploadPhotoToStorage(
  file: File,
  eventId: string,
  options: {
    filename?: string;
    generateThumbnails?: boolean;
  } = {}
): Promise<{
  success: boolean;
  data?: {
    path: string;
    url: string;
    thumbnails?: { size: number; path: string; url: string }[];
  };
  error?: string;
}> {
  try {
    const supabase = createClient();

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Generate safe filename
    const filename = options.filename || generateSafeFilename(file.name);
    const filePath = generatePhotoPath(eventId, filename);

    // Upload original file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .getPublicUrl(filePath);

    const result = {
      path: filePath,
      url: urlData.publicUrl,
      thumbnails: [] as { size: number; path: string; url: string }[]
    };

    // Generate thumbnails if requested
    if (options.generateThumbnails) {
      for (const size of STORAGE_CONFIG.THUMBNAIL_SIZES) {
        try {
          const thumbnailResult = await generateThumbnail(file, filePath, size);
          if (thumbnailResult.success && thumbnailResult.data) {
            result.thumbnails.push(thumbnailResult.data);
          }
        } catch (error) {
          console.warn(`Failed to generate thumbnail size ${size}:`, error);
          // Continue with other sizes even if one fails
        }
      }
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return { success: false, error: 'Failed to upload photo' };
  }
}

// Generate thumbnail from original file
export async function generateThumbnail(
  originalFile: File,
  originalPath: string,
  size: number
): Promise<{
  success: boolean;
  data?: { size: number; path: string; url: string };
  error?: string;
}> {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return { success: false, error: 'Thumbnail generation only available in browser' };
    }

    const supabase = createClient();

    // Create canvas for thumbnail generation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { success: false, error: 'Canvas not supported' };
    }

    // Load image
    const img = new Image();
    const imageLoadPromise = new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    img.src = URL.createObjectURL(originalFile);
    await imageLoadPromise;

    // Calculate thumbnail dimensions (maintaining aspect ratio)
    const { width, height } = calculateThumbnailDimensions(
      img.width,
      img.height,
      size
    );

    // Set canvas size and draw thumbnail
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    // Convert canvas to blob
    const thumbnailBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
        'image/jpeg',
        STORAGE_CONFIG.QUALITY.thumbnail / 100
      );
    });

    // Generate thumbnail path and upload
    const thumbnailPath = generateThumbnailPath(originalPath, size);
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .upload(thumbnailPath, thumbnailBlob, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // Get public URL for thumbnail
    const { data: urlData } = supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .getPublicUrl(thumbnailPath);

    // Cleanup
    URL.revokeObjectURL(img.src);

    return {
      success: true,
      data: {
        size,
        path: thumbnailPath,
        url: urlData.publicUrl
      }
    };
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return { success: false, error: 'Failed to generate thumbnail' };
  }
}

// Calculate thumbnail dimensions while maintaining aspect ratio
export function calculateThumbnailDimensions(
  originalWidth: number,
  originalHeight: number,
  maxSize: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  if (originalWidth > originalHeight) {
    // Landscape orientation
    const width = Math.min(maxSize, originalWidth);
    const height = Math.round(width / aspectRatio);
    return { width, height };
  } else {
    // Portrait or square orientation
    const height = Math.min(maxSize, originalHeight);
    const width = Math.round(height * aspectRatio);
    return { width, height };
  }
}

// Get public URL for photo
export function getPhotoUrl(path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage
    .from(STORAGE_CONFIG.BUCKET_NAME)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

// Get thumbnail URL
export function getThumbnailUrl(originalPath: string, size: number): string {
  const thumbnailPath = generateThumbnailPath(originalPath, size);
  return getPhotoUrl(thumbnailPath);
}

// Delete photo from storage
export async function deletePhotoFromStorage(path: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();

    // Delete original file
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .remove([path]);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Delete thumbnails
    const thumbnailDeletionPromises = STORAGE_CONFIG.THUMBNAIL_SIZES.map(async (size) => {
      const thumbnailPath = generateThumbnailPath(path, size);
      return supabase.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .remove([thumbnailPath]);
    });

    // Wait for all thumbnail deletions (don't fail if some thumbnails don't exist)
    await Promise.allSettled(thumbnailDeletionPromises);

    return { success: true };
  } catch (error) {
    console.error('Error deleting photo:', error);
    return { success: false, error: 'Failed to delete photo' };
  }
}

// Bulk upload photos
export async function bulkUploadPhotos(
  files: File[],
  eventId: string,
  onProgress?: (progress: number, fileIndex: number, total: number) => void
): Promise<{
  success: boolean;
  results: {
    successful: Array<{
      file: File;
      path: string;
      url: string;
      thumbnails?: { size: number; path: string; url: string }[];
    }>;
    failed: Array<{
      file: File;
      error: string;
    }>;
  };
}> {
  const successful: Array<{
    file: File;
    path: string;
    url: string;
    thumbnails?: { size: number; path: string; url: string }[];
  }> = [];
  
  const failed: Array<{
    file: File;
    error: string;
  }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (onProgress) {
      onProgress(((i + 1) / files.length) * 100, i, files.length);
    }

    try {
      const result = await uploadPhotoToStorage(file, eventId, {
        generateThumbnails: true
      });

      if (result.success && result.data) {
        successful.push({
          file,
          path: result.data.path,
          url: result.data.url,
          thumbnails: result.data.thumbnails
        });
      } else {
        failed.push({
          file,
          error: result.error || 'Unknown error'
        });
      }
    } catch (error) {
      failed.push({
        file,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  }

  return {
    success: true,
    results: { successful, failed }
  };
}

// Get photo file info from storage
export async function getPhotoFileInfo(path: string): Promise<{
  success: boolean;
  data?: {
    size: number;
    lastModified: string;
    metadata: Record<string, any>;
  };
  error?: string;
}> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .list(path.substring(0, path.lastIndexOf('/')), {
        limit: 1,
        search: path.substring(path.lastIndexOf('/') + 1)
      });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'File not found' };
    }

    const fileInfo = data[0];
    return {
      success: true,
      data: {
        size: fileInfo.metadata?.size || 0,
        lastModified: fileInfo.updated_at || fileInfo.created_at,
        metadata: fileInfo.metadata || {}
      }
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return { success: false, error: 'Failed to get file info' };
  }
}

// Extract image metadata from file
export async function extractImageMetadata(file: File): Promise<{
  width?: number;
  height?: number;
  size: number;
  type: string;
  lastModified: number;
}> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return {
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };
  }

  const img = new Image();
  const imageLoadPromise = new Promise<{ width: number; height: number }>((resolve, reject) => {
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to load image'));
  });

  img.src = URL.createObjectURL(file);
  
  try {
    const dimensions = await imageLoadPromise;
    URL.revokeObjectURL(img.src);
    
    return {
      width: dimensions.width,
      height: dimensions.height,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };
  } catch (error) {
    URL.revokeObjectURL(img.src);
    return {
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };
  }
}

// Check if storage bucket exists and is properly configured
export async function checkStorageConfiguration(): Promise<{
  success: boolean;
  bucketExists: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();

    // Try to list files in the bucket (this will fail if bucket doesn't exist)
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .list('', { limit: 1 });

    if (error) {
      return {
        success: false,
        bucketExists: false,
        error: error.message
      };
    }

    return {
      success: true,
      bucketExists: true
    };
  } catch (error) {
    return {
      success: false,
      bucketExists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}