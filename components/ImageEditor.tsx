'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Image, TextOverlay } from '@/types';
import { TextOverlayElement } from './TextOverlayElement';

interface ImageEditorProps {
  image: Image;
  zoom: number;
  pan: { x: number; y: number };
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  onTextSelect: (textId: string | null) => void;
  selectedTextId: string | null;
  onTextUpdate: (textId: string, updates: Partial<TextOverlay>) => void;
}

export function ImageEditor({
  image,
  zoom,
  pan,
  onZoomChange,
  onPanChange,
  onTextSelect,
  selectedTextId,
  onTextUpdate,
}: ImageEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  // Handle mouse down for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  // Handle mouse move for panning
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      onPanChange({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart, onPanChange]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle double click to add text
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Create new text overlay
    const newTextOverlay: TextOverlay = {
      id: `text_${Date.now()}`,
      imageId: image.id,
      text: 'Double-click to edit',
      position: { x, y },
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

    // Add to image (this would be handled by the parent component)
    console.log('New text overlay at:', { x, y });
  }, [image, zoom, pan]);

  // Add event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleMouseUp]);

  // Calculate canvas dimensions
  const canvasWidth = image.width * zoom;
  const canvasHeight = image.height * zoom;

  return (
    <div className="canvas-container">
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Canvas */}
        <div
          className="absolute bg-white dark:bg-gray-800 shadow-lg"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            left: '50%',
            top: '50%',
            marginLeft: -canvasWidth / 2,
            marginTop: -canvasHeight / 2,
          }}
        >
          {/* Background Image */}
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${image.originalUrl})`,
            }}
          />

          {/* Text Overlays */}
          {image.textOverlays.map((overlay) => (
            <TextOverlayElement
              key={overlay.id}
              overlay={overlay}
              zoom={zoom}
              isSelected={selectedTextId === overlay.id}
              onSelect={() => onTextSelect(overlay.id)}
              onUpdate={(updates) => onTextUpdate(overlay.id, updates)}
            />
          ))}
        </div>

        {/* Grid Overlay (optional) */}
        {zoom > 1 && (
          <div
            className="absolute pointer-events-none"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              left: '50%',
              top: '50%',
              marginLeft: -canvasWidth / 2,
              marginTop: -canvasHeight / 2,
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            }}
          />
        )}

        {/* Zoom Info */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {Math.round(zoom * 100)}%
        </div>

        {/* Instructions */}
        {image.textOverlays.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-center">
              <p className="text-sm">Double-click to add text</p>
              <p className="text-xs opacity-75">Scroll to zoom, drag to pan</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 