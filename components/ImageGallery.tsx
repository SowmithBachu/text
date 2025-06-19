'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Edit, 
  Trash2, 
  Download, 
  MoreVertical,
  Calendar,
  FileText
} from 'lucide-react';
import { Image } from '@/types';
import { formatFileSize, formatDate } from '@/lib/utils';

interface ImageGalleryProps {
  images: Image[];
  viewMode: 'grid' | 'list';
  onImageSelect: (image: Image) => void;
  onImageDelete: (imageId: string) => void;
}

export function ImageGallery({ 
  images, 
  viewMode, 
  onImageSelect, 
  onImageDelete 
}: ImageGalleryProps) {
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  if (viewMode === 'grid') {
    return (
      <div className="image-gallery">
        {images.map((image) => (
          <Card
            key={image.id}
            className="image-card"
            onMouseEnter={() => setHoveredImage(image.id)}
            onMouseLeave={() => setHoveredImage(null)}
          >
            <div className="relative aspect-square overflow-hidden">
              <img
                src={image.thumbnailUrl}
                alt={image.name}
                className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
              />
              
              <div className="image-card-overlay">
                <div className="image-card-actions">
                  <Button
                    size="sm"
                    onClick={() => onImageSelect(image)}
                    className="bg-white text-gray-900 hover:bg-gray-100"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onImageDelete(image.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {image.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(image.fileSize)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {image.width} × {image.height}
                  </p>
                </div>
                
                {image.textOverlays.length > 0 && (
                  <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                    <FileText className="h-3 w-3 mr-1" />
                    {image.textOverlays.length}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-2">
      {images.map((image) => (
        <Card
          key={image.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onImageSelect(image)}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <img
                  src={image.thumbnailUrl}
                  alt={image.name}
                  className="w-full h-full object-cover rounded-lg"
                />
                {image.textOverlays.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {image.textOverlays.length}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {image.name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span>{formatFileSize(image.fileSize)}</span>
                  <span>•</span>
                  <span>{image.width} × {image.height}</span>
                  <span>•</span>
                  <span className="uppercase">{image.format}</span>
                </div>
                <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(new Date(image.createdAt))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageSelect(image);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle download
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageDelete(image.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 