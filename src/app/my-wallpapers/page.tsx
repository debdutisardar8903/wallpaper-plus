'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Image from 'next/image';

import { useS3Upload } from '@/hooks/useS3Upload';
import { uploadOperations, objectToArray } from '@/lib/database';

interface UploadedWallpaper {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  tags: string[];
  uploadDate: string;
  views: number;
  downloads: number;
  status: 'pending' | 'approved' | 'rejected';
}

export default function MyWallpapersPage() {
  const { user } = useAuth();
  const { uploadFile, uploading: s3Uploading, progress } = useS3Upload();
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('gallery');
  const [uploadedWallpapers, setUploadedWallpapers] = useState<UploadedWallpaper[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: '',
    tags: '',
    file: null as File | null,
    preview: ''
  });

  const categories = [
    'Animals', 'Anime', 'Cars & Bikes', 'Cartoons', 'Celebs', 'Comics',
    'Food', 'Gaming', 'Movies', 'Music', 'Nature', 'Space', 'Sports',
    'Travels', 'TV Shows', 'HD'
  ];

  // Load user's uploaded wallpapers from database
  useEffect(() => {
    const loadUserWallpapers = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('Loading wallpapers for user:', user.uid);
        
        const uploadsData = await uploadOperations.getUserUploads(user.uid);
        console.log('Raw uploads data:', uploadsData);
        
        const uploadsArray = objectToArray(uploadsData);
        console.log('Processed uploads array:', uploadsArray);
        
        // Convert to UploadedWallpaper format
        const wallpapers: UploadedWallpaper[] = uploadsArray.map((upload: Record<string, unknown>) => ({
          id: (upload.id as string) || Date.now().toString(),
          title: (upload.title as string) || 'Untitled',
          imageUrl: (upload.imageUrl as string) || '',
          category: (upload.category as string) || 'Other',
          tags: Array.isArray(upload.tags) ? upload.tags as string[] : Object.values((upload.tags as Record<number, string>) || {}),
          uploadDate: (upload.uploadDate as string) || new Date().toISOString(),
          views: (upload.views as number) || 0,
          downloads: (upload.downloads as number) || 0,
          status: (upload.status as 'pending' | 'approved' | 'rejected') || 'pending'
        }));
        
        console.log('Final wallpapers:', wallpapers);
        setUploadedWallpapers(wallpapers);
      } catch (error) {
        console.error('Error loading user wallpapers:', error);
        setUploadedWallpapers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserWallpapers();
  }, [user]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadForm(prev => ({
          ...prev,
          file,
          preview: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!uploadForm.file || !uploadForm.title || !uploadForm.category || !user) {
      alert('Please fill all required fields and ensure you are logged in');
      return;
    }

    setIsUploading(true);

    try {
      // Upload to S3
      const uploadResult = await uploadFile(uploadForm.file, user.uid);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload image');
      }

      // Create wallpaper data for database - only essential metadata
      const tagsList = uploadForm.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      const tagsObject = tagsList.length > 0 ? tagsList.reduce((acc, tag, index) => {
        acc[index] = tag;
        return acc;
      }, {} as Record<number, string>) : null; // Use null for empty tags

      const wallpaperData = {
        title: uploadForm.title,
        imageUrl: uploadResult.url!, // S3 Object URL
        s3Key: uploadResult.key!, // S3 storage key for management
        category: uploadForm.category,
        tags: tagsObject, // Optional tags as object or null
        uploadDate: new Date().toISOString(),
        views: 0,
        downloads: 0,
        status: 'pending' as const,
        author: user.displayName || user.email || 'Anonymous',
        authorId: user.uid
      };

      console.log('Wallpaper data to save:', wallpaperData);

      // Save to database
      try {
        console.log('Attempting to save to database...');
        const uploadKey = await uploadOperations.addUserUpload(user.uid, wallpaperData);
        console.log('Database save successful! Upload key:', uploadKey);
      } catch (dbError) {
        console.error('Database save failed, but S3 upload succeeded:', dbError);
        console.error('Error details:', {
          error: dbError,
          userData: wallpaperData,
          userUid: user.uid
        });
        // Continue with UI update even if database save fails
        alert('Image uploaded to S3 successfully, but failed to save to database. Check console for details.');
      }

      const newWallpaper: UploadedWallpaper = {
        id: Date.now().toString(),
        title: uploadForm.title,
        imageUrl: uploadResult.url!,
        category: uploadForm.category,
        tags: uploadForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        uploadDate: new Date().toISOString(),
        views: 0,
        downloads: 0,
        status: 'pending'
      };

      setUploadedWallpapers(prev => [newWallpaper, ...prev]);
      
      // Reset form
      setUploadForm({
        title: '',
        category: '',
        tags: '',
        file: null,
        preview: ''
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setActiveTab('gallery');
      alert('Wallpaper uploaded successfully! It will be reviewed before being published.');
      
      // Reload wallpapers from database
      const uploadsData = await uploadOperations.getUserUploads(user.uid);
      const uploadsArray = objectToArray(uploadsData);
      const wallpapers: UploadedWallpaper[] = uploadsArray.map((upload: Record<string, unknown>) => ({
        id: (upload.id as string) || Date.now().toString(),
        title: (upload.title as string) || 'Untitled',
        imageUrl: (upload.imageUrl as string) || '',
        category: (upload.category as string) || 'Other',
        tags: Array.isArray(upload.tags) ? upload.tags as string[] : Object.values((upload.tags as Record<number, string>) || {}),
        uploadDate: (upload.uploadDate as string) || new Date().toISOString(),
        views: (upload.views as number) || 0,
        downloads: (upload.downloads as number) || 0,
        status: (upload.status as 'pending' | 'approved' | 'rejected') || 'pending'
      }));
      setUploadedWallpapers(wallpapers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      console.error('Upload error:', error);
      alert(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this wallpaper?')) {
      setUploadedWallpapers(prev => prev.filter(w => w.id !== id));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please Login</h1>
          <p className="text-gray-600 dark:text-gray-400">You need to be logged in to upload wallpapers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Wallpapers
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload and manage your wallpaper collection
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Uploaded</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{uploadedWallpapers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {uploadedWallpapers.filter(w => w.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {uploadedWallpapers.filter(w => w.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Views</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {uploadedWallpapers.reduce((sum, w) => sum + w.views, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('gallery')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'gallery'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>My Gallery ({uploadedWallpapers.length})</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'upload'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Upload New</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'upload' && (
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleUpload} className="space-y-6">
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Image *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                      {uploadForm.preview ? (
                        <div className="relative">
                          <Image
                            src={uploadForm.preview}
                            alt="Preview"
                            width={400}
                            height={300}
                            className="mx-auto rounded-lg object-cover max-h-64"
                          />
                          <button
                            type="button"
                            onClick={() => setUploadForm(prev => ({ ...prev, file: null, preview: '' }))}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div>
                          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">Click to upload or drag and drop</p>
                          <p className="text-sm text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {!uploadForm.preview && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Choose File
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter wallpaper title"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags (optional)
                    </label>
                    <input
                      type="text"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter tags separated by commas"
                    />
                    <p className="text-xs text-gray-500 mt-1">Example: nature, mountains, sunset</p>
                  </div>

                  {/* Submit */}
                  <div className="space-y-4">
                    {(isUploading || s3Uploading) && progress && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      disabled={isUploading || s3Uploading || !uploadForm.file}
                      className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition-colors"
                    >
                      {isUploading || s3Uploading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>
                            {s3Uploading ? 'Uploading to S3...' : 'Processing...'}
                          </span>
                        </div>
                      ) : (
                        'Upload Wallpaper'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading your wallpapers...</p>
                  </div>
                ) : uploadedWallpapers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No wallpapers yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Upload your first wallpaper to get started.</p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Upload Wallpaper
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {uploadedWallpapers.map((wallpaper) => (
                      <div key={wallpaper.id} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative aspect-[9/16]">
                          <Image
                            src={wallpaper.imageUrl}
                            alt={wallpaper.title}
                            fill
                            className="object-cover"
                          />
                          {/* Status Badge */}
                          <div className="absolute top-2 left-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              wallpaper.status === 'approved' ? 'bg-green-100 text-green-800' :
                              wallpaper.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {wallpaper.status}
                            </span>
                          </div>
                          {/* Actions */}
                          <div className="absolute top-2 right-2 flex space-x-1">
                            <button
                              onClick={() => handleDelete(wallpaper.id)}
                              className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate">{wallpaper.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{wallpaper.category}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{wallpaper.views} views</span>
                            <span>{wallpaper.downloads} downloads</span>
                          </div>
                          {wallpaper.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {wallpaper.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                              {wallpaper.tags.length > 3 && (
                                <span className="text-xs text-gray-500">+{wallpaper.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
