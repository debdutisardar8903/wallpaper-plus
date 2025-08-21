import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  // Optional: Custom endpoint for local development
  ...(process.env.AWS_S3_ENDPOINT && {
    endpoint: process.env.AWS_S3_ENDPOINT,
    forcePathStyle: true,
  }),
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

// Supported image formats
const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface PresignedUrlResult {
  success: boolean;
  uploadUrl?: string;
  key?: string;
  publicUrl?: string;
  error?: string;
}

/**
 * Validates file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  return { valid: true };
}

/**
 * Generates a unique file key for S3
 */
export function generateFileKey(fileName: string, userId: string): string {
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  
  return `wallpapers/${userId}/${timestamp}_${uniqueId}.${fileExtension}`;
}

/**
 * Uploads a file directly to S3 (server-side)
 */
export async function uploadToS3(file: File, userId: string): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate unique key
    const key = generateFileKey(file.name, userId);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Generate public URL
    const publicUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

    return {
      success: true,
      url: publicUrl,
      key: key,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Generates a presigned URL for client-side upload
 */
export async function getPresignedUploadUrl(fileName: string, fileType: string, userId: string): Promise<PresignedUrlResult> {
  try {
    // Validate file type
    if (!SUPPORTED_FORMATS.includes(fileType)) {
      return {
        success: false,
        error: `Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`
      };
    }

    // Generate unique key
    const key = generateFileKey(fileName, userId);

    // Create presigned URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Metadata: {
        originalName: fileName,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    // Generate public URL
    const publicUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

    return {
      success: true,
      uploadUrl,
      key,
      publicUrl,
    };
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate upload URL'
    };
  }
}

/**
 * Deletes a file from S3
 */
export async function deleteFromS3(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return { success: true };
  } catch (error) {
    console.error('S3 delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

/**
 * Gets a presigned URL for downloading/viewing a file
 */
export async function getPresignedDownloadUrl(key: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    return { success: true, url };
  } catch (error) {
    console.error('Presigned download URL generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate download URL'
    };
  }
}

/**
 * Gets the public URL for a file (if bucket is public)
 */
export function getPublicUrl(key: string): string {
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
}

/**
 * Extracts file key from S3 URL
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Handle both path-style and virtual-hosted-style URLs
    if (urlObj.hostname.includes(BUCKET_NAME)) {
      return urlObj.pathname.substring(1); // Remove leading slash
    } else {
      // Path-style URL
      const pathParts = urlObj.pathname.split('/');
      if (pathParts[1] === BUCKET_NAME) {
        return pathParts.slice(2).join('/');
      }
    }
    return null;
  } catch {
    return null;
  }
}

const s3Utils = {
  uploadToS3,
  getPresignedUploadUrl,
  deleteFromS3,
  getPresignedDownloadUrl,
  getPublicUrl,
  extractKeyFromUrl,
  validateFile,
  generateFileKey,
};

export default s3Utils;
