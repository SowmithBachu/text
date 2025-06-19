export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  subscription?: Subscription;
  usage: UsageStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  plan: 'free' | 'pro' | 'premium';
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageStats {
  imagesUploaded: number;
  imagesExported: number;
  storageUsed: number; // in bytes
  lastResetDate: Date;
}

export interface Image {
  id: string;
  userId: string;
  name: string;
  originalUrl: string;
  thumbnailUrl: string;
  fileSize: number;
  width: number;
  height: number;
  format: string;
  textOverlays: TextOverlay[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TextOverlay {
  id: string;
  imageId: string;
  text: string;
  position: {
    x: number;
    y: number;
  };
  style: TextStyle;
  zIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TextStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | 'light' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  color: string;
  backgroundColor?: string;
  opacity: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  rotation: number;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  stroke?: {
    color: string;
    width: number;
  };
  gradient?: {
    colors: string[];
    direction: 'horizontal' | 'vertical' | 'diagonal';
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    imagesPerMonth: number;
    maxFileSize: number; // in bytes
    maxResolution: string;
    customFonts: boolean;
    watermark: boolean;
    prioritySupport: boolean;
  };
  stripePriceId: string;
}

export interface EditorState {
  selectedImage: Image | null;
  selectedTextOverlay: TextOverlay | null;
  zoom: number;
  pan: { x: number; y: number };
  history: EditorAction[];
  historyIndex: number;
  isDirty: boolean;
}

export interface EditorAction {
  id: string;
  type: 'add_text' | 'edit_text' | 'delete_text' | 'move_text' | 'style_text';
  data: any;
  timestamp: Date;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'pdf';
  quality: number;
  resolution: string;
  includeWatermark: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} 