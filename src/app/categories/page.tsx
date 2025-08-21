'use client';

import { useState } from 'react';
// import Image from 'next/image';
import Header from '@/components/Header';
import Link from 'next/link';

// Categories data
const categories = [
  {
    id: 'animals',
    name: 'Animals',
    slug: 'animals',
    description: 'Wildlife, pets, and beautiful animal photography',
    wallpaperCount: 1247,
    color: '#10B981',
    icon: '🐾'
  },
  {
    id: 'anime',
    name: 'Anime',
    slug: 'anime',
    description: 'Japanese animation art and characters',
    wallpaperCount: 2156,
    color: '#EC4899',
    icon: '🎌'
  },
  {
    id: 'cars-bikes',
    name: 'Cars & Bikes',
    slug: 'cars-bikes',
    description: 'Vehicles, motorcycles, and automotive art',
    wallpaperCount: 892,
    color: '#EF4444',
    icon: '🚗'
  },
  {
    id: 'cartoons',
    name: 'Cartoons',
    slug: 'cartoons',
    description: 'Animated characters and cartoon art',
    wallpaperCount: 756,
    color: '#F59E0B',
    icon: '🎨'
  },
  {
    id: 'celebs',
    name: 'Celebs',
    slug: 'celebs',
    description: 'Famous personalities and celebrities',
    wallpaperCount: 634,
    color: '#8B5CF6',
    icon: '⭐'
  },
  {
    id: 'comics',
    name: 'Comics',
    slug: 'comics',
    description: 'Comic book heroes and graphic art',
    wallpaperCount: 923,
    color: '#3B82F6',
    icon: '💥'
  },
  {
    id: 'food',
    name: 'Food',
    slug: 'food',
    description: 'Delicious food photography and culinary art',
    wallpaperCount: 421,
    color: '#F97316',
    icon: '🍕'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    slug: 'gaming',
    description: 'Video games, characters, and gaming artwork',
    wallpaperCount: 1834,
    color: '#06B6D4',
    icon: '🎮'
  },
  {
    id: 'movies',
    name: 'Movies',
    slug: 'movies',
    description: 'Film posters, scenes, and movie artwork',
    wallpaperCount: 1156,
    color: '#DC2626',
    icon: '🎬'
  },
  {
    id: 'music',
    name: 'Music',
    slug: 'music',
    description: 'Musical instruments, artists, and music art',
    wallpaperCount: 687,
    color: '#7C3AED',
    icon: '🎵'
  },
  {
    id: 'nature',
    name: 'Nature',
    slug: 'nature',
    description: 'Landscapes, forests, mountains, and natural beauty',
    wallpaperCount: 2847,
    color: '#059669',
    icon: '🌿'
  },
  {
    id: 'space',
    name: 'Space',
    slug: 'space',
    description: 'Cosmic views, planets, and astronomical wonders',
    wallpaperCount: 734,
    color: '#1E40AF',
    icon: '🚀'
  },
  {
    id: 'sports',
    name: 'Sports',
    slug: 'sports',
    description: 'Athletic moments, sports teams, and competitions',
    wallpaperCount: 542,
    color: '#16A34A',
    icon: '⚽'
  },
  {
    id: 'travels',
    name: 'Travels',
    slug: 'travels',
    description: 'Beautiful destinations and travel photography',
    wallpaperCount: 1324,
    color: '#0891B2',
    icon: '✈️'
  },
  {
    id: 'tv-shows',
    name: 'TV Shows',
    slug: 'tv-shows',
    description: 'Television series, characters, and show artwork',
    wallpaperCount: 896,
    color: '#BE185D',
    icon: '📺'
  },
  {
    id: 'hd',
    name: 'HD',
    slug: 'hd',
    description: 'High definition and ultra HD wallpapers',
    wallpaperCount: 3421,
    color: '#7C2D12',
    icon: '🔥'
  }
];

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Browse{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Categories
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Discover wallpapers organized by your favorite themes and interests
          </p>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
            </button>
          </div>
        </div>

        {/* Categories Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCategories.map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`}>
                <div className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                  <div className="text-center">
                    <div 
                      className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {category.description}
                    </p>
                    <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {(category.wallpaperCount || 0).toLocaleString()} wallpapers
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`}>
                <div className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {category.description}
                      </p>
                      <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {(category.wallpaperCount || 0).toLocaleString()} wallpapers
                      </div>
                    </div>
                    <div className="text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No categories found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
