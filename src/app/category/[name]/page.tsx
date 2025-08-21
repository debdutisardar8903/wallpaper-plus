'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import WallpaperGrid from '@/components/WallpaperGrid';
import Link from 'next/link';
import { uploadOperations } from '@/lib/database';

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

// Predefined category information
interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

const categoryInfo: Record<string, CategoryInfo> = {
  animals: {
    id: '1',
    name: 'Animals',
    slug: 'animals',
    description: 'Beautiful wildlife, pets, and animal photography wallpapers',
    color: '#059669'
  },
  anime: {
    id: '2',
    name: 'Anime',
    slug: 'anime',
    description: 'Stunning anime characters, scenes, and artwork wallpapers',
    color: '#DC2626'
  },
  'cars-bikes': {
    id: '3',
    name: 'Cars & Bikes',
    slug: 'cars-bikes',
    description: 'Luxury cars, motorcycles, and automotive wallpapers',
    color: '#7C2D12'
  },
  cartoons: {
    id: '4',
    name: 'Cartoons',
    slug: 'cartoons',
    description: 'Fun cartoon characters and animated artwork wallpapers',
    color: '#EA580C'
  },
  celebs: {
    id: '5',
    name: 'Celebs',
    slug: 'celebs',
    description: 'Celebrity photos and portrait wallpapers',
    color: '#BE185D'
  },
  comics: {
    id: '6',
    name: 'Comics',
    slug: 'comics',
    description: 'Superhero comics, manga, and graphic novel wallpapers',
    color: '#7C3AED'
  },
  food: {
    id: '7',
    name: 'Food',
    slug: 'food',
    description: 'Delicious food photography and culinary wallpapers',
    color: '#DC2626'
  },
  gaming: {
    id: '8',
    name: 'Gaming',
    slug: 'gaming',
    description: 'Video game screenshots, artwork, and gaming wallpapers',
    color: '#059669'
  },
  movies: {
    id: '9',
    name: 'Movies',
    slug: 'movies',
    description: 'Movie posters, scenes, and cinematic wallpapers',
    color: '#7C2D12'
  },
  music: {
    id: '10',
    name: 'Music',
    slug: 'music',
    description: 'Musical instruments, artists, and music-themed wallpapers',
    color: '#7C3AED'
  },
  nature: {
    id: '11',
    name: 'Nature',
    slug: 'nature',
    description: 'Beautiful landscapes, mountains, forests, and natural scenery wallpapers',
    color: '#10B981'
  },
  space: {
    id: '12',
    name: 'Space',
    slug: 'space',
    description: 'Cosmic views, galaxies, planets, and celestial beauty wallpapers',
    color: '#8B5CF6'
  },
  sports: {
    id: '13',
    name: 'Sports',
    slug: 'sports',
    description: 'Sports action, athletes, and sporting event wallpapers',
    color: '#059669'
  },
  travels: {
    id: '14',
    name: 'Travels',
    slug: 'travels',
    description: 'Travel destinations, landmarks, and world photography wallpapers',
    color: '#0891B2'
  },
  'tv-shows': {
    id: '15',
    name: 'TV Shows',
    slug: 'tv-shows',
    description: 'Television series, characters, and show artwork wallpapers',
    color: '#EA580C'
  },
  hd: {
    id: '16',
    name: 'HD',
    slug: 'hd',
    description: 'High-definition wallpapers in various categories',
    color: '#6366F1'
  }
};

const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'title', label: 'Alphabetical' }
];

const resolutionFilters = [
  { value: 'all', label: 'All Resolutions' },
  { value: '4k', label: '4K (3840x2160)' },
  { value: '1080p', label: 'Full HD (1920x1080)' },
  { value: '1440p', label: 'QHD (2560x1440)' },
  { value: 'ultrawide', label: 'Ultrawide' }
];

export default function CategoryPage() {
  const params = useParams();
  const categoryName = params.name as string;
  
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popular');
  const [resolution, setResolution] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [wallpapers, setWallpapers] = useState<ReturnType<typeof transformWallpaper>[]>([]);

  // Get category info
  const categoryData = categoryInfo[categoryName];

  // Fetch wallpapers for this category
  useEffect(() => {
    const fetchCategoryWallpapers = async () => {
      if (!categoryData) return;
      
      try {
        setLoading(true);
        console.log(`Fetching wallpapers for category: ${categoryData.name}`);
        
        const categoryWallpapers = await uploadOperations.getApprovedWallpapersByCategory(categoryData.name);
        const transformedWallpapers = categoryWallpapers.map((wallpaper) => transformWallpaper(wallpaper as unknown as DatabaseWallpaper));
        
        // Apply sorting
        const sortedWallpapers = sortWallpapers(transformedWallpapers, sortBy);
        
        setWallpapers(sortedWallpapers);
        console.log(`Loaded ${sortedWallpapers.length} wallpapers for ${categoryData.name}`);
      } catch (error) {
        console.error('Error fetching category wallpapers:', error);
        setWallpapers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryWallpapers();
  }, [categoryData, sortBy]);

  // Sort wallpapers based on selected option
  const sortWallpapers = (wallpapers: ReturnType<typeof transformWallpaper>[], sortOption: string) => {
    const sorted = [...wallpapers];
    
    switch (sortOption) {
      case 'recent':
        // Since transformed wallpapers don't have uploadDate, sort by views as fallback
        return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'downloads':
        return sorted.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'popular':
      default:
        return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
    }
  };

  if (!categoryData) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Category Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The category &quot;{categoryName}&quot; doesn&apos;t exist or has been moved.
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
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-purple-600 dark:hover:text-purple-400">
            Home
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 dark:text-white font-medium">
            {categoryData.name}
          </span>
        </nav>

        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: categoryData.color }}
            >
              {categoryData.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {categoryData.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {categoryData.description}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {wallpapers.length.toLocaleString()} wallpapers
            </span>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              <span>Filters</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolution
                </label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {resolutionFilters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orientation
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option>All Orientations</option>
                  <option>Landscape</option>
                  <option>Portrait</option>
                  <option>Square</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option>All Colors</option>
                  <option>Red</option>
                  <option>Blue</option>
                  <option>Green</option>
                  <option>Yellow</option>
                  <option>Black & White</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Wallpapers Grid */}
        {!loading && wallpapers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No wallpapers found in {categoryData.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Be the first to upload wallpapers in this category!
            </p>
            <Link 
              href="/my-wallpapers"
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Upload Wallpaper
            </Link>
          </div>
        ) : (
          <>
            <WallpaperGrid wallpapers={wallpapers} loading={loading} />
            
            {/* Load More Button - Show only if there are wallpapers */}
            {!loading && wallpapers.length > 0 && (
              <div className="text-center mt-12">
                <button className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors">
                  Load More Wallpapers
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
