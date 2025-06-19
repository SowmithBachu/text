import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

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