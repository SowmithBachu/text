import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { validateImageFile } from '@/lib/utils';

// Mock data - in production, this would come from a database
const mockImages = [
  {
    id: 'img_1',
    userId: 'user_1',
    name: 'Sample Image 1',
    originalUrl: '/api/images/img_1/original',
    thumbnailUrl: '/api/images/img_1/thumbnail',
    fileSize: 1024000,
    width: 1920,
    height: 1080,
    format: 'jpeg',
    textOverlays: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'img_2',
    userId: 'user_1',
    name: 'Sample Image 2',
    originalUrl: '/api/images/img_2/original',
    thumbnailUrl: '/api/images/img_2/thumbnail',
    fileSize: 2048000,
    width: 2560,
    height: 1440,
    format: 'png',
    textOverlays: [],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Filter images by user and search term
    let filteredImages = mockImages.filter(img => 
      img.userId === userId && 
      img.name.toLowerCase().includes(search.toLowerCase())
    );

    // Calculate pagination
    const total = filteredImages.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedImages = filteredImages.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedImages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });

  } catch (error) {
    console.error('Fetch images error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // For now, we'll simulate file upload
    // In production, you'd upload to S3 or similar
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const imageData = {
      id: imageId,
      userId,
      name: file.name,
      originalUrl: `/api/images/${imageId}/original`,
      thumbnailUrl: `/api/images/${imageId}/thumbnail`,
      fileSize: file.size,
      width: 1920, // Mock dimensions
      height: 1080,
      format: file.type.split('/')[1],
      textOverlays: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: imageData,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 