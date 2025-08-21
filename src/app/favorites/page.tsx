'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import Header from '@/components/Header';
import Image from 'next/image';
import Link from 'next/link';



export default function FavoritesPage() {
  const { user } = useAuth();
  const { favorites, removeFromFavorites, clearAllFavorites, loading } = useFavorites();
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'category'>('recent');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = [
    'Animals', 'Anime', 'Cars & Bikes', 'Cartoons', 'Celebs', 'Comics',
    'Food', 'Gaming', 'Movies', 'Music', 'Nature', 'Space', 'Sports',
    'Travels', 'TV Shows', 'HD'
  ];

  const handleRemoveFavorite = (wallpaperId: string) => {
    if (confirm('Remove this wallpaper from your favorites?')) {
      removeFromFavorites(wallpaperId);
    }
  };

  const handleClearAllFavorites = () => {
    if (confirm('Are you sure you want to remove all favorites? This action cannot be undone.')) {
      clearAllFavorites();
    }
  };

  // Sort favorites
  const sortedFavorites = [...favorites].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.favoriteDate).getTime() - new Date(a.favoriteDate).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  // Filter by category
  const filteredFavorites = filterCategory === 'all' 
    ? sortedFavorites 
    : sortedFavorites.filter(fav => fav.category === filterCategory);

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please Login</h1>
          <p className="text-gray-600 dark:text-gray-400">You need to be logged in to view your favorites.</p>
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
            Favorite Images
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your collection of loved wallpapers
          </p>
        </div>

        {/* Stats and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {favorites.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Favorites
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {new Set(favorites.map(f => f.category)).size}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Categories
                </div>
              </div>
            </div>
            
            {favorites.length > 0 && (
              <button
                onClick={handleClearAllFavorites}
                className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg font-medium transition-colors"
              >
                Clear All Favorites
              </button>
            )}
          </div>
        </div>

        {/* Filters and Sort */}
        {favorites.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Sort Options */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'title' | 'category')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="recent">Recently Added</option>
                  <option value="title">Title A-Z</option>
                  <option value="category">Category</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filter:
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Favorites Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="group">
                <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-300 dark:from-gray-600 to-transparent"></div>
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">No favorites yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Start exploring wallpapers and click the heart icon to add them to your favorites collection.
            </p>
            <Link 
              href="/"
              className="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Browse Wallpapers
            </Link>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No favorites found in &quot;{filterCategory}&quot;
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try selecting a different category or clear the filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFavorites.map((wallpaper) => (
              <div key={wallpaper.id} className="group relative">
                <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <Link href={`/wallpaper/${wallpaper.id}`} className="absolute inset-0 z-10">
                    <span className="sr-only">View {wallpaper.title}</span>
                  </Link>
                  
                  <Image
                    src={wallpaper.imageUrl}
                    alt={wallpaper.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
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

                  {/* Remove from Favorites Button */}
                  <button 
                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600/80 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(wallpaper.id);
                    }}
                    title="Remove from favorites"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Favorite Date */}
                  <div className="absolute bottom-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                      {new Date(wallpaper.favoriteDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="mt-2">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {wallpaper.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    by {wallpaper.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
