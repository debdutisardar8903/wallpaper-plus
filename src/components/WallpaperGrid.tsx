import Image from 'next/image';
import Link from 'next/link';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { uploadOperations } from '@/lib/database';

interface Wallpaper {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  resolution: string;
  downloads: number;
  tags: string[];
  author?: string;
}

interface WallpaperGridProps {
  wallpapers: Wallpaper[];
  loading?: boolean;
}

export default function WallpaperGrid({ wallpapers, loading = false }: WallpaperGridProps) {
  const { user } = useAuth();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  const handleFavoriteClick = async (e: React.MouseEvent, wallpaper: Wallpaper) => {
    e.stopPropagation();
    
    if (!user) {
      // You could show a login modal here or redirect to login
      alert('Please sign in to add favorites');
      return;
    }

    try {
      if (isFavorite(wallpaper.id)) {
        await removeFromFavorites(wallpaper.id);
      } else {
        await addToFavorites({
          id: wallpaper.id,
          title: wallpaper.title,
          imageUrl: wallpaper.imageUrl,
          category: wallpaper.category,
          resolution: wallpaper.resolution,
          downloads: wallpaper.downloads,
          tags: wallpaper.tags,
          author: wallpaper.author || 'Unknown'
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDownloadClick = async (e: React.MouseEvent, wallpaper: Wallpaper) => {
    e.stopPropagation();
    
    try {
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
        
        // Show user instructions after a short delay
        setTimeout(() => {
          alert('Image opened in new tab. Right-click on the image and select "Save image as..." to download.');
        }, 500);
        
        // Still track the download attempt
        try {
          await uploadOperations.trackDownload(wallpaper.id, user?.uid);
        } catch (dbError) {
          console.error('Failed to track download in database:', dbError);
        }
      } catch (openError) {
        console.error('All download methods failed:', openError);
        alert('Unable to download wallpaper automatically. Please right-click on the image and select "Save image as..."');
      }
    }
  };

  const handleWallpaperClick = async (wallpaper: Wallpaper) => {
    try {
      // Track view when wallpaper is clicked from grid
      await uploadOperations.trackView(wallpaper.id, user?.uid);
      console.log('View tracked from grid click for:', wallpaper.title);
    } catch (error) {
      console.error('Failed to track view from grid:', error);
      // Don't block navigation if view tracking fails
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 20 }).map((_, index) => (
          <div key={index} className="group">
            <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-300 dark:from-gray-600 to-transparent"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!wallpapers.length) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No wallpapers found</h3>
        <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or browse different categories.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {wallpapers.map((wallpaper) => (
        <div key={wallpaper.id} className="group">
          <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 hover:scale-105 transition-transform duration-200 cursor-pointer">
            <Link 
              href={`/wallpaper/${wallpaper.id}`} 
              className="absolute inset-0 z-10"
              onClick={() => handleWallpaperClick(wallpaper)}
            >
              <span className="sr-only">View {wallpaper.title}</span>
            </Link>
            
            <Image
              src={wallpaper.imageUrl}
              alt={wallpaper.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            
            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
              <h3 className="font-medium text-sm mb-1 truncate">{wallpaper.title}</h3>
              <div className="flex items-center justify-between text-xs">
                <span className="bg-white/20 rounded-full px-2 py-1">
                  {wallpaper.resolution || 'HD'}
                </span>
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  <span>{(wallpaper.downloads || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Category Badge */}
            <div className="absolute top-2 left-2 z-30">
              <Link 
                href={`/category/${wallpaper.category.toLowerCase()}`}
                className="bg-purple-500/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm hover:bg-purple-600/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {wallpaper.category}
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex flex-col space-y-2 z-30">
              {/* Favorite Button */}
              <button 
                className={`p-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                  isFavorite(wallpaper.id) 
                    ? 'bg-red-500/80 hover:bg-red-600/80' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
                onClick={(e) => handleFavoriteClick(e, wallpaper)}
                title={isFavorite(wallpaper.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg 
                  className={`w-4 h-4 transition-colors ${
                    isFavorite(wallpaper.id) ? 'text-white fill-current' : 'text-white'
                  }`} 
                  fill={isFavorite(wallpaper.id) ? 'currentColor' : 'none'} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                  />
                </svg>
              </button>

              {/* Download Button */}
              <button 
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={(e) => handleDownloadClick(e, wallpaper)}
                title="Download wallpaper"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
