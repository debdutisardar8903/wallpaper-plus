'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import WallpaperGrid from '@/components/WallpaperGrid';
import { uploadOperations } from '@/lib/database';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';

// Interface for database wallpaper
interface DatabaseWallpaper {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  tags: Record<number, string> | null;
  status: string;
  uploadDate: string;
  views: number;
  downloads: number;
  author: string;
  authorId: string;
  userId: string;
  s3Key: string;
}

// Transform database wallpaper to component format
const transformWallpaper = (dbWallpaper: DatabaseWallpaper) => ({
  id: dbWallpaper.id,
  title: dbWallpaper.title,
  imageUrl: dbWallpaper.imageUrl,
  category: dbWallpaper.category,
  resolution: 'HD', // Default resolution since it's not stored in current structure
  downloads: dbWallpaper.downloads || 0,
  tags: dbWallpaper.tags ? Object.values(dbWallpaper.tags) : [],
  author: dbWallpaper.author,
  views: dbWallpaper.views || 0
});

export default function WallpaperDetailPage() {
  const params = useParams();

  const wallpaperId = params.id as string;
  
  const { user } = useAuth();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  
  const [wallpaper, setWallpaper] = useState<ReturnType<typeof transformWallpaper> | null>(null);
  const [relatedWallpapers, setRelatedWallpapers] = useState<ReturnType<typeof transformWallpaper>[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Fetch wallpaper details and set up real-time listening
  useEffect(() => {
    const fetchWallpaper = async () => {
      if (!wallpaperId) return;
      
      try {
        setLoading(true);
        console.log(`Fetching wallpaper: ${wallpaperId}`);
        
        const wallpaperData = await uploadOperations.getWallpaperById(wallpaperId);
        
        if (!wallpaperData) {
          console.log('Wallpaper not found');
          return;
        }
        
        const transformedWallpaper = transformWallpaper(wallpaperData as unknown as DatabaseWallpaper);
        setWallpaper(transformedWallpaper);
        
        // Track view when wallpaper is viewed
        try {
          await uploadOperations.trackView(wallpaperId, user?.uid);
          console.log('View tracked successfully for:', transformedWallpaper.title);
        } catch (viewError) {
          console.error('Failed to track view:', viewError);
          // Don't block the UI if view tracking fails
        }
        
        // Fetch related wallpapers
        setRelatedLoading(true);
        const related = await uploadOperations.getRelatedWallpapers(
          wallpaperId, 
          wallpaperData.category, 
          8
        );
        const transformedRelated = related.map((wallpaper) => transformWallpaper(wallpaper as unknown as DatabaseWallpaper));
        setRelatedWallpapers(transformedRelated);
        setRelatedLoading(false);
        
      } catch (error) {
        console.error('Error fetching wallpaper:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWallpaper();
  }, [wallpaperId, user?.uid]);

  // Set up real-time listener for download count updates
  useEffect(() => {
    if (!wallpaperId) return;

    const setupRealtimeListener = async () => {
      try {
        // Import Firebase realtime database functions
        const { ref, onValue } = await import('firebase/database');
        const { realtimeDb } = await import('../../../lib/firebase');
        
        // Listen for changes in main wallpapers collection
        const wallpaperRef = ref(realtimeDb, `wallpapers/${wallpaperId}`);
        const wallpaperListener = onValue(wallpaperRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            console.log(`Real-time update: wallpaper downloads now ${data.downloads || 0}, views now ${data.views || 0}`);
            setWallpaper((prev) => prev ? { 
              ...prev, 
              downloads: data.downloads || 0,
              views: data.views || 0
            } : prev);
          }
        });

        // Also listen for changes in userUploads (fallback)
        const uploadsRef = ref(realtimeDb, 'userUploads');
        const uploadsListener = onValue(uploadsRef, (snapshot) => {
          if (snapshot.exists()) {
            const allUploads = snapshot.val();
            
            // Find the wallpaper in userUploads
            for (const userId of Object.keys(allUploads)) {
              const userUploads = allUploads[userId];
              if (userUploads[wallpaperId]) {
                const downloads = userUploads[wallpaperId].downloads || 0;
                const views = userUploads[wallpaperId].views || 0;
                console.log(`Real-time update: userUploads downloads now ${downloads}, views now ${views}`);
                setWallpaper((prev) => prev ? { ...prev, downloads, views } : prev);
                break;
              }
            }
          }
        });

        // Cleanup listeners on unmount
        return () => {
          wallpaperListener();
          uploadsListener();
        };
      } catch (error) {
        console.error('Error setting up real-time listeners:', error);
      }
    };

    const cleanup = setupRealtimeListener();
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [wallpaperId]);

  const handleFavoriteClick = async () => {
    if (!user) {
      alert('Please sign in to add favorites');
      return;
    }

    if (!wallpaper) return;

    try {
      if (isFavorite(wallpaper.id)) {
        await removeFromFavorites(wallpaper.id);
      } else {
        await addToFavorites(wallpaper);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDownload = async () => {
    if (!wallpaper) return;
    
    try {
      setDownloading(true);
      
      const filename = `${wallpaper.title.replace(/[^a-zA-Z0-9\s]/g, '_')}.jpg`;
      
      // First try using our server-side download API (best for CORS issues)
      try {
        const downloadUrl = `/api/download?url=${encodeURIComponent(wallpaper.imageUrl)}&filename=${encodeURIComponent(filename)}`;
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Download completed using API route for:', wallpaper.title);
        
      } catch (apiError) {
        console.log('API download failed, trying direct fetch:', apiError);
        
        // Fallback 1: Direct fetch (for same-origin or properly configured CORS)
        try {
          const response = await fetch(wallpaper.imageUrl, {
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('Download completed using direct fetch for:', wallpaper.title);
          } else {
            throw new Error('Direct fetch failed');
          }
        } catch (fetchError) {
          console.log('Direct fetch failed, using fallback link method:', fetchError);
          
          // Fallback 2: Direct link with download attribute
          const link = document.createElement('a');
          link.href = wallpaper.imageUrl;
          link.download = filename;
          link.setAttribute('crossorigin', 'anonymous');
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('Download initiated using direct link method for:', wallpaper.title);
        }
      }
      
      // Track download in database (regardless of method used)
      try {
        await uploadOperations.trackDownload(wallpaper.id, user?.uid);
        console.log('Download tracked successfully for:', wallpaper.title);
        
        // Update local state to reflect new download count
        setWallpaper((prev) => prev ? ({
          ...prev,
          downloads: (prev.downloads || 0) + 1
        }) : prev);
      } catch (dbError) {
        console.error('Failed to track download in database:', dbError);
        // Don't block the download if tracking fails
      }
      
    } catch (error) {
      console.error('Error downloading wallpaper:', error);
      
      // Last resort: Open image in new tab with instructions
      try {
        window.open(wallpaper.imageUrl, '_blank');
        console.log('Opened image in new tab as last resort for:', wallpaper.title);
        
        // Show user instructions
        setTimeout(() => {
          alert('Image opened in new tab. Right-click on the image and select "Save image as..." to download.');
        }, 500);
        
        // Still track the download attempt
        try {
          await uploadOperations.trackDownload(wallpaper.id, user?.uid);
          setWallpaper((prev) => prev ? ({
            ...prev,
            downloads: (prev.downloads || 0) + 1
          }) : prev);
        } catch (dbError) {
          console.error('Failed to track download in database:', dbError);
        }
      } catch (openError) {
        console.error('All download methods failed:', openError);
        alert('Unable to download wallpaper automatically. Please right-click on the image and select "Save image as..."');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!wallpaper) return;
    
    const shareData = {
      title: wallpaper.title,
      text: `I just found this stunning wallpaper on Wallpaper Plus! Have a look: ${wallpaper.title}`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="w-full max-w-4xl mx-auto mb-8">
              <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700 rounded-xl mb-6"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!wallpaper) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Wallpaper Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The wallpaper you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
          <Link href="/" className="hover:text-purple-600 dark:hover:text-purple-400">
            Home
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link 
            href={`/category/${wallpaper.category.toLowerCase()}`}
            className="hover:text-purple-600 dark:hover:text-purple-400"
          >
            {wallpaper.category}
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 dark:text-white font-medium">
            {wallpaper.title}
          </span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Image */}
          <div className="lg:col-span-2">
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-6">
              <Image
                src={wallpaper.imageUrl}
                alt={wallpaper.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 60vw"
              />
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="space-y-6">
            {/* Title and Basic Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {wallpaper.title}
              </h1>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {wallpaper.views.toLocaleString()} views
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {wallpaper.downloads.toLocaleString()} downloads
                </div>
              </div>

              {/* Category and Author */}
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Category:</span>
                  <Link 
                    href={`/category/${wallpaper.category.toLowerCase()}`}
                    className="ml-2 inline-block bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                  >
                    {wallpaper.category}
                  </Link>
                </div>
                
                {wallpaper.author && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Author:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{wallpaper.author}</span>
                  </div>
                )}
                
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolution:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{wallpaper.resolution}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {wallpaper.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {wallpaper.tags.map((tag: string) => (
                    <Link
                      key={tag}
                      href={`/search?q=${encodeURIComponent(tag)}`}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {downloading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download Wallpaper</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleFavoriteClick}
                  className={`py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                    user && isFavorite(wallpaper.id)
                      ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg 
                    className="w-4 h-4" 
                    fill={user && isFavorite(wallpaper.id) ? 'currentColor' : 'none'} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="hidden sm:inline">
                    {user && isFavorite(wallpaper.id) ? 'Favorited' : 'Favorite'}
                  </span>
                </button>

                <button
                  onClick={handleShare}
                  className="py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Wallpapers */}
        {relatedWallpapers.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                More from {wallpaper.category}
              </h2>
              <Link 
                href={`/category/${wallpaper.category.toLowerCase()}`}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors"
              >
                View all →
              </Link>
            </div>
            <WallpaperGrid wallpapers={relatedWallpapers} loading={relatedLoading} />
          </section>
        )}
      </main>
    </div>
  );
}
