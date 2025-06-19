'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Undo, 
  Redo, 
  Type, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Settings,
  Palette,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  Trash2
} from 'lucide-react';
import { ImageEditor } from '@/components/ImageEditor';
import { TextStylePanel } from '@/components/TextStylePanel';
import { useEditorStore } from '@/store/editorStore';
import { Image, TextOverlay } from '@/types';
import { generateId } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [image, setImage] = useState<Image | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const { 
    selectedImage, 
    setSelectedImage, 
    zoom, 
    setZoom, 
    pan, 
    setPan,
    undo,
    redo,
    history,
    historyIndex,
    isDirty,
    setDirty
  } = useEditorStore();

  useEffect(() => {
    if (isLoaded && user && params.id) {
      fetchImage();
    }
  }, [isLoaded, user, params.id]);

  const fetchImage = async () => {
    try {
      setLoading(true);
      // In a real app, you'd fetch the image from your API
      // For now, we'll use mock data
      const mockImage: Image = {
        id: params.id as string,
        userId: user?.id || '',
        name: 'Sample Image',
        originalUrl: '/api/images/sample/original',
        thumbnailUrl: '/api/images/sample/thumbnail',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        format: 'jpeg',
        textOverlays: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setImage(mockImage);
      setSelectedImage(mockImage);
    } catch (error) {
      console.error('Error fetching image:', error);
      toast.error('Failed to load image');
    } finally {
      setLoading(false);
    }
  };

  const handleAddText = () => {
    if (!image) return;

    const newTextOverlay: TextOverlay = {
      id: generateId(),
      imageId: image.id,
      text: 'Double-click to edit',
      position: { x: 100, y: 100 },
      style: {
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#000000',
        opacity: 1,
        textAlign: 'left',
        rotation: 0,
      },
      zIndex: image.textOverlays.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setImage(prev => prev ? {
      ...prev,
      textOverlays: [...prev.textOverlays, newTextOverlay]
    } : null);
    setSelectedTextId(newTextOverlay.id);
    setShowTextPanel(true);
    setDirty(true);
  };

  const handleTextUpdate = (textId: string, updates: Partial<TextOverlay>) => {
    setImage(prev => prev ? {
      ...prev,
      textOverlays: prev.textOverlays.map(overlay =>
        overlay.id === textId ? { ...overlay, ...updates, updatedAt: new Date() } : overlay
      )
    } : null);
    setDirty(true);
  };

  const handleTextDelete = (textId: string) => {
    setImage(prev => prev ? {
      ...prev,
      textOverlays: prev.textOverlays.filter(overlay => overlay.id !== textId)
    } : null);
    setSelectedTextId(null);
    setShowTextPanel(false);
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      // In a real app, you'd save the image with text overlays
      toast.success('Image saved successfully!');
      setDirty(false);
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error('Failed to save image');
    }
  };

  const handleExport = async () => {
    try {
      // In a real app, you'd export the image with text overlays
      toast.success('Image exported successfully!');
    } catch (error) {
      console.error('Error exporting image:', error);
      toast.error('Failed to export image');
    }
  };

  const selectedText = image?.textOverlays.find(overlay => overlay.id === selectedTextId);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
          <Button onClick={() => router.push('/sign-in')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Image not found</h1>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {image.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {image.width} × {image.height} • {image.format.toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!isDirty}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Main Editor */}
        <div className="flex-1 relative">
          <ImageEditor
            image={image}
            zoom={zoom}
            pan={pan}
            onZoomChange={setZoom}
            onPanChange={setPan}
            onTextSelect={setSelectedTextId}
            selectedTextId={selectedTextId}
            onTextUpdate={handleTextUpdate}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleAddText}
                >
                  <Type className="h-4 w-4 mr-2" />
                  Add Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setZoom(zoom + 0.1)}
                >
                  <ZoomIn className="h-4 w-4 mr-2" />
                  Zoom In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                >
                  <ZoomOut className="h-4 w-4 mr-2" />
                  Zoom Out
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setZoom(1)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Zoom
                </Button>
              </CardContent>
            </Card>

            {/* Text Layers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Text Layers</CardTitle>
              </CardHeader>
              <CardContent>
                {image.textOverlays.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No text layers yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {image.textOverlays.map((overlay, index) => (
                      <div
                        key={overlay.id}
                        className={`
                          flex items-center justify-between p-2 rounded border cursor-pointer transition-colors
                          ${selectedTextId === overlay.id 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                        onClick={() => setSelectedTextId(overlay.id)}
                      >
                        <div className="flex items-center space-x-2">
                          <Layers className="h-4 w-4 text-gray-400" />
                          <span className="text-sm truncate">
                            {overlay.text || 'Text Layer'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTextDelete(overlay.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Text Style Panel */}
            {selectedText && showTextPanel && (
              <TextStylePanel
                textOverlay={selectedText}
                onUpdate={(updates) => handleTextUpdate(selectedText.id, updates)}
                onClose={() => setShowTextPanel(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 