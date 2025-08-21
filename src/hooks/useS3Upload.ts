import { useState } from 'react';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface UseS3UploadReturn {
  uploading: boolean;
  progress: UploadProgress | null;
  uploadFile: (file: File, userId: string, method?: 'presigned' | 'direct') => Promise<UploadResult>;
  deleteFile: (urlOrKey: string) => Promise<{ success: boolean; error?: string }>;
}

export function useS3Upload(): UseS3UploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const uploadFile = async (
    file: File, 
    userId: string, 
    method: 'presigned' | 'direct' = 'presigned'
  ): Promise<UploadResult> => {
    setUploading(true);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      if (method === 'presigned') {
        return await uploadWithPresignedUrl(file, userId);
      } else {
        return await uploadDirect(file, userId);
      }
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const uploadWithPresignedUrl = async (file: File, userId: string): Promise<UploadResult> => {
    try {
      // Step 1: Get presigned URL
      const presignedResponse = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          userId,
        }),
      });

      if (!presignedResponse.ok) {
        const error = await presignedResponse.json();
        return { success: false, error: error.error || 'Failed to get upload URL' };
      }

      const { uploadUrl, key, publicUrl } = await presignedResponse.json();

      // Step 2: Upload to S3 using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        return { success: false, error: 'Failed to upload file to S3' };
      }

      return {
        success: true,
        url: publicUrl,
        key,
      };
    } catch (error) {
      console.error('Presigned upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  };

  const uploadDirect = async (file: File, userId: string): Promise<UploadResult> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('/api/upload/direct', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Upload failed' };
      }

      const result = await response.json();
      return {
        success: true,
        url: result.url,
        key: result.key,
      };
    } catch (error) {
      console.error('Direct upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  };

  const deleteFile = async (urlOrKey: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const isUrl = urlOrKey.startsWith('http');
      const body = isUrl ? { url: urlOrKey } : { key: urlOrKey };

      const response = await fetch('/api/upload/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Delete failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  };

  return {
    uploading,
    progress,
    uploadFile,
    deleteFile,
  };
}

export default useS3Upload;
