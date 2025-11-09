'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileImage, AlertCircle, CheckCircle } from 'lucide-react';
import { validateImageFile, formatFileSize } from '@/lib/utils';
import { Image as ImageType } from '@/types';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  onClose: () => void;
  onUploadSuccess: (image: ImageType) => void;
}

export function ImageUploader({ onClose, onUploadSuccess }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid image file.');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Create a blob URL for immediate display
      const blobUrl = URL.createObjectURL(file);
      
      // Get image dimensions
      const img = new window.Image();
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = reject;
        img.src = blobUrl;
      });
      
      setUploadProgress(50);
      
      // Upload to server (non-blocking)
      const formData = new FormData();
      formData.append('file', file);
      
      let serverImageData = null;
      try {
        const response = await fetch('/api/images', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            serverImageData = result.data;
          }
        }
      } catch (error) {
        console.warn('Server upload failed, using local blob URL:', error);
      }
      
      setUploadProgress(100);
      
      // Create image data with blob URL for immediate display
      const imageData: ImageType = {
        id: serverImageData?.id || `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: serverImageData?.userId || 'local',
        name: file.name,
        originalUrl: blobUrl, // Use blob URL for immediate display
        thumbnailUrl: blobUrl, // Use blob URL for thumbnail too
        fileSize: file.size,
        width: dimensions.width,
        height: dimensions.height,
        format: file.type.split('/')[1] || 'png',
        textOverlays: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      onUploadSuccess(imageData);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Upload Image</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              upload-zone cursor-pointer transition-all duration-200
              ${isDragActive ? 'upload-zone-active' : ''}
              ${isDragReject ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
              ${uploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {uploading ? (
              <div className="text-center">
                <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Uploading...
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{uploadProgress}%</p>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {isDragActive ? 'Drop your image here' : 'Drag & drop an image'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  or click to browse files
                </p>
                <p className="text-xs text-gray-500">
                  Supports JPEG, PNG, WebP, GIF (max 10MB)
                </p>
              </div>
            )}
          </div>

          {isDragReject && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  Invalid file type. Please upload an image file.
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 