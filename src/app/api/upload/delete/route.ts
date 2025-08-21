import { NextRequest, NextResponse } from 'next/server';
import { deleteFromS3, extractKeyFromUrl } from '@/lib/aws-s3';

export async function DELETE(request: NextRequest) {
  try {
    const { url, key } = await request.json();

    // Validate that either URL or key is provided
    if (!url && !key) {
      return NextResponse.json(
        { error: 'Either url or key must be provided' },
        { status: 400 }
      );
    }

    // Extract key from URL if only URL is provided
    let fileKey = key;
    if (!fileKey && url) {
      fileKey = extractKeyFromUrl(url);
      if (!fileKey) {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    // Delete from S3
    const result = await deleteFromS3(fileKey);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
