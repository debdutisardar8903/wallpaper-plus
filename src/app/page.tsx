'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import WallpaperGrid from '@/components/WallpaperGrid';
import CategoryList from '@/components/CategoryList';
import { uploadOperations } from '@/lib/database';

// Interface for wallpaper data from database
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

const mockCategories = [
  {
    id: '1',
    name: 'Nature',
    slug: 'nature',
    description: 'Beautiful landscapes and natural scenery',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    wallpaperCount: 1247,
    color: '#10B981'
  },
  {
    id: '2',
    name: 'Urban',
    slug: 'urban',
    description: 'Modern cityscapes and architecture',
    thumbnailUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
    wallpaperCount: 892,
    color: '#6366F1'
  },
  {
    id: '3',
    name: 'Abstract',
    slug: 'abstract',
    description: 'Creative and artistic designs',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    wallpaperCount: 634,
    color: '#F59E0B'
  },
  {
    id: '4',
    name: 'Space',
    slug: 'space',
    description: 'Cosmic views and celestial beauty',
    thumbnailUrl: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=300&fit=crop',
    wallpaperCount: 421,
    color: '#8B5CF6'
  }
];

interface Wallpaper {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  resolution: string;
  downloads: number;
  tags: string[];
  author: string;
  views: number;
}

export default function Home() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [categories] = useState(mockCategories);
  const [loading, setLoading] = useState(true);

  // Fetch approved wallpapers from all users
  const fetchApprovedWallpapers = async () => {
    try {
      setLoading(true);
      console.log('Fetching approved wallpapers from database...');
      
      // Get all approved wallpapers from database
      const allApprovedWallpapers = await uploadOperations.getAllApprovedWallpapers();
      console.log('Found approved wallpapers:', allApprovedWallpapers.length);
      
      // Transform database format to component format
      const transformedWallpapers = allApprovedWallpapers.map((wallpaper) => transformWallpaper(wallpaper as unknown as DatabaseWallpaper));
      
      setWallpapers(transformedWallpapers);
    } catch (error) {
      console.error('Error fetching approved wallpapers:', error);
      // Fallback to empty array on error
      setWallpapers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedWallpapers();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="mb-16">

          {/* Full Width Hero Image */}
          <div className="relative w-full">
            <div className="relative w-full h-[450px] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 border border-gray-200 dark:border-gray-700">
              {/* Hero Image */}
        <Image
                src="https://wallpaper-plus-storage.s3.ap-south-1.amazonaws.com/wallpapers/kPappVlNMjTVTYkOP58JXGqw71t2/1755725483522_0eb8b705-66e1-43e8-9c12-eae49418d3d9.jpg"
                alt="Beautiful wallpaper showcase"
                fill
                className="object-cover"
          priority
        />
              

              
              {/* Hero Content Overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center text-white max-w-4xl mx-auto px-4">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 drop-shadow-lg">
                    Beautiful Wallpapers
                  </h2>
                  <p className="text-lg md:text-xl lg:text-2xl mb-8 opacity-90 drop-shadow-md max-w-3xl mx-auto">
                    Discover thousands of high-quality wallpapers for your desktop, mobile, and tablet. 
                    All wallpapers are free to download and use.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      href="/search"
                      className="px-8 py-3 md:px-10 md:py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg text-center"
                    >
                      Browse All Wallpapers
                    </Link>
                    <Link 
                      href="/categories"
                      className="px-8 py-3 md:px-10 md:py-4 border border-white/30 text-white hover:bg-white/10 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 backdrop-blur-sm text-center"
                    >
                      View Categories
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating elements for visual interest */}
            <div className="absolute -top-6 right-8 w-12 h-12 bg-purple-500 rounded-full opacity-60 animate-pulse"></div>
            <div className="absolute -bottom-4 left-8 w-8 h-8 bg-pink-500 rounded-full opacity-40 animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 -right-4 w-6 h-6 bg-blue-500 rounded-full opacity-50 animate-pulse delay-500"></div>
          </div>
        </section>

        {/* Popular Categories */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Popular Categories
            </h2>
            <Link 
              href="/categories"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          <CategoryList categories={categories} loading={loading} />
        </section>

        {/* Featured Wallpapers */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Featured Wallpapers
            </h2>
            <Link 
              href="/search"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          
          {!loading && wallpapers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No approved wallpapers yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Be the first to upload and get your wallpaper approved!</p>
        </div>
          ) : (
            <WallpaperGrid wallpapers={wallpapers} loading={loading} />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">W</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Wallpaper Plus
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your destination for high-quality wallpapers. Download beautiful images for your devices completely free.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Categories</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400">Nature</a></li>
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400">Abstract</a></li>
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400">Urban</a></li>
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400">Space</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Support</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400">Help Center</a></li>
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400">Contact Us</a></li>
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2025 Wallpaper Plus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
