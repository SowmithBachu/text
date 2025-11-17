'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  Image as ImageIcon,
  Settings,
  LogOut
} from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { ImageGallery } from '@/components/ImageGallery';
import { Sidebar } from '@/components/layout/Sidebar';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useEditorStore } from '@/store/editorStore';
import { Image, TextOverlay } from '@/types';
import toast from 'react-hot-toast';
import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs-backend-cpu';

type FontWeight = 
  | 'normal' | 'bold' | 'light'
  | '100' | '200' | '300' | '400' | '500'
  | '600' | '700' | '800' | '900';
const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
  'Courier New', 'Impact', 'Comic Sans MS',
];

const FONT_WEIGHTS: FontWeight[] = [
  'normal', 'bold', 'light',
  '100', '200', '300', '400', '500',
  '600', '700', '800', '900',
];

const WATERMARK_TEXT = 'textoverlayed';
const drawWatermark = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const fontSize = Math.round(Math.min(width, height) / 4);
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#111111';
  ctx.font = `700 ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(width / 2, height / 2);
  ctx.rotate((-30 * Math.PI) / 180);
  ctx.fillText(WATERMARK_TEXT, 0, 0);
  ctx.restore();
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<Image | null>(null);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [newText, setNewText] = useState('Your Text');
  const [segmentation, setSegmentation] = useState<ImageData | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { setSelectedImage } = useEditorStore();
  const [canvasDims, setCanvasDims] = useState<{width: number, height: number}>({ width: 0, height: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{x: number, y: number} | null>(null);

  // Track if component has mounted on client to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/images');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setImages(data.data);
      } else {
        toast.error('Failed to load images');
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch images when component mounts and user is available
  useEffect(() => {
    if (isLoaded && user) {
      fetchImages();
    }
  }, [isLoaded, user, fetchImages]);

  // Run segmentation when previewImage changes (non-blocking, runs in background)
  useEffect(() => {
    if (!previewImage) return;
    let cancelled = false;
    
    const runSegmentation = async () => {
      try {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = previewImage.originalUrl;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        if (cancelled) return;
        
        const net = await bodyPix.load();
        if (cancelled) return;
        
        const segmentation = await net.segmentPerson(img, { internalResolution: 'medium' });
        if (cancelled) return;
        
        // Create a mask image
        const mask = bodyPix.toMask(segmentation);
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
        const ctx = maskCanvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(mask, 0, 0);
          if (!cancelled) {
            setSegmentation(ctx.getImageData(0, 0, img.width, img.height));
          }
        }
      } catch (error) {
        console.warn('Segmentation failed or was cancelled:', error);
        // Don't set segmentation on error - editor will work without it
      }
    };
    
    runSegmentation();
    
    return () => {
      cancelled = true;
    };
  }, [previewImage]);

  // When previewImage changes, set canvasDims to match image aspect ratio and size (but max 700x500)
  useEffect(() => {
    if (!previewImage) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = previewImage.originalUrl;
    img.onload = () => {
      let w = img.naturalWidth || img.width || previewImage.width || 400;
      let h = img.naturalHeight || img.height || previewImage.height || 400;
      const maxW = 700;
      const maxH = 500;
      const ratio = Math.min(maxW / w, maxH / h, 1);
      setCanvasDims({ width: Math.round(w * ratio), height: Math.round(h * ratio) });
      setImageProcessing(false);
    };
    img.onerror = () => {
      console.error('Failed to load image:', previewImage.originalUrl);
      // Use fallback dimensions from previewImage data if available
      const w = previewImage.width || 400;
      const h = previewImage.height || 400;
      const maxW = 700;
      const maxH = 500;
      const ratio = Math.min(maxW / w, maxH / h, 1);
      setCanvasDims({ width: Math.round(w * ratio), height: Math.round(h * ratio) });
      setImageProcessing(false);
    };
  }, [previewImage]);

  // Draw composited image (full image, then text overlays)
  // Works immediately without waiting for segmentation
  useEffect(() => {
    if (!previewImage || !canvasRef.current) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = previewImage.originalUrl;
    img.onload = () => {
      const canvas = canvasRef.current!;
      // Use natural dimensions for canvas (actual image size)
      const imgWidth = img.naturalWidth || img.width;
      const imgHeight = img.naturalHeight || img.height;
      canvas.width = imgWidth;
      canvas.height = imgHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 1. Draw the full image
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
      // 2. Draw watermark behind overlays
      drawWatermark(ctx, imgWidth, imgHeight);

      // 3. Draw text overlays
      if (textOverlays.length > 0) {
        // If we have segmentation, use masking; otherwise draw text directly
        if (segmentation) {
          // Draw text with segmentation masking (text only on background)
          const textCanvas = document.createElement('canvas');
          textCanvas.width = imgWidth;
          textCanvas.height = imgHeight;
          const textCtx = textCanvas.getContext('2d');
          if (textCtx) {
            textOverlays.forEach(overlay => {
              textCtx.save();
              textCtx.font = `${overlay.style.fontWeight} ${overlay.style.fontSize}px ${overlay.style.fontFamily}`;
              textCtx.fillStyle = overlay.style.color;
              textCtx.globalAlpha = overlay.style.opacity;
              const validTextAligns = ['left', 'right', 'center', 'start', 'end'] as const;
              const isValidAlign = validTextAligns.includes(overlay.style.textAlign as typeof validTextAligns[number]);
              textCtx.textAlign = isValidAlign ? overlay.style.textAlign as CanvasTextAlign : 'center';
              textCtx.textBaseline = 'middle';
              
              if (overlay.style.shadow) {
                textCtx.shadowColor = overlay.style.shadow.color || '#000000';
                textCtx.shadowBlur = overlay.style.shadow.blur || 0;
                textCtx.shadowOffsetX = overlay.style.shadow.offsetX || 0;
                textCtx.shadowOffsetY = overlay.style.shadow.offsetY || 0;
              } else {
                textCtx.shadowColor = 'transparent';
                textCtx.shadowBlur = 0;
                textCtx.shadowOffsetX = 0;
                textCtx.shadowOffsetY = 0;
              }
              if (overlay.style.stroke && overlay.style.stroke.width > 0) {
                textCtx.lineWidth = overlay.style.stroke.width;
                textCtx.strokeStyle = overlay.style.stroke.color || '#000000';
              }
              textCtx.translate(overlay.position.x, overlay.position.y);
              textCtx.rotate((overlay.style.rotation * Math.PI) / 180);
              textCtx.fillText(overlay.text, 0, 0);
              textCtx.restore();
            });
            
            // Apply segmentation mask to text canvas
            const maskData = segmentation.data;
            const textImageData = textCtx.getImageData(0, 0, imgWidth, imgHeight);
            for (let i = 0; i < maskData.length; i += 4) {
              if (maskData[i + 3] === 0) { // If mask alpha == 0, it's background
                textImageData.data[i + 3] = 0; // Make text transparent where background is
              }
            }
            textCtx.putImageData(textImageData, 0, 0);
            ctx.drawImage(textCanvas, 0, 0);
          }
        } else {
          // Draw text directly without masking (segmentation not ready yet)
          textOverlays.forEach(overlay => {
            ctx.save();
            ctx.font = `${overlay.style.fontWeight} ${overlay.style.fontSize}px ${overlay.style.fontFamily}`;
            ctx.fillStyle = overlay.style.color;
            ctx.globalAlpha = overlay.style.opacity;
            const validTextAligns = ['left', 'right', 'center', 'start', 'end'] as const;
            const isValidAlign = validTextAligns.includes(overlay.style.textAlign as typeof validTextAligns[number]);
            ctx.textAlign = isValidAlign ? overlay.style.textAlign as CanvasTextAlign : 'center';
            ctx.textBaseline = 'middle';
            
            if (overlay.style.shadow) {
              ctx.shadowColor = overlay.style.shadow.color || '#000000';
              ctx.shadowBlur = overlay.style.shadow.blur || 0;
              ctx.shadowOffsetX = overlay.style.shadow.offsetX || 0;
              ctx.shadowOffsetY = overlay.style.shadow.offsetY || 0;
            } else {
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
            }
            if (overlay.style.stroke && overlay.style.stroke.width > 0) {
              ctx.lineWidth = overlay.style.stroke.width;
              ctx.strokeStyle = overlay.style.stroke.color || '#000000';
            }
            ctx.translate(overlay.position.x, overlay.position.y);
            ctx.rotate((overlay.style.rotation * Math.PI) / 180);
            ctx.fillText(overlay.text, 0, 0);
            ctx.restore();
          });
        }
      }
    };
    img.onerror = (error) => {
      console.error('Failed to load image:', previewImage.originalUrl, error);
      setImageProcessing(false);
    };
  }, [previewImage, segmentation, textOverlays]);

  const handleImageSelect = useCallback((image: Image) => {
    setSelectedImage(image);
    setPreviewImage(image);
    setTextOverlays([]);
    setSegmentation(null);
    setImageProcessing(true);
  }, [setSelectedImage]);

  const handleImageDelete = useCallback(async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setImages(prevImages => prevImages.filter(img => img.id !== imageId));
        toast.success('Image deleted successfully');
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  }, []);

  const handleUploadSuccess = useCallback((newImage: Image) => {
    setImages(prevImages => [newImage, ...prevImages]);
    setShowUploader(false);
    setPreviewImage(newImage);
    setTextOverlays([]);
    setSegmentation(null);
    setImageProcessing(true);
    toast.success('Image uploaded successfully!');
  }, []);

  const handleAddText = useCallback(() => {
    if (!previewImage) return;
    const imgW = previewImage.width || 400;
    const imgH = previewImage.height || 400;
    const id = `text_${Date.now()}`;
    const overlay: TextOverlay = {
      id,
      imageId: previewImage.id,
      text: 'Your Text',
      position: { x: Math.round(imgW / 2), y: Math.round(imgH / 2) },
      style: {
        fontSize: 48,
        fontFamily: 'Arial',
        fontWeight: '700',
        color: '#d9dc1e',
        opacity: 1,
        textAlign: 'center',
        rotation: 0,
      },
      zIndex: textOverlays.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTextOverlays(prevOverlays => [...prevOverlays, overlay]);
    setEditingTextId(id);
    setNewText('Your Text');
    // Scroll to canvas after adding text
    setTimeout(() => {
      canvasContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  }, [previewImage, textOverlays.length]);

  const handleTextChange = useCallback((id: string, value: string) => {
    setTextOverlays(prevOverlays => prevOverlays.map(t => t.id === id ? { ...t, text: value } : t));
  }, []);

  // Text style handlers
  const handleFontChange = useCallback((id: string, fontFamily: string) => {
    setTextOverlays(prevOverlays => prevOverlays.map(t => t.id === id ? { ...t, style: { ...t.style, fontFamily } } : t));
  }, []);
  const handleFontSizeChange = useCallback((id: string, fontSize: number) => {
    setTextOverlays(prevOverlays => prevOverlays.map(t => t.id === id ? { ...t, style: { ...t.style, fontSize } } : t));
  }, []);
  const handleColorChange = useCallback((id: string, color: string) => {
    setTextOverlays(prevOverlays => prevOverlays.map(t => t.id === id ? { ...t, style: { ...t.style, color } } : t));
  }, []);
  const handleFontWeightChange = useCallback((
  id: string,
  fontWeight: "normal" | "bold" | "light" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
) => {
  setTextOverlays(prevOverlays =>
    prevOverlays.map(t =>
      t.id === id
        ? { ...t, style: { ...t.style, fontWeight } }
        : t
    )
  );
}, []);
  const handleRemoveText = useCallback((id: string) => {
    setTextOverlays(prevOverlays => prevOverlays.filter(t => t.id !== id));
    if (editingTextId === id) setEditingTextId(null);
  }, [editingTextId]);

  const selectedOverlay = useMemo(() => 
    textOverlays.find(t => t.id === editingTextId), 
    [textOverlays, editingTextId]
  );

  // Mouse event handlers for dragging overlays
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !previewImage) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = previewImage.width / rect.width;
    const scaleY = previewImage.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    for (let i = textOverlays.length - 1; i >= 0; i--) {
      const overlay = textOverlays[i];
      const fontSize = overlay.style.fontSize;
      const textWidth = fontSize * (overlay.text.length * 0.6);
      const textHeight = fontSize;
      if (
        x >= overlay.position.x - textWidth / 2 &&
        x <= overlay.position.x + textWidth / 2 &&
        y >= overlay.position.y - textHeight / 2 &&
        y <= overlay.position.y + textHeight / 2
      ) {
        setDraggingId(overlay.id);
        setEditingTextId(overlay.id);
        setDragOffset({ x: x - overlay.position.x, y: y - overlay.position.y });
        return;
      }
    }
  }, [previewImage, textOverlays]);
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingId || !canvasRef.current || !previewImage) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = previewImage.width / rect.width;
    const scaleY = previewImage.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setTextOverlays(prevOverlays => prevOverlays.map(t =>
      t.id === draggingId && dragOffset
        ? { ...t, position: { x: x - dragOffset.x, y: y - dragOffset.y } }
        : t
    ));
  }, [draggingId, dragOffset, previewImage]);
  const handleCanvasMouseUp = useCallback(() => {
    setDraggingId(null);
    setDragOffset(null);
  }, []);

  // Add handlers for opacity and letter spacing
  const handleOpacityChange = (id: string, opacity: number) => {
    setTextOverlays(textOverlays => textOverlays.map(t => t.id === id ? { ...t, style: { ...t.style, opacity } } : t));
  };
  const handleLetterSpacingChange = (id: string, letterSpacing: number) => {
    setTextOverlays(textOverlays => textOverlays.map(t => t.id === id ? { ...t, style: { ...t.style, letterSpacing } } : t));
  };

  // Add handlers for new features
const handleTextAlignChange = (
  id: string,
  textAlign: 'left' | 'center' | 'right' | 'justify'
) => {
  setTextOverlays(textOverlays =>
    textOverlays.map(t =>
      t.id === id
        ? { ...t, style: { ...t.style, textAlign } }
        : t
    )
  );
};

  const handleShadowChange = (id: string, shadow: any) => {
    setTextOverlays(textOverlays => textOverlays.map(t => t.id === id ? { ...t, style: { ...t.style, shadow } } : t));
  };
  const handleRotationChange = (id: string, rotation: number) => {
    setTextOverlays(textOverlays => textOverlays.map(t => t.id === id ? { ...t, style: { ...t.style, rotation } } : t));
  };
  const handleResetStyles = (id: string) => {
    setTextOverlays(textOverlays => textOverlays.map(t => t.id === id ? {
      ...t,
      style: {
        fontSize: 48,
        fontFamily: 'Arial',
        fontWeight: '700',
        color: '#d9dc1e',
        opacity: 1,
        textAlign: 'center',
        rotation: 0,
        shadow: undefined,
      }
    } : t));
  };

  const handleDownloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Show loading state while component is mounting or Clerk is loading
  if (!mounted || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please sign in to access the dashboard</p>
          <a href="/signin">
            <Button>Sign In</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b-2 border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden bg-gray-100 dark:bg-gray-800 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all duration-300"
            >
              <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-black dark:bg-gray-700 rounded-xl blur-md opacity-20 dark:opacity-40"></div>
                <div className="relative bg-black dark:bg-gray-800 p-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <ImageIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-extrabold text-black dark:text-white">
                TextOverlayed
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative p-6">
        {/* Subtle background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-200/10 dark:bg-gray-800/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-300/10 dark:bg-gray-700/20 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Gallery Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white">
                My Images
              </h1>
              
            </div>
            
          </div>

          {/* Image Gallery */}
          {previewImage ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col md:flex-row items-start gap-8 border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto">
              {/* Left: Image Preview */}
              <div ref={canvasContainerRef} className="flex-1 flex justify-center items-center min-h-[300px] w-full md:w-auto" style={{ minHeight: canvasDims.height }}>
                {imageProcessing ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black dark:border-gray-400"></div>
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      Processing image...<br />
                      <span className="text-sm">This may take a few seconds</span>
                    </p>
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    width={canvasDims.width}
                    height={canvasDims.height}
                    className="rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg bg-gray-100 dark:bg-gray-900 transition-all duration-300 cursor-move"
                    style={{
                      width: canvasDims.width,
                      height: canvasDims.height,
                      maxWidth: '100%',
                      maxHeight: 500,
                      objectFit: 'contain',
                      background: '#f3f4f6',
                    }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                  />
                )}
              </div>
              {/* Right: Edit Panel */}
              <div className="flex-1 w-full md:w-[400px] flex flex-col gap-4">
                {imageProcessing ? (
                  <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-gray-400"></div>
                    <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
                      Preparing editor...
                    </p>
                  </div>
                ) : (
                  <>
                    <Button className="w-full max-w-xs self-center bg-black dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white" onClick={handleAddText}>
                      + Add Text
                    </Button>
                {/* Overlay list with remove buttons */}
                {textOverlays.length > 0 && (
                  <div className="mb-2 flex gap-2 flex-wrap w-full">
                    {textOverlays.map(overlay => (
                      <div key={overlay.id} className="flex items-center gap-1">
                        <button
                          className={`px-2 py-1 rounded border ${editingTextId === overlay.id ? 'bg-black dark:bg-gray-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                          onClick={() => setEditingTextId(overlay.id)}
                        >
                          {overlay.text || 'Text'}
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700 text-xs px-1 py-0.5 rounded"
                          title="Remove text"
                          onClick={() => handleRemoveText(overlay.id)}
                        >
                          🗑
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Text editing panel */}
                {selectedOverlay && (
                  <div className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 flex flex-col gap-2 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-base text-black dark:text-white tracking-wide">Edit Text</span>
                      <button className="text-xs text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white underline" onClick={() => handleResetStyles(selectedOverlay.id)}>Reset</button>
                    </div>
                    {/* Text Content */}
                    <div className="mb-0.5">
                      <label className="block text-xs font-medium mb-0.5 text-gray-700 dark:text-gray-300">Text</label>
                      <input
                        type="text"
                        value={selectedOverlay?.text || ''}
                        onChange={e => selectedOverlay && handleTextChange(selectedOverlay.id, e.target.value)}
                        className="w-full rounded border px-2 py-0.5 text-sm shadow focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                      />
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-0.5" />
                    {/* Font Controls */}
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="block text-xs font-medium mb-0.5 text-gray-700 dark:text-gray-300">Font</label>
                        <select
                          value={selectedOverlay.style.fontFamily}
                          onChange={e => handleFontChange(selectedOverlay.id, e.target.value)}
                          className="w-full rounded border px-2 py-0.5 text-xs"
                        >
                          {FONT_FAMILIES.map(font => (
                            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-0.5 text-gray-700 dark:text-gray-300">Weight</label>
                        <select
                          value={selectedOverlay.style.fontWeight}
                          onChange={e =>
  handleFontWeightChange(selectedOverlay.id, e.target.value as FontWeight)}
                          className="w-full rounded border px-2 py-0.5 text-xs"
                        >
                          {FONT_WEIGHTS.map(weight => (
                            <option key={weight} value={weight}>{weight}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-0.5 text-gray-700 dark:text-gray-300">Size</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="range"
                            min={8}
                            max={400}
                            value={selectedOverlay.style.fontSize}
                            onChange={e => handleFontSizeChange(selectedOverlay.id, Number(e.target.value))}
                            className="flex-1 accent-black dark:accent-gray-400"
                          />
                          <input
                            type="number"
                            min={8}
                            max={400}
                            value={selectedOverlay.style.fontSize}
                            onChange={e => handleFontSizeChange(selectedOverlay.id, Number(e.target.value))}
                            className="w-14 border rounded px-1 py-0.5 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-0.5 text-gray-700 dark:text-gray-300">Color</label>
                        <input
                          type="color"
                          value={selectedOverlay.style.color}
                          onChange={e => handleColorChange(selectedOverlay.id, e.target.value)}
                          className="w-7 h-7 p-0 border-2 border-gray-300 dark:border-gray-600 rounded-full shadow"
                        />
                      </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-0.5" />
                    {/* Alignment & Opacity */}
                    <div className="flex gap-1 items-center">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-0.5 text-gray-700 dark:text-gray-300">Align</label>
                        <div className="flex gap-0.5">
                          <button className={`px-1 py-0.5 rounded ${selectedOverlay.style.textAlign === 'left' ? 'bg-black dark:bg-gray-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`} onClick={() => handleTextAlignChange(selectedOverlay.id, 'left')}>L</button>
                          <button className={`px-1 py-0.5 rounded ${selectedOverlay.style.textAlign === 'center' ? 'bg-black dark:bg-gray-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`} onClick={() => handleTextAlignChange(selectedOverlay.id, 'center')}>C</button>
                          <button className={`px-1 py-0.5 rounded ${selectedOverlay.style.textAlign === 'right' ? 'bg-black dark:bg-gray-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`} onClick={() => handleTextAlignChange(selectedOverlay.id, 'right')}>R</button>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-0.5 text-gray-700 dark:text-gray-300">Opacity</label>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={selectedOverlay.style.opacity ?? 1}
                          onChange={e => handleOpacityChange(selectedOverlay.id, parseFloat(e.target.value))}
                          className="w-full accent-black dark:accent-gray-400"
                        />
                      </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-0.5" />
                    {/* Shadow Controls */}
                    <div className="flex gap-1 mb-1 items-end">
                      <div>
                        <label className="block text-xs font-medium mb-0.5 text-gray-700 dark:text-gray-300">Shadow</label>
                        <input type="color" value={selectedOverlay.style.shadow?.color || '#000000'} onChange={e => handleShadowChange(selectedOverlay.id, { ...selectedOverlay.style.shadow, color: e.target.value, blur: selectedOverlay.style.shadow?.blur || 0, offsetX: selectedOverlay.style.shadow?.offsetX || 0, offsetY: selectedOverlay.style.shadow?.offsetY || 0 })} className="w-6 h-6 border rounded" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-0.5 text-gray-700 dark:text-gray-300">Blur</label>
                        <input type="number" min={0} max={50} value={selectedOverlay.style.shadow?.blur || 0} onChange={e => handleShadowChange(selectedOverlay.id, { ...selectedOverlay.style.shadow, blur: Number(e.target.value), color: selectedOverlay.style.shadow?.color || '#000000', offsetX: selectedOverlay.style.shadow?.offsetX || 0, offsetY: selectedOverlay.style.shadow?.offsetY || 0 })} className="w-full border rounded px-1 py-0.5 text-xs" placeholder="Blur" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-0.5 text-gray-700 dark:text-gray-300">X</label>
                        <input type="number" min={-50} max={50} value={selectedOverlay.style.shadow?.offsetX || 0} onChange={e => handleShadowChange(selectedOverlay.id, { ...selectedOverlay.style.shadow, offsetX: Number(e.target.value), color: selectedOverlay.style.shadow?.color || '#000000', blur: selectedOverlay.style.shadow?.blur || 0, offsetY: selectedOverlay.style.shadow?.offsetY || 0 })} className="w-full border rounded px-1 py-0.5 text-xs" placeholder="X" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-0.5 text-gray-700 dark:text-gray-300">Y</label>
                        <input type="number" min={-50} max={50} value={selectedOverlay.style.shadow?.offsetY || 0} onChange={e => handleShadowChange(selectedOverlay.id, { ...selectedOverlay.style.shadow, offsetY: Number(e.target.value), color: selectedOverlay.style.shadow?.color || '#000000', blur: selectedOverlay.style.shadow?.blur || 0, offsetX: selectedOverlay.style.shadow?.offsetX || 0 })} className="w-full border rounded px-1 py-0.5 text-xs" placeholder="Y" />
                      </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-0.5" />
                    {/* Rotation */}
                    <div>
                      <label className="block text-xs font-medium mb-0.5 text-gray-700 dark:text-gray-300">Rotation: {selectedOverlay.style.rotation}°</label>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        value={selectedOverlay.style.rotation}
                        onChange={e => handleRotationChange(selectedOverlay.id, Number(e.target.value))}
                        className="w-full accent-black dark:accent-gray-400"
                      />
                    </div>
                    <div className="w-full flex justify-center mt-1">
                      <Button className="w-full max-w-xs bg-green-600 hover:bg-green-700 text-white text-base font-semibold py-1.5 rounded-xl shadow-lg" onClick={handleDownloadImage}>
                        Download Image
                      </Button>
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative">
                {/* Animated background circle */}
                <div className="absolute inset-0 bg-gray-400 dark:bg-gray-700 rounded-full blur-2xl opacity-10 animate-pulse"></div>
                <div className="relative flex flex-col items-center space-y-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-12 border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
                  <div className="relative">
                    <div className="absolute inset-0 bg-black dark:bg-gray-600 rounded-full blur-md opacity-20"></div>
                    <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-black dark:border-t-gray-400 border-r-gray-600 dark:border-r-gray-500"></div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-semibold text-black dark:text-white">
                      Loading images...
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Please wait a moment
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="relative">
              {/* Decorative background elements */}
              <div className="absolute -top-10 -left-10 w-72 h-72 bg-gray-300 dark:bg-gray-800 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
              <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-gray-400 dark:bg-gray-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
              
              <Card className="relative text-center py-16 px-8 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl backdrop-blur-sm overflow-hidden">
                {/* Decorative border gradient */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-gray-100/50 via-gray-50/50 to-gray-100/50 dark:from-gray-700/20 dark:via-gray-800/20 dark:to-gray-700/20 pointer-events-none"></div>
                
                <CardContent className="relative z-10">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-black dark:bg-gray-600 rounded-2xl blur-2xl opacity-10 dark:opacity-20"></div>
                    <div className="relative bg-gray-50 dark:bg-gray-800/60 p-8 rounded-3xl border-2 border-gray-200 dark:border-gray-700 shadow-xl">
                      <ImageIcon className="h-20 w-20 mx-auto text-black dark:text-gray-300 drop-shadow-lg" strokeWidth={2} />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 text-black dark:text-white">
                    No images yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg max-w-md mx-auto">
                    Get started by uploading your first image and transform it with beautiful text overlays.
                  </p>
                  
                  <Button 
                    onClick={() => setShowUploader(true)}
                    className="bg-black dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg border border-gray-200 dark:border-gray-700"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Image
                  </Button>
                  
                  {/* Feature highlights */}
                  
                </CardContent>
              </Card>
            </div>
          ) : (
            <ImageGallery
              images={images}
              viewMode="grid"
              onImageSelect={handleImageSelect}
              onImageDelete={handleImageDelete}
            />
          )}
        </div>
      </main>

      {/* Image Uploader Modal */}
      {showUploader && (
        <ImageUploader
          onClose={() => setShowUploader(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
} 