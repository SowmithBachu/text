'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  X, 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Palette,
  Type,
  RotateCw
} from 'lucide-react';
import { TextOverlay, TextStyle } from '@/types';

interface TextStylePanelProps {
  textOverlay: TextOverlay;
  onUpdate: (updates: Partial<TextOverlay>) => void;
  onClose: () => void;
}

const fontFamilies = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Impact',
  'Comic Sans MS',
];

const fontWeights = [
  { value: 'normal', label: 'Normal' },
  { value: 'bold', label: 'Bold' },
  { value: '100', label: 'Thin' },
  { value: '200', label: 'Extra Light' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' },
];

const textAlignments = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight },
];

export function TextStylePanel({ textOverlay, onUpdate, onClose }: TextStylePanelProps) {
  const [style, setStyle] = useState<TextStyle>(textOverlay.style);

  const updateStyle = (updates: Partial<TextStyle>) => {
    const newStyle = { ...style, ...updates };
    setStyle(newStyle);
    onUpdate({ style: newStyle });
  };

  return (
    <Card className="text-style-panel">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-sm">Text Style</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Font Family */}
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Font Family
          </label>
          <select
            value={style.fontFamily}
            onChange={(e) => updateStyle({ fontFamily: e.target.value })}
            className="font-selector w-full"
          >
            {fontFamilies.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Font Size: {style.fontSize}px
          </label>
          <input
            type="range"
            min="8"
            max="200"
            value={style.fontSize}
            onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
        </div>

        {/* Font Weight */}
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Font Weight
          </label>
          <select
            value={style.fontWeight}
            onChange={(e) => updateStyle({ fontWeight: e.target.value as any })}
            className="font-selector w-full"
          >
            {fontWeights.map((weight) => (
              <option key={weight.value} value={weight.value}>
                {weight.label}
              </option>
            ))}
          </select>
        </div>

        {/* Text Color */}
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Text Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={style.color}
              onChange={(e) => updateStyle({ color: e.target.value })}
              className="color-picker"
            />
            <Input
              value={style.color}
              onChange={(e) => updateStyle({ color: e.target.value })}
              className="flex-1"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Text Alignment */}
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Text Alignment
          </label>
          <div className="flex space-x-1">
            {textAlignments.map((alignment) => {
              const Icon = alignment.icon;
              return (
                <Button
                  key={alignment.value}
                  variant={style.textAlign === alignment.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateStyle({ textAlign: alignment.value as any })}
                  className="flex-1"
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Opacity: {Math.round(style.opacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={style.opacity}
            onChange={(e) => updateStyle({ opacity: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
        </div>

        {/* Rotation */}
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Rotation: {style.rotation}°
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="-180"
              max="180"
              value={style.rotation}
              onChange={(e) => updateStyle({ rotation: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStyle({ rotation: 0 })}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Background Color (optional) */}
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Background Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={style.backgroundColor || '#ffffff'}
              onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
              className="color-picker"
            />
            <Input
              value={style.backgroundColor || ''}
              onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
              className="flex-1"
              placeholder="Transparent"
            />
            {style.backgroundColor && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStyle({ backgroundColor: undefined })}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 