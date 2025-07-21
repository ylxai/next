import { z } from 'zod';

// File validation schema
export const photoFileSchema = z.object({
  name: z.string().min(1, 'Filename required'),
  size: z.number().max(50 * 1024 * 1024, 'File size must be less than 50MB'),
  type: z.string().regex(/^image\/(jpeg|jpg|png|webp|gif|x-canon-cr2|x-canon-crw|x-nikon-nef|x-sony-arw|x-adobe-dng|x-olympus-orf|x-panasonic-rw2|x-fuji-raf|x-kodak-dcr|x-minolta-mrw|x-pentax-pef|x-sigma-x3f|tiff)$|^application\/octet-stream$/, 'Only image and RAW files are allowed'),
});

// Photo metadata schema
export const photoMetadataSchema = z.object({
  camera: z.string().optional(),
  lens: z.string().optional(),
  iso: z.number().min(50).max(25600).optional(),
  aperture: z.string().optional(),
  shutterSpeed: z.string().optional(),
  focalLength: z.number().min(1).max(2000).optional(),
  flash: z.boolean().optional(),
  captureDate: z.string().datetime().optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  colorProfile: z.string().max(100).optional(),
  orientation: z.number().min(1).max(8).optional(),
}).optional();

// Photo creation schema
export const createPhotoSchema = z.object({
  event_id: z.string().uuid('Valid event ID required'),
  filename: z.string().min(1, 'Filename required').max(255),
  original_filename: z.string().min(1, 'Original filename required').max(255),
  file_path: z.string().min(1, 'File path required'),
  file_size: z.number().positive().optional(),
  mime_type: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  description: z.string().max(1000).optional().nullable(),
  is_featured: z.boolean().default(false),
  is_approved: z.boolean().default(true),
  metadata: photoMetadataSchema.default({}),
});

// Photo update schema
export const updatePhotoSchema = z.object({
  description: z.string().max(1000).optional().nullable(),
  is_featured: z.boolean().optional(),
  is_approved: z.boolean().optional(),
  metadata: photoMetadataSchema.optional(),
});

// Photo upload form schema
export const photoUploadFormSchema = z.object({
  event_id: z.string().uuid('Valid event ID required'),
  description: z.string().max(1000).optional(),
  is_featured: z.boolean().default(false),
  auto_approve: z.boolean().default(true),
});

// Bulk photo operation schema
export const bulkPhotoOperationSchema = z.object({
  photo_ids: z.array(z.string().uuid()).min(1, 'At least one photo must be selected'),
  operation: z.enum(['approve', 'reject', 'feature', 'unfeature', 'delete']),
  value: z.boolean().optional(),
});

// Photo filter schema
export const photoFilterSchema = z.object({
  event_id: z.string().uuid().optional(),
  is_featured: z.boolean().optional(),
  is_approved: z.boolean().optional(),
  uploaded_by: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  search: z.string().max(100).optional(),
  sort_by: z.enum(['upload_date', 'filename', 'file_size']).default('upload_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Photo download options schema
export const photoDownloadOptionsSchema = z.object({
  size: z.enum(['thumbnail', 'medium', 'original']).default('original'),
  format: z.enum(['jpeg', 'png', 'webp']).default('jpeg'),
  quality: z.number().min(1).max(100).default(85),
  watermark: z.boolean().default(false),
});

// Photo favorite schema
export const photoFavoriteSchema = z.object({
  photo_id: z.string().uuid('Valid photo ID required'),
  event_id: z.string().uuid('Valid event ID required'),
  client_identifier: z.string().min(1, 'Client identifier required').max(255),
});

// Photo download tracking schema
export const photoDownloadTrackingSchema = z.object({
  photo_id: z.string().uuid('Valid photo ID required'),
  event_id: z.string().uuid('Valid event ID required'),
  client_ip: z.string().max(45).optional(), // Max length for IPv6
  user_agent: z.string().max(500).optional(),
  file_size: z.number().positive().optional(),
});

// Gallery settings schema
export const photoGallerySettingsSchema = z.object({
  showApprovedOnly: z.boolean().default(true),
  allowDownload: z.boolean().default(true),
  allowFavorites: z.boolean().default(true),
  watermarkEnabled: z.boolean().default(false),
  maxDownloadSize: z.number().min(100).max(5000).default(1920), // pixels
  thumbnailSize: z.number().min(50).max(500).default(300), // pixels
});

// Storage configuration schema
export const photoStorageConfigSchema = z.object({
  bucketName: z.string().min(1, 'Bucket name required'),
  maxFileSize: z.number().min(1024).max(100 * 1024 * 1024), // 1KB to 100MB
  allowedMimeTypes: z.array(z.string()).min(1, 'At least one MIME type required'),
  thumbnailSizes: z.array(z.number().min(50).max(1000)).min(1),
  watermarkSettings: z.object({
    enabled: z.boolean(),
    text: z.string().max(100),
    opacity: z.number().min(0).max(1),
    position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left', 'center']),
  }),
});

// Query parameters for photo APIs
export const photoQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  event_id: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  featured: z.string().transform((val) => val === 'true').optional(),
  approved: z.string().transform((val) => val === 'true').optional(),
  sort: z.enum(['upload_date', 'filename', 'file_size']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// Photo ID parameter schema
export const photoIdSchema = z.object({
  id: z.string().uuid('Valid photo ID required'),
});

// Event ID parameter schema
export const eventIdSchema = z.object({
  eventId: z.string().uuid('Valid event ID required'),
});

// RAW file extensions mapping
const RAW_EXTENSIONS = {
  // Canon
  'cr2': 'image/x-canon-cr2',
  'cr3': 'image/x-canon-cr3',
  'crw': 'image/x-canon-crw',
  // Nikon
  'nef': 'image/x-nikon-nef',
  'nrw': 'image/x-nikon-nrw',
  // Sony
  'arw': 'image/x-sony-arw',
  'srf': 'image/x-sony-srf',
  'sr2': 'image/x-sony-sr2',
  // Adobe
  'dng': 'image/x-adobe-dng',
  // Olympus
  'orf': 'image/x-olympus-orf',
  // Panasonic
  'rw2': 'image/x-panasonic-rw2',
  'raw': 'image/x-panasonic-raw',
  // Fuji
  'raf': 'image/x-fuji-raf',
  // Pentax
  'pef': 'image/x-pentax-pef',
  'ptx': 'image/x-pentax-ptx',
  // Sigma
  'x3f': 'image/x-sigma-x3f',
  // Kodak
  'dcr': 'image/x-kodak-dcr',
  'kdc': 'image/x-kodak-kdc',
  // Minolta
  'mrw': 'image/x-minolta-mrw',
  // Leica
  'rwl': 'image/x-leica-rwl',
  'dcs': 'image/x-kodak-dcs',
  // Hasselblad
  '3fr': 'image/x-hasselblad-3fr',
  // Mamiya
  'mef': 'image/x-mamiya-mef',
  // Phase One
  'iiq': 'image/x-phaseone-iiq',
};

// Validation helper functions
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  // Standard image MIME types
  const allowedImageTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp', 
    'image/gif'
  ];
  
  // RAW file MIME types
  const allowedRawTypes = [
    'image/x-canon-cr2', 'image/x-canon-cr3', 'image/x-canon-crw',
    'image/x-nikon-nef', 'image/x-nikon-nrw',
    'image/x-sony-arw', 'image/x-sony-srf', 'image/x-sony-sr2',
    'image/x-adobe-dng',
    'image/x-olympus-orf',
    'image/x-panasonic-rw2', 'image/x-panasonic-raw',
    'image/x-fuji-raf',
    'image/x-pentax-pef', 'image/x-pentax-ptx',
    'image/x-sigma-x3f',
    'image/x-kodak-dcr', 'image/x-kodak-kdc',
    'image/x-minolta-mrw',
    'image/x-leica-rwl', 'image/x-kodak-dcs',
    'image/x-hasselblad-3fr',
    'image/x-mamiya-mef',
    'image/x-phaseone-iiq',
    'image/tiff', // Some RAW files reported as TIFF
    'application/octet-stream' // Fallback for unrecognized RAW files
  ];

  const allAllowedTypes = [...allowedImageTypes, ...allowedRawTypes];

  // Check file size first
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 50MB',
    };
  }

  // Get file extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  // Check if it's a known RAW extension
  if (fileExtension && RAW_EXTENSIONS[fileExtension as keyof typeof RAW_EXTENSIONS]) {
    return { isValid: true };
  }

  // Check MIME type for standard images and recognized RAW types
  if (!allAllowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only JPG, JPEG, PNG, and RAW files (CR2, NEF, ARW, DNG, ORF, RW2, RAF, PEF, X3F, etc.) are allowed',
    };
  }

  return { isValid: true };
}

export function validateImageDimensions(
  width: number,
  height: number
): { isValid: boolean; error?: string } {
  const minDimension = 100; // pixels
  const maxDimension = 10000; // pixels

  if (width < minDimension || height < minDimension) {
    return {
      isValid: false,
      error: `Image dimensions must be at least ${minDimension}x${minDimension} pixels`,
    };
  }

  if (width > maxDimension || height > maxDimension) {
    return {
      isValid: false,
      error: `Image dimensions must not exceed ${maxDimension}x${maxDimension} pixels`,
    };
  }

  return { isValid: true };
}

export function generateSafeFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  // Extract file extension
  const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  
  // Remove special characters and spaces, keep only alphanumeric and hyphens
  const safeName = originalFilename
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special chars with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .substring(0, 50); // Limit length
  
  return `${timestamp}_${randomString}_${safeName}.${extension}`;
}

// Helper function to check if file is RAW format
export function isRawFile(file: File): boolean {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  return !!(fileExtension && RAW_EXTENSIONS[fileExtension as keyof typeof RAW_EXTENSIONS]);
}

// Helper function to get expected MIME type for RAW files
export function getExpectedMimeType(filename: string): string | null {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension && RAW_EXTENSIONS[extension as keyof typeof RAW_EXTENSIONS]) {
    return RAW_EXTENSIONS[extension as keyof typeof RAW_EXTENSIONS];
  }
  return null;
}

// Type exports for use in components
export type PhotoFileValidation = z.infer<typeof photoFileSchema>;
export type PhotoMetadataInput = z.infer<typeof photoMetadataSchema>;
export type CreatePhotoInput = z.infer<typeof createPhotoSchema>;
export type UpdatePhotoInput = z.infer<typeof updatePhotoSchema>;
export type PhotoUploadFormInput = z.infer<typeof photoUploadFormSchema>;
export type BulkPhotoOperationInput = z.infer<typeof bulkPhotoOperationSchema>;
export type PhotoFilterInput = z.infer<typeof photoFilterSchema>;
export type PhotoDownloadOptionsInput = z.infer<typeof photoDownloadOptionsSchema>;
export type PhotoFavoriteInput = z.infer<typeof photoFavoriteSchema>;
export type PhotoGallerySettingsInput = z.infer<typeof photoGallerySettingsSchema>;
export type PhotoQueryInput = z.infer<typeof photoQuerySchema>;