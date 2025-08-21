'use client';

import { useState } from 'react';
import { useS3Upload } from '@/hooks/useS3Upload';
import { useAuth } from '@/contexts/AuthContext';

export default function S3TestUpload() {
  const { user } = useAuth();
  const { uploadFile, uploading, progress } = useS3Upload();
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleTestUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      setError('Please select a file and ensure you are logged in');
      return;
    }

    setError('');
    setResult('');

    try {
      const uploadResult = await uploadFile(file, user.uid);
      
      if (uploadResult.success) {
        setResult(`✅ Upload successful!\nURL: ${uploadResult.url}\nKey: ${uploadResult.key}`);
      } else {
        setError(`❌ Upload failed: ${uploadResult.error}`);
      }
    } catch (err) {
      setError(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
        <p className="text-yellow-800">Please login to test S3 upload</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">S3 Upload Test</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select image to test upload:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleTestUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
            </div>
            
            {progress && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-100 border border-green-400 rounded-lg">
            <pre className="text-sm text-green-800 whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
        <p><strong>Note:</strong> This is a test component to verify S3 upload functionality.</p>
        <p>Remove this component once you&apos;ve verified the setup works correctly.</p>
      </div>
    </div>
  );
}
