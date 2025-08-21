'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { favoriteOperations, objectToArray } from '@/lib/database';

interface FavoriteWallpaper {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  resolution: string;
  downloads: number;
  tags: string[];
  favoriteDate: string;
  author: string;
}

interface FavoritesContextType {
  favorites: FavoriteWallpaper[];
  addToFavorites: (wallpaper: Omit<FavoriteWallpaper, 'favoriteDate'>) => void;
  removeFromFavorites: (wallpaperId: string) => void;
  isFavorite: (wallpaperId: string) => boolean;
  clearAllFavorites: () => void;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const [favorites, setFavorites] = useState<FavoriteWallpaper[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Mock data for demonstration (unused)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mockFavorites: FavoriteWallpaper[] = [
    {
      id: '1',
      title: 'Mountain Landscape',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=700&fit=crop',
      category: 'Nature',
      resolution: '4K',
      downloads: 15420,
      tags: ['mountain', 'landscape', 'nature'],
      favoriteDate: '2024-01-15T10:30:00Z',
      author: 'John Doe'
    },
    {
      id: '3',
      title: 'Ocean Waves',
      imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=700&fit=crop',
      category: 'Nature',
      resolution: '4K',
      downloads: 12340,
      tags: ['ocean', 'waves', 'beach'],
      favoriteDate: '2024-01-14T15:45:00Z',
      author: 'WavePhotographer'
    },
    {
      id: '6',
      title: 'Space Galaxy',
      imageUrl: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=700&fit=crop',
      category: 'Space',
      resolution: '4K',
      downloads: 18920,
      tags: ['space', 'galaxy', 'stars'],
      favoriteDate: '2024-01-13T09:20:00Z',
      author: 'SpaceExplorer'
    }
  ];

  // Load favorites when user logs in
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // Subscribe to real-time favorites updates
      const unsubscribe = favoriteOperations.subscribeToFavorites(
        user.uid,
        (favoritesData) => {
          const favoritesArray = objectToArray(favoritesData) as FavoriteWallpaper[];
          setFavorites(favoritesArray);
          setLoading(false);
        }
      );

      // Cleanup subscription on unmount
      return unsubscribe;
    } catch (error) {
      console.warn('Failed to subscribe to favorites, using empty array:', error);
      setFavorites([]);
      setLoading(false);
      return () => {}; // Return empty cleanup function
    }
  }, [user]);

  const addToFavorites = async (wallpaper: Omit<FavoriteWallpaper, 'favoriteDate'>) => {
    if (!user) return;

    try {
      // Ensure all required properties exist with defaults
      const wallpaperWithDefaults = {
        ...wallpaper,
        downloads: wallpaper.downloads || 0,
        resolution: wallpaper.resolution || 'HD',
        author: wallpaper.author || 'Unknown',
        tags: wallpaper.tags || []
      };
      
      await favoriteOperations.addFavorite(user.uid, wallpaper.id, wallpaperWithDefaults);
      // The real-time listener will automatically update the state
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const removeFromFavorites = async (wallpaperId: string) => {
    if (!user) return;

    try {
      await favoriteOperations.removeFavorite(user.uid, wallpaperId);
      // The real-time listener will automatically update the state
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const isFavorite = (wallpaperId: string): boolean => {
    return favorites.some(fav => fav.id === wallpaperId);
  };

  const clearAllFavorites = async () => {
    if (!user) return;

    try {
      await favoriteOperations.clearAllFavorites(user.uid);
      // The real-time listener will automatically update the state
    } catch (error) {
      console.error('Error clearing favorites:', error);
    }
  };

  const value: FavoritesContextType = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    clearAllFavorites,
    loading,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
