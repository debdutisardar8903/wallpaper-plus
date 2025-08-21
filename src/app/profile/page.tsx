'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import Header from '@/components/Header';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { uploadOperations, userOperations, objectToArray } from '@/lib/database';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { favorites } = useFavorites();
  const [userStats, setUserStats] = useState({
    wallpapersAdded: 0,
    favoriteWallpapers: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch user statistics
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get user's uploaded wallpapers count
        const userUploads = await uploadOperations.getUserUploads(user.uid);
        const uploadsArray = objectToArray(userUploads);
        const wallpapersAdded = uploadsArray.length;

        // Get user profile for total views (if available)
        const userData = await userOperations.getUser(user.uid);
        const totalViews = userData?.totalViews || 0;

        setUserStats({
          wallpapersAdded,
          favoriteWallpapers: favorites.length,
          totalViews
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
        // Keep default values on error
        setUserStats({
          wallpapersAdded: 0,
          favoriteWallpapers: favorites.length,
          totalViews: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user, favorites.length]);

  // Update favorites count when favorites change
  useEffect(() => {
    setUserStats(prev => ({
      ...prev,
      favoriteWallpapers: favorites.length
    }));
  }, [favorites.length]);

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please Login</h1>
          <p className="text-gray-600 dark:text-gray-400">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 bg-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="rounded-full object-cover"
                  />
                ) : (
                  user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'
                )}
              </div>
              <button className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {user.displayName || 'User'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{user.email}</p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {loading ? (
                      <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-8 mx-auto rounded"></div>
                    ) : (
                      userStats.wallpapersAdded.toLocaleString()
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Wallpapers Added
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {loading ? (
                      <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-8 mx-auto rounded"></div>
                    ) : (
                      userStats.favoriteWallpapers.toLocaleString()
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Favorite Wallpapers
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {loading ? (
                      <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-8 mx-auto rounded"></div>
                    ) : (
                      userStats.totalViews.toLocaleString()
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Views
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link 
                  href="/profile-settings"
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-center"
                >
                  Edit Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="px-6 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>


      </main>
    </div>
  );
}
