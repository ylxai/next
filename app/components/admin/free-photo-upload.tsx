"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  UploadIcon, 
  XIcon, 
  CheckIcon, 
  AlertCircleIcon,
  ImageIcon,
  TrashIcon
} from "lucide-react";
import { validateImageFile } from "@/app/lib/validations/photo";
import { useCacheInvalidation } from "@/app/lib/hooks/use-cached-data";

interface FreePhotoUploadProps {
  onUploadComplete?: (results: UploadResults) => void;
  maxFiles?: number;
  disabled?: boolean;
}

interface FileWithPreview {
  // File properties
  name: string;
  size: number;
  type: string;
  lastModified: number;
  webkitRelativePath: string;
  
  // File methods
  arrayBuffer: () => Promise<ArrayBuffer>;
  bytes?: () => Promise<Uint8Array>;
  slice: (start?: number, end?: number, contentType?: string) => Blob;
  stream: () => ReadableStream<Uint8Array>;
  text: () => Promise<string>;
  
  // Custom properties
  id: string;
  preview: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface UploadResults {
  successful: number;
  failed: number;
  total: number;
  results?: {
    successful: Array<{
      id: string;
      filename: string;
      original_filename: string;
      file_path: string;
    }>;
    failed: Array<{
      filename: string;
      original_filename: string;
      error: string;
    }>;
  };
}

export function FreePhotoUpload({ 
  onUploadComplete,
  maxFiles = 50,
  disabled = false
}: FreePhotoUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [description, setDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [autoApprove, setAutoApprove] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { invalidatePhotos, invalidateStats } = useCacheInvalidation();

  // Generate unique ID for file
  const generateFileId = () => Math.random().toString(36).substring(2, 15);

  // Create file preview
  const createFilePreview = useCallback((file: File): FileWithPreview => {
    return {
      // Explicitly copy File properties
      name: file.name || 'unknown.jpg',
      size: file.size || 0,
      type: file.type || 'image/jpeg',
      lastModified: file.lastModified || Date.now(),
      webkitRelativePath: file.webkitRelativePath || '',
      
      // Copy File methods
      arrayBuffer: file.arrayBuffer.bind(file),
      bytes: file.bytes?.bind(file),
      slice: file.slice.bind(file),
      stream: file.stream.bind(file),
      text: file.text.bind(file),
      
      // Add our custom properties
      id: generateFileId(),
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
      progress: 0
    } as FileWithPreview;
  }, []);

  // Validate and add files
  const addFiles = useCallback((newFiles: File[]) => {
    const validatedFiles: FileWithPreview[] = [];
    
    for (const file of newFiles) {
      const fileName = file.name || 'unknown file';
      const validation = validateImageFile(file);
      if (validation.isValid) {
        validatedFiles.push(createFilePreview(file));
      } else {
        console.warn(`File "${fileName}" rejected: ${validation.error}`);
      }
    }

    setFiles(prev => {
      const combined = [...prev, ...validatedFiles];
      return combined.slice(0, maxFiles);
    });
  }, [createFilePreview, maxFiles]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || isUploading) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, [addFiles, disabled, isUploading]);

  // Handle file input change
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
      e.target.value = '';
    }
  }, [addFiles]);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
  }, []);

  // Clear all files
  const clearAllFiles = useCallback(() => {
    files.forEach(file => URL.revokeObjectURL(file.preview));
    setFiles([]);
  }, [files]);

  // Upload files (free upload without event requirement)
  const uploadFiles = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('is_featured', isFeatured.toString());
      formData.append('auto_approve', autoApprove.toString());
      formData.append('free_upload', 'true'); // Flag for free upload

      // Add all files to FormData
      files.forEach((file) => {
        // Create a File object from our FileWithPreview
        const fileBlob = new File([file.slice()], file.name, { type: file.type });
        formData.append('files', fileBlob);
      });

      // Update progress for all files
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'uploading' as const,
        progress: 0
      })));

      const response = await fetch('/api/photos/free-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      if (!responseData.success) {
        const errorMessage = responseData.error || 'Upload failed';
        throw new Error(errorMessage);
      }

      const results = responseData;

      // Update file statuses based on results
      setFiles(prev => prev.map(file => {
        const fileName = file.name || '';
        const successfulUpload = results.results?.successful?.find(
          (s) => s && s.original_filename === fileName
        );
        const failedUpload = results.results?.failed?.find(
          (f) => f && (f.filename === fileName || f.original_filename === fileName)
        );

        if (successfulUpload) {
          return {
            ...file,
            status: 'completed' as const,
            progress: 100
          };
        } else if (failedUpload) {
          return {
            ...file,
            status: 'error' as const,
            error: failedUpload.error
          };
        } else {
          return {
            ...file,
            status: 'error' as const,
            error: 'Upload status unknown'
          };
        }
      }));

      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete({
          successful: results.results?.successful?.length || 0,
          failed: results.results?.failed?.length || 0,
          total: files.length,
          results: results.results
        });
      }

      // Invalidate cache to refresh data
      if (results.results?.successful?.length > 0) {
        invalidatePhotos();
        invalidateStats();
      }

      // Auto-clear completed files after a delay
      setTimeout(() => {
        setFiles(prev => prev.filter(f => f.status !== 'completed'));
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      
      // Mark all files as failed
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Upload failed'
      })));
    } finally {
      setIsUploading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const index = Math.min(i, sizes.length - 1);
    
    const value = bytes / Math.pow(k, index);
    const formattedValue = isNaN(value) ? 0 : Number(value.toFixed(2));
    
    return `${formattedValue} ${sizes[index]}`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.cr2,.cr3,.crw,.nef,.nrw,.arw,.srf,.sr2,.dng,.orf,.rw2,.raw,.raf,.pef,.ptx,.x3f,.dcr,.kdc,.mrw,.rwl,.dcs,.3fr,.mef,.iiq,.tiff,.tif"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled || isUploading}
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <UploadIcon className="w-12 h-12 text-gray-400" />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              Drop photos here or click to browse
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Upload photos freely without event requirement
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supports JPEG, JPG, and RAW files up to 50MB each
            </p>
          </div>
        </div>
      </div>

      {/* Upload Options */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for your photos..."
            disabled={isUploading}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              disabled={isUploading}
              className="rounded"
            />
            <span className="text-sm">Mark as featured</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              disabled={isUploading}
              className="rounded"
            />
            <span className="text-sm">Auto-approve</span>
          </label>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Selected Photos ({files.length})
            </h3>
            
            <div className="flex space-x-2">
              <Button
                onClick={uploadFiles}
                disabled={files.length === 0 || isUploading}
                className="min-w-[120px]"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Upload {files.length} Photo{files.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={clearAllFiles}
                disabled={isUploading}
              >
                <TrashIcon className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div key={file.id} className="bg-white border rounded-lg p-3">
                <div className="aspect-square mb-3 bg-gray-100 rounded overflow-hidden">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                        {file.name || 'Unknown filename'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size || 0)}
                      </p>
                    </div>
                    
                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center space-x-2">
                    {file.status === 'pending' && (
                      <div className="flex items-center text-gray-500">
                        <ImageIcon className="w-4 h-4 mr-1" />
                        <span className="text-xs">Ready to upload</span>
                      </div>
                    )}
                    
                    {file.status === 'uploading' && (
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-blue-600">Uploading...</span>
                          <span className="text-xs text-blue-600">{file.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {file.status === 'completed' && (
                      <div className="flex items-center text-green-600">
                        <CheckIcon className="w-4 h-4 mr-1" />
                        <span className="text-xs">Uploaded successfully</span>
                      </div>
                    )}
                    
                    {file.status === 'error' && (
                      <div className="flex items-center text-red-600">
                        <AlertCircleIcon className="w-4 h-4 mr-1" />
                        <span className="text-xs">{file.error || 'Upload failed'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FreePhotoUpload;