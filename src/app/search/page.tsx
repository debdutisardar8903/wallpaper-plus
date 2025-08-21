'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import WallpaperGrid from '@/components/WallpaperGrid';
import CategoryList from '@/components/CategoryList';
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

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<ReturnType<typeof transformWallpaper>[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [searchType, setSearchType] = useState<'wallpapers' | 'categories'>('wallpapers');
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [trendingTags, setTrendingTags] = useState<{name: string, count: number}[]>([]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    setSearchQuery(query);
    
    try {
      console.log(`Searching for: "${query}"`);
      
      // Search in database
      const searchResults = await uploadOperations.searchApprovedWallpapers(query);
      const transformedResults = searchResults.map((wallpaper) => transformWallpaper(wallpaper as unknown as DatabaseWallpaper));
      
      setSearchResults(transformedResults);
      console.log(`Found ${transformedResults.length} results for: "${query}"`);
    } catch (error) {
      console.error('Error searching wallpapers:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (tag: string) => {
    handleSearch(tag);
  };

  const handlePopularSearchClick = (search: string) => {
    handleSearch(search);
  };

  // Load search analytics for popular searches and trending tags
  useEffect(() => {
    const loadSearchAnalytics = async () => {
      try {
        const analytics = await uploadOperations.getSearchAnalytics();
        setPopularSearches(analytics.popularSearches);
        setTrendingTags(analytics.trendingTags);
        console.log('Loaded search analytics:', analytics);
      } catch (error) {
        console.error('Error loading search analytics:', error);
      }
    };

    loadSearchAnalytics();
  }, []);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Search Wallpapers
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Find the perfect wallpaper from thousands of high-quality images
          </p>
          
          {/* Search Form */}
          <div className="max-w-2xl mx-auto">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const query = formData.get('search') as string;
                handleSearch(query);
              }}
              className="relative"
            >
              <input
                type="text"
                name="search"
                placeholder="Search for wallpapers, categories, or tags..."
                defaultValue={searchQuery}
                className="w-full px-6 py-4 pr-16 text-lg rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Search Type Toggle */}
        {hasSearched && (
          <div className="flex justify-center mb-8">
            <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSearchType('wallpapers')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  searchType === 'wallpapers'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Wallpapers
              </button>
              <button
                onClick={() => setSearchType('categories')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  searchType === 'categories'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Categories
              </button>
            </div>
          </div>
        )}

        {/* Search Results */}
        {hasSearched ? (
          <div>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? 'Searching...' : `Search Results for "${searchQuery}"`}
              </h2>
              {!loading && (
                <span className="text-gray-600 dark:text-gray-400">
                  {searchResults.length} results found
                </span>
              )}
            </div>

            {/* Results Grid */}
            {searchType === 'wallpapers' ? (
              <WallpaperGrid wallpapers={searchResults} loading={loading} />
            ) : (
              <CategoryList categories={[]} loading={loading} />
            )}

            {/* No Results */}
            {!loading && searchResults.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found for &quot;{searchQuery}&quot;
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Try adjusting your search terms or browse popular categories below.
                </p>
                
                {/* Suggested searches */}
                <div className="flex flex-wrap justify-center gap-2">
                  {popularSearches.slice(0, 5).map((search) => (
                    <button
                      key={search}
                      onClick={() => handlePopularSearchClick(search)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Search Suggestions */
          <div className="space-y-12">
            {/* Popular Searches */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Popular Searches
              </h2>
              <div className="flex flex-wrap gap-3">
                {popularSearches.length > 0 ? (
                  popularSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handlePopularSearchClick(search)}
                      className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900 hover:border-purple-200 dark:hover:border-purple-700 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 font-medium"
                    >
                      {search}
                    </button>
                  ))
                ) : (
                  <div className="text-gray-500 dark:text-gray-400">
                    Upload wallpapers to see popular searches
                  </div>
                )}
              </div>
            </section>

            {/* Trending Tags */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Trending Tags
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {trendingTags.length > 0 ? (
                  trendingTags.slice(0, 12).map((tag) => (
                    <button
                      key={tag.name}
                      onClick={() => handleTagClick(tag.name)}
                      className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900 hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-200 group"
                    >
                      <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 mb-1">
                        #{tag.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {(tag.count || 0).toLocaleString()} wallpapers
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                    Upload wallpapers with tags to see trending topics
                  </div>
                )}
              </div>
            </section>

            {/* Search Tips */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Search Tips
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Use specific keywords
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try &quot;mountain sunset&quot; instead of just &quot;nature&quot; for better results.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Search by color
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Use color names like &quot;blue ocean&quot; or &quot;red abstract&quot; to find specific themes.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Try categories
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Browse by categories like &quot;nature&quot;, &quot;space&quot;, or &quot;minimalist&quot;.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Use multiple terms
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Combine keywords like &quot;dark forest night&quot; for more specific results.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-8"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
