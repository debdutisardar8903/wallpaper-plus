import Link from 'next/link';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  wallpaperCount: number;
  color: string; // For gradient backgrounds
}

interface CategoryListProps {
  categories: Category[];
  loading?: boolean;
  layout?: 'grid' | 'list';
}

export default function CategoryList({ categories, loading = false, layout = 'grid' }: CategoryListProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className={layout === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className={layout === 'grid' ? 'animate-pulse' : 'flex items-center space-x-4 p-4 animate-pulse'}>
            {layout === 'grid' ? (
              <div className="relative aspect-[4/3] rounded-lg bg-gray-200 dark:bg-gray-700">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-300 dark:from-gray-600 to-transparent rounded-lg"></div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No categories found</h3>
        <p className="text-gray-600 dark:text-gray-400">Categories will appear here once they are created.</p>
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className="space-y-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/category/${category.slug}`}>
            <div className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={category.thumbnailUrl}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-200"
                />
                <div 
                  className="absolute inset-0 bg-gradient-to-br opacity-80"
                  style={{ background: `linear-gradient(135deg, ${category.color}66, ${category.color}33)` }}
                ></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {category.description}
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-500">
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
          </Link>
        ))}
      </div>
    );
  }

  // Grid layout
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((category) => (
        <Link key={category.id} href={`/category/${category.slug}`}>
          <div className="group relative">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              <Image
                src={category.thumbnailUrl}
                alt={category.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              
              {/* Gradient overlay */}
              <div 
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                style={{ background: `linear-gradient(to top, ${category.color}88, transparent)` }}
              ></div>
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                <h3 className="font-bold text-lg mb-1 group-hover:text-purple-200 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-200 mb-2 line-clamp-2">
                  {category.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="bg-white/20 rounded-full px-2 py-1 backdrop-blur-sm">
                    {(category.wallpaperCount || 0).toLocaleString()} wallpapers
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 ring-2 ring-transparent group-hover:ring-purple-500 rounded-lg transition-all duration-200"></div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
