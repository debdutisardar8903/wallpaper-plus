import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '@/lib/aws-s3';

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, userId } = await request.json();

    // Validate required fields
    if (!fileName || !fileType || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, fileType, userId' },
        { status: 400 }
      );
    }

    // Get presigned URL
    const result = await getPresignedUploadUrl(fileName, fileType, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      uploadUrl: result.uploadUrl,
      key: result.key,
      publicUrl: result.publicUrl,
    });
  } catch (error) {
    console.error('Presigned URL API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
