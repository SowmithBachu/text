'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { TextOverlay } from '@/types';

interface TextOverlayElementProps {
  overlay: TextOverlay;
  zoom: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextOverlay>) => void;
}

export function TextOverlayElement({
  overlay,
  zoom,
  isSelected,
  onSelect,
  onUpdate,
}: TextOverlayElementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(overlay.text);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const textRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle double click to edit
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(overlay.text);
  }, [overlay.text]);

  // Handle text editing
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditText(e.target.value);
  }, []);

  // Handle text save
  const handleTextSave = useCallback(() => {
    if (editText !== overlay.text) {
      onUpdate({ text: editText });
    }
    setIsEditing(false);
  }, [editText, overlay.text, onUpdate]);

  // Handle text cancel
  const handleTextCancel = useCallback(() => {
    setEditText(overlay.text);
    setIsEditing(false);
  }, [overlay.text]);

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTextSave();
    } else if (e.key === 'Escape') {
      handleTextCancel();
    }
  }, [handleTextSave, handleTextCancel]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !isEditing) { // Left click and not editing
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({ x: e.clientX - overlay.position.x, y: e.clientY - overlay.position.y });
      onSelect();
    }
  }, [isEditing, overlay.position, onSelect]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      e.stopPropagation();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      onUpdate({ position: { x: newX, y: newY } });
    }
  }, [isDragging, dragStart, onUpdate]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Add global mouse up listener
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  // Calculate scaled position and size
  const scaledX = overlay.position.x * zoom;
  const scaledY = overlay.position.y * zoom;
  const scaledFontSize = overlay.style.fontSize * zoom;

  return (
    <div
      ref={textRef}
      className={`
        absolute text-overlay select-none
        ${isSelected ? 'text-overlay-selected' : ''}
        ${isDragging ? 'cursor-grabbing' : 'cursor-move'}
      `}
      style={{
        left: scaledX,
        top: scaledY,
        fontSize: scaledFontSize,
        fontFamily: overlay.style.fontFamily,
        fontWeight: overlay.style.fontWeight,
        color: overlay.style.color,
        opacity: overlay.style.opacity,
        textAlign: overlay.style.textAlign as any,
        transform: `rotate(${overlay.style.rotation}deg)`,
        zIndex: overlay.zIndex,
        cursor: isEditing ? 'text' : 'move',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onBlur={handleTextSave}
          className="text-editor-input bg-transparent outline-none"
          style={{
            fontSize: scaledFontSize,
            fontFamily: overlay.style.fontFamily,
            fontWeight: overlay.style.fontWeight,
            color: overlay.style.color,
            textAlign: overlay.style.textAlign as any,
            minWidth: '50px',
          }}
        />
      ) : (
        <div
          style={{
            textShadow: overlay.style.shadow 
              ? `${overlay.style.shadow.offsetX}px ${overlay.style.shadow.offsetY}px ${overlay.style.shadow.blur}px ${overlay.style.shadow.color}`
              : undefined,
            WebkitTextStroke: overlay.style.stroke
              ? `${overlay.style.stroke.width}px ${overlay.style.stroke.color}`
              : undefined,
          }}
        >
          {overlay.text}
        </div>
      )}

      {/* Selection handles */}
      {isSelected && !isEditing && (
        <div className="absolute inset-0 border-2 border-blue-500 border-dashed pointer-events-none" />
      )}
    </div>
  );
} 