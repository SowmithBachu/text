'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Sidebar } from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
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

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<Image | null>(null);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [newText, setNewText] = useState('Your Text');
  const [segmentation, setSegmentation] = useState<ImageData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { setSelectedImage } = useEditorStore();
  const [canvasDims, setCanvasDims] = useState<{width: number, height: number}>({ width: 0, height: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{x: number, y: number} | null>(null);

  // Fetch images when component mounts and user is available
  useEffect(() => {
    if (isLoaded && user) {
      fetchImages();
    }
  }, [isLoaded, user]);

  // Run segmentation when previewImage changes
  useEffect(() => {
    if (!previewImage) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = previewImage.originalUrl;
    img.onload = async () => {
      const net = await bodyPix.load();
      const segmentation = await net.segmentPerson(img, { internalResolution: 'medium' });
      // Create a mask image
      const mask = bodyPix.toMask(segmentation);
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      const ctx = maskCanvas.getContext('2d');
      if (ctx) ctx.putImageData(mask, 0, 0);
      setSegmentation(ctx ? ctx.getImageData(0, 0, img.width, img.height) : null);
    };
  }, [previewImage]);

  // When previewImage changes, set canvasDims to match image aspect ratio and size (but max 700x500)
  useEffect(() => {
    if (!previewImage) return;
    const img = new window.Image();
    img.src = previewImage.originalUrl;
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      const maxW = 700;
      const maxH = 500;
      const ratio = Math.min(maxW / w, maxH / h, 1);
      setCanvasDims({ width: Math.round(w * ratio), height: Math.round(h * ratio) });
    };
  }, [previewImage]);

  // Draw composited image (full image, then text masked by person/object)
  useEffect(() => {
    if (!previewImage || !segmentation || !canvasRef.current) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = previewImage.originalUrl;
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // 1. Draw the full image
      ctx.drawImage(img, 0, 0);
      // 2. Draw text overlays, but mask out the person/object area (so text is only on background)
      const textCanvas = document.createElement('canvas');
      textCanvas.width = img.width;
      textCanvas.height = img.height;
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
        // Mask out the person/object from the text canvas
        const maskData = segmentation.data;
        const textImageData = textCtx.getImageData(0, 0, img.width, img.height);
        for (let i = 0; i < maskData.length; i += 4) {
          if (maskData[i + 3] === 0) { // If mask alpha == 0, it's background
            textImageData.data[i + 3] = 0; // Make text transparent where background is
          }
        }
        textCtx.putImageData(textImageData, 0, 0);
        ctx.drawImage(textCanvas, 0, 0);
      }
    };
  }, [previewImage, segmentation, textOverlays]);

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
          <a href="/sign-in">
            <Button>Sign In</Button>
          </a>
        </div>
      </div>
    );
  }

  const fetchImages = async () => {
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
  };

  const handleImageSelect = (image: Image) => {
    setSelectedImage(image);
    // Navigate to editor
    window.location.href = `/editor/${image.id}`;
  };

  const handleImageDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setImages(images.filter(img => img.id !== imageId));
        toast.success('Image deleted successfully');
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleUploadSuccess = (newImage: Image) => {
    setImages([newImage, ...images]);
    setShowUploader(false);
    setPreviewImage(newImage);
    setTextOverlays([]);
    setSegmentation(null);
    toast.success('Image uploaded successfully!');
  };

  const handleAddText = () => {
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
    setTextOverlays([...textOverlays, overlay]);
    setEditingTextId(id);
    setNewText('Your Text');
    // Scroll to canvas after adding text
    setTimeout(() => {
      canvasContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  };

  const handleTextChange = (id: string, value: string) => {
    setTextOverlays(textOverlays.map(t => t.id === id ? { ...t, text: value } : t));
  };

  // Text style handlers
  const handleFontChange = (id: string, fontFamily: string) => {
    setTextOverlays(textOverlays.map(t => t.id === id ? { ...t, style: { ...t.style, fontFamily } } : t));
  };
  const handleFontSizeChange = (id: string, fontSize: number) => {
    setTextOverlays(textOverlays.map(t => t.id === id ? { ...t, style: { ...t.style, fontSize } } : t));
  };
  const handleColorChange = (id: string, color: string) => {
    setTextOverlays(textOverlays.map(t => t.id === id ? { ...t, style: { ...t.style, color } } : t));
  };
  const handleFontWeightChange = (
  id: string,
  fontWeight: "normal" | "bold" | "light" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
) => {
  setTextOverlays(
    textOverlays.map(t =>
      t.id === id
        ? { ...t, style: { ...t.style, fontWeight } }
        : t
    )
  );
};
  const handleRemoveText = (id: string) => {
    setTextOverlays(textOverlays.filter(t => t.id !== id));
    if (editingTextId === id) setEditingTextId(null);
  };

  const selectedOverlay = textOverlays.find(t => t.id === editingTextId);

  // Mouse event handlers for dragging overlays
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
  };
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingId || !canvasRef.current || !previewImage) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = previewImage.width / rect.width;
    const scaleY = previewImage.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setTextOverlays(textOverlays => textOverlays.map(t =>
      t.id === draggingId && dragOffset
        ? { ...t, position: { x: x - dragOffset.x, y: y - dragOffset.y } }
        : t
    ));
  };
  const handleCanvasMouseUp = () => {
    setDraggingId(null);
    setDragOffset(null);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Header */}
      <header className="bg-white/10 dark:bg-gray-900/10 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/50">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden bg-white/10 dark:bg-gray-900/10 backdrop-blur-xl border border-white/20 dark:border-gray-800/50 hover:bg-white/20 dark:hover:bg-gray-900/20"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur-sm"></div>
                <ImageIcon className="relative h-8 w-8 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Gallery Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Images
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {images.length} images
              </p>
            </div>
          </div>

          {/* Image Gallery */}
          {previewImage ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col md:flex-row items-start gap-8 border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto">
              {/* Left: Image Preview */}
              <div ref={canvasContainerRef} className="flex-1 flex justify-center items-center min-h-[300px] w-full md:w-auto" style={{ minHeight: canvasDims.height }}>
                <canvas
                  ref={canvasRef}
                  width={canvasDims.width}
                  height={canvasDims.height}
                  className="rounded-xl border-2 border-blue-200 shadow-lg bg-gray-100 dark:bg-gray-900 transition-all duration-300 cursor-move"
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
              </div>
              {/* Right: Edit Panel */}
              <div className="flex-1 w-full md:w-[400px] flex flex-col gap-4">
                <Button className="w-full max-w-xs self-center" onClick={handleAddText}>
                  + Add Text
                </Button>
                {/* Overlay list with remove buttons */}
                {textOverlays.length > 0 && (
                  <div className="mb-2 flex gap-2 flex-wrap w-full">
                    {textOverlays.map(overlay => (
                      <div key={overlay.id} className="flex items-center gap-1">
                        <button
                          className={`px-2 py-1 rounded border ${editingTextId === overlay.id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
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
                  <div className="w-full bg-gradient-to-br from-gray-50 via-blue-50 to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-700 rounded-2xl p-4 flex flex-col gap-2 shadow-lg border border-blue-200 dark:border-blue-900">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-base text-blue-700 dark:text-blue-300 tracking-wide">Edit Text</span>
                      <button className="text-xs text-blue-500 underline" onClick={() => handleResetStyles(selectedOverlay.id)}>Reset</button>
                    </div>
                    {/* Text Content */}
                    <div className="mb-0.5">
                      <label className="block text-xs font-medium mb-0.5 text-blue-700 dark:text-blue-300">Text</label>
                      <input
                        type="text"
                        value={selectedOverlay?.text || ''}
                        onChange={e => selectedOverlay && handleTextChange(selectedOverlay.id, e.target.value)}
                        className="w-full rounded border px-2 py-0.5 text-sm shadow focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div className="border-t border-blue-100 dark:border-blue-900 my-0.5" />
                    {/* Font Controls */}
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="block text-xs font-medium mb-0.5 text-blue-700 dark:text-blue-300">Font</label>
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
                        <label className="block text-xs font-medium mb-0.5 text-blue-700 dark:text-blue-300">Weight</label>
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
                        <label className="block text-xs font-medium mb-0.5 text-blue-700 dark:text-blue-300">Size</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="range"
                            min={8}
                            max={400}
                            value={selectedOverlay.style.fontSize}
                            onChange={e => handleFontSizeChange(selectedOverlay.id, Number(e.target.value))}
                            className="flex-1 accent-blue-500"
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
                        <label className="block text-xs font-medium mb-0.5 text-blue-700 dark:text-blue-300">Color</label>
                        <input
                          type="color"
                          value={selectedOverlay.style.color}
                          onChange={e => handleColorChange(selectedOverlay.id, e.target.value)}
                          className="w-7 h-7 p-0 border-2 border-blue-200 rounded-full shadow"
                        />
                      </div>
                    </div>
                    <div className="border-t border-blue-100 dark:border-blue-900 my-0.5" />
                    {/* Alignment & Opacity */}
                    <div className="flex gap-1 items-center">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-0.5 text-blue-700 dark:text-blue-300">Align</label>
                        <div className="flex gap-0.5">
                          <button className={`px-1 py-0.5 rounded ${selectedOverlay.style.textAlign === 'left' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} onClick={() => handleTextAlignChange(selectedOverlay.id, 'left')}>L</button>
                          <button className={`px-1 py-0.5 rounded ${selectedOverlay.style.textAlign === 'center' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} onClick={() => handleTextAlignChange(selectedOverlay.id, 'center')}>C</button>
                          <button className={`px-1 py-0.5 rounded ${selectedOverlay.style.textAlign === 'right' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} onClick={() => handleTextAlignChange(selectedOverlay.id, 'right')}>R</button>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-0.5 text-blue-700 dark:text-blue-300">Opacity</label>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={selectedOverlay.style.opacity ?? 1}
                          onChange={e => handleOpacityChange(selectedOverlay.id, parseFloat(e.target.value))}
                          className="w-full accent-blue-500"
                        />
                      </div>
                    </div>
                    <div className="border-t border-blue-100 dark:border-blue-900 my-0.5" />
                    {/* Shadow Controls */}
                    <div className="flex gap-1 mb-1 items-end">
                      <div>
                        <label className="block text-xs font-medium mb-0.5 text-blue-700 dark:text-blue-300">Shadow</label>
                        <input type="color" value={selectedOverlay.style.shadow?.color || '#000000'} onChange={e => handleShadowChange(selectedOverlay.id, { ...selectedOverlay.style.shadow, color: e.target.value, blur: selectedOverlay.style.shadow?.blur || 0, offsetX: selectedOverlay.style.shadow?.offsetX || 0, offsetY: selectedOverlay.style.shadow?.offsetY || 0 })} className="w-6 h-6 border rounded" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-0.5 text-blue-700 dark:text-blue-300">Blur</label>
                        <input type="number" min={0} max={50} value={selectedOverlay.style.shadow?.blur || 0} onChange={e => handleShadowChange(selectedOverlay.id, { ...selectedOverlay.style.shadow, blur: Number(e.target.value), color: selectedOverlay.style.shadow?.color || '#000000', offsetX: selectedOverlay.style.shadow?.offsetX || 0, offsetY: selectedOverlay.style.shadow?.offsetY || 0 })} className="w-full border rounded px-1 py-0.5 text-xs" placeholder="Blur" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-0.5 text-blue-700 dark:text-blue-300">X</label>
                        <input type="number" min={-50} max={50} value={selectedOverlay.style.shadow?.offsetX || 0} onChange={e => handleShadowChange(selectedOverlay.id, { ...selectedOverlay.style.shadow, offsetX: Number(e.target.value), color: selectedOverlay.style.shadow?.color || '#000000', blur: selectedOverlay.style.shadow?.blur || 0, offsetY: selectedOverlay.style.shadow?.offsetY || 0 })} className="w-full border rounded px-1 py-0.5 text-xs" placeholder="X" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-0.5 text-blue-700 dark:text-blue-300">Y</label>
                        <input type="number" min={-50} max={50} value={selectedOverlay.style.shadow?.offsetY || 0} onChange={e => handleShadowChange(selectedOverlay.id, { ...selectedOverlay.style.shadow, offsetY: Number(e.target.value), color: selectedOverlay.style.shadow?.color || '#000000', blur: selectedOverlay.style.shadow?.blur || 0, offsetX: selectedOverlay.style.shadow?.offsetX || 0 })} className="w-full border rounded px-1 py-0.5 text-xs" placeholder="Y" />
                      </div>
                    </div>
                    <div className="border-t border-blue-100 dark:border-blue-900 my-0.5" />
                    {/* Rotation */}
                    <div>
                      <label className="block text-xs font-medium mb-0.5 text-blue-700 dark:text-blue-300">Rotation: {selectedOverlay.style.rotation}°</label>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        value={selectedOverlay.style.rotation}
                        onChange={e => handleRotationChange(selectedOverlay.id, Number(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>
                    <div className="w-full flex justify-center mt-1">
                      <Button className="w-full max-w-xs bg-green-600 hover:bg-green-700 text-white text-base font-semibold py-1.5 rounded-xl shadow-lg" onClick={handleDownloadImage}>
                        Download Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner w-8 h-8"></div>
            </div>
          ) : images.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No images yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Upload your first image to get started.
                </p>
                <Button onClick={() => setShowUploader(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </CardContent>
            </Card>
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