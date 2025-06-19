'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileImage, AlertCircle, CheckCircle } from 'lucide-react';
import { validateImageFile, formatFileSize } from '@/lib/utils';
import { Image } from '@/types';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  onClose: () => void;
  onUploadSuccess: (image: Image) => void;
}

export function ImageUploader({ onClose, onUploadSuccess }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    setUploading(true);
    setUploadProgress(100);
    // Use blob URL for preview
    const blobUrl = URL.createObjectURL(file);
    // Read real image dimensions
    const img = new window.Image();
    img.src = blobUrl;
    img.onload = () => {
      const imageData: Image = {
        id: `img_${Date.now()}`,
        userId: 'demo',
        name: file.name,
        originalUrl: blobUrl,
        thumbnailUrl: blobUrl,
        fileSize: file.size,
        width: img.width,
        height: img.height,
        format: file.type.split('/')[1],
        textOverlays: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setUploading(false);
      setUploadProgress(0);
      onUploadSuccess(imageData);
    };
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