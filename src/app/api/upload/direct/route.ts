import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/aws-s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    // Validate required fields
    if (!file || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, userId' },
        { status: 400 }
      );
    }

    // Upload to S3
    const result = await uploadToS3(file, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      url: result.url,
      key: result.key,
    });
  } catch (error) {
    console.error('Direct upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
