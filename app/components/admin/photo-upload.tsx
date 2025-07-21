"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/app/components/ui/button";
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

interface PhotoUploadProps {
  eventId: string;
  onUploadComplete?: (results: UploadResults) => void;
  onUploadProgress?: (progress: number) => void;
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
  successful: any[];
  failed: Array<{ filename: string; error: string }>;
  total: number;
}

export function PhotoUpload({ 
  eventId, 
  onUploadComplete, 
  onUploadProgress,
  maxFiles = 50,
  disabled = false 
}: PhotoUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [description, setDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [autoApprove, setAutoApprove] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Show validation error (you could add toast notification here)
        console.warn(`File "${fileName}" rejected: ${validation.error}`);
        
        // TODO: Add toast notification library for better UX
        // For now, validation errors are logged to console
      }
    }

    setFiles(prev => {
      const combined = [...prev, ...validatedFiles];
      return combined.slice(0, maxFiles); // Respect max files limit
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
      e.target.value = ''; // Reset input
    }
  }, [addFiles]);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Clean up preview URL
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

  // Upload files
  const uploadFiles = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('event_id', eventId);
      formData.append('description', description);
      formData.append('is_featured', isFeatured.toString());
      formData.append('auto_approve', autoApprove.toString());

      // Add all files to form data
      files.forEach(file => {
        formData.append('files', file as unknown as Blob);
      });

      // Update files status to uploading
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'uploading' as const,
        progress: 0
      })));

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        throw new Error(`Server returned invalid JSON. Status: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        // Enhanced error reporting based on status code
        let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
        
        if (responseData?.error) {
          errorMessage = responseData.error;
        }

        // Provide specific guidance based on error type
        switch (response.status) {
          case 401:
            errorMessage += '\n\nPlease log in and try again.';
            break;
          case 403:
            errorMessage += '\n\nAdmin access required for photo uploads.';
            break;
          case 404:
            errorMessage += '\n\nThe selected event was not found. Please refresh and select a valid event.';
            break;
          case 500:
            errorMessage += '\n\nServer error. Check console for details and verify Supabase Storage is configured.';
            break;
        }

        throw new Error(errorMessage);
      }

      const results = responseData;

      // Update file statuses based on results
      setFiles(prev => prev.map(file => {
        const fileName = file.name || '';
        const successfulUpload = results.results?.successful?.find(
          (s: any) => s && s.original_filename === fileName
        );
        const failedUpload = results.results?.failed?.find(
          (f: any) => f && (f.filename === fileName || f.original_filename === fileName)
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
        }
        return file;
      }));

      if (onUploadComplete) {
        onUploadComplete({
          successful: results.results?.successful || [],
          failed: results.results?.failed || [],
          total: files.length
        });
      }

      // Clear form if all uploads successful
      if (results.results?.failed?.length === 0) {
        setTimeout(() => {
          clearAllFiles();
          setDescription("");
          setIsFeatured(false);
        }, 2000);
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      // Enhanced error logging
      console.group('Photo Upload Debug Information');
      console.log('Event ID:', eventId);
      console.log('Files count:', files.length);
      console.log('Description:', description);
      console.log('Is Featured:', isFeatured);
      console.log('Auto Approve:', autoApprove);
      console.log('Error details:', error);
      console.groupEnd();
      
      // Mark all files as error with detailed message
      const errorMessage = error instanceof Error ? error.message : 'Upload failed - Unknown error';
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'error' as const,
        error: errorMessage
      })));

      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('404')) {
        alert('Event not found. Please refresh the page and select a valid event.');
      } else if (error instanceof Error && error.message.includes('401')) {
        alert('Please log in to upload photos.');
      } else if (error instanceof Error && error.message.includes('403')) {
        alert('Admin access required for photo uploads.');
      } else {
        alert(`Upload failed: ${errorMessage}\n\nCheck the browser console for more details.`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    // Handle invalid inputs
    if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const index = Math.min(i, sizes.length - 1); // Prevent array out of bounds
    
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
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
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
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <UploadIcon className="w-8 h-8 text-gray-400" />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? 'Drop files here' : 'Upload Photos'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supports JPEG (.jpg, .jpeg) and RAW files (.cr2, .nef, .arw, .dng, .orf, .rw2, .raf, etc.) up to 50MB each. Max {maxFiles} files.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Options */}
      {files.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900">Upload Options</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description for all photos"
                disabled={isUploading}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  id="featured"
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  disabled={isUploading}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="featured">Mark as featured</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  id="approve"
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  disabled={isUploading}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="approve">Auto-approve for client viewing</Label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              Selected Files ({files.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFiles}
              disabled={isUploading}
            >
              <TrashIcon className="w-4 h-4 mr-1" />
              Clear All
            </Button>
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
                            className="bg-blue-600 h-1 rounded-full transition-all"
                            style={{ width: `${file.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {file.status === 'completed' && (
                      <div className="flex items-center text-green-600">
                        <CheckIcon className="w-4 h-4 mr-1" />
                        <span className="text-xs">Uploaded</span>
                      </div>
                    )}
                    
                    {file.status === 'error' && (
                      <div className="flex items-center text-red-600">
                        <AlertCircleIcon className="w-4 h-4 mr-1" />
                        <span className="text-xs">Failed</span>
                      </div>
                    )}
                  </div>

                  {file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={clearAllFiles}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={uploadFiles}
            disabled={isUploading || files.length === 0}
          >
            {isUploading ? 'Uploading...' : `Upload ${files.length} Photos`}
          </Button>
        </div>
      )}
    </div>
  );
}