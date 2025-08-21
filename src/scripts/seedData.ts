import { ref, set } from 'firebase/database';
import { realtimeDb } from '../lib/firebase';

// Sample data to seed the database
const seedData = {
  categories: {
    'animals': {
      name: 'Animals',
      slug: 'animals',
      description: 'Beautiful wildlife and pet wallpapers',
      thumbnailUrl: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop',
      wallpaperCount: 245,
      color: '#10B981',
      featured: true,
      order: 1
    },
    'anime': {
      name: 'Anime',
      slug: 'anime',
      description: 'Stunning anime art and characters',
      thumbnailUrl: 'https://wallpaper-pulse-debduti-sardar-2024.s3.eu-north-1.amazonaws.com/anime/mainbg_3.jpg',
      wallpaperCount: 892,
      color: '#F59E0B',
      featured: true,
      order: 2
    },
    'nature': {
      name: 'Nature',
      slug: 'nature',
      description: 'Beautiful landscapes and natural scenery',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      wallpaperCount: 1247,
      color: '#10B981',
      featured: true,
      order: 3
    },
    'space': {
      name: 'Space',
      slug: 'space',
      description: 'Cosmic views and celestial beauty',
      thumbnailUrl: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=300&fit=crop',
      wallpaperCount: 421,
      color: '#8B5CF6',
      featured: true,
      order: 4
    },
    'cars-bikes': {
      name: 'Cars & Bikes',
      slug: 'cars-bikes',
      description: 'Vehicles and automotive wallpapers',
      thumbnailUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop',
      wallpaperCount: 156,
      color: '#EF4444',
      featured: false,
      order: 5
    },
    'gaming': {
      name: 'Gaming',
      slug: 'gaming',
      description: 'Video game characters and scenes',
      thumbnailUrl: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop',
      wallpaperCount: 634,
      color: '#6366F1',
      featured: false,
      order: 6
    }
  },
  
  wallpapers: {
    'wallpaper_1': {
      title: 'Mountain Landscape',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=700&fit=crop',
      category: 'Nature',
      resolution: '4K',
      tags: ['mountain', 'landscape', 'nature'],
      uploadedBy: 'system',
      author: 'Nature Photographer',
      downloads: 15420,
      views: 25680,
      featured: true,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    'wallpaper_2': {
      title: 'Space Galaxy',
      imageUrl: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=700&fit=crop',
      category: 'Space',
      resolution: '4K',
      tags: ['space', 'galaxy', 'stars'],
      uploadedBy: 'system',
      author: 'Space Explorer',
      downloads: 18920,
      views: 32150,
      featured: true,
      createdAt: '2024-01-13T09:20:00Z',
      updatedAt: '2024-01-13T09:20:00Z'
    },
    'wallpaper_3': {
      title: 'Ocean Waves',
      imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=700&fit=crop',
      category: 'Nature',
      resolution: '4K',
      tags: ['ocean', 'waves', 'beach'],
      uploadedBy: 'system',
      author: 'Ocean Photographer',
      downloads: 12340,
      views: 19800,
      featured: false,
      createdAt: '2024-01-14T15:45:00Z',
      updatedAt: '2024-01-14T15:45:00Z'
    },
    'wallpaper_4': {
      title: 'Anime Character',
      imageUrl: 'https://wallpaper-pulse-debduti-sardar-2024.s3.eu-north-1.amazonaws.com/anime/mainbg_3.jpg',
      category: 'Anime',
      resolution: '4K',
      tags: ['anime', 'character', 'art'],
      uploadedBy: 'system',
      author: 'Anime Artist',
      downloads: 8920,
      views: 15600,
      featured: true,
      createdAt: '2024-01-12T11:15:00Z',
      updatedAt: '2024-01-12T11:15:00Z'
    },
    'wallpaper_5': {
      title: 'Forest Path',
      imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=700&fit=crop',
      category: 'Nature',
      resolution: '4K',
      tags: ['forest', 'path', 'trees'],
      uploadedBy: 'system',
      author: 'Forest Explorer',
      downloads: 9560,
      views: 14200,
      featured: false,
      createdAt: '2024-01-11T08:30:00Z',
      updatedAt: '2024-01-11T08:30:00Z'
    },
    'wallpaper_6': {
      title: 'Wild Tiger',
      imageUrl: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=700&fit=crop',
      category: 'Animals',
      resolution: '4K',
      tags: ['tiger', 'wildlife', 'animals'],
      uploadedBy: 'system',
      author: 'Wildlife Photographer',
      downloads: 7820,
      views: 12900,
      featured: false,
      createdAt: '2024-01-10T16:20:00Z',
      updatedAt: '2024-01-10T16:20:00Z'
    }
  },
  
  settings: {
    featuredWallpapers: ['wallpaper_1', 'wallpaper_2', 'wallpaper_4'],
    maxUploadsPerUser: 50,
    allowedFileTypes: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSize: 52428800, // 50MB
    maintenanceMode: false,
    announcementBanner: {
      enabled: true,
      message: 'Welcome to Wallpaper Plus! Discover amazing wallpapers.',
      type: 'info'
    }
  }
};

// Function to seed the database
export const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    // Seed categories
    const categoriesRef = ref(realtimeDb, 'categories');
    await set(categoriesRef, seedData.categories);
    console.log('✅ Categories seeded');
    
    // Seed wallpapers
    const wallpapersRef = ref(realtimeDb, 'wallpapers');
    await set(wallpapersRef, seedData.wallpapers);
    console.log('✅ Wallpapers seeded');
    
    // Seed settings
    const settingsRef = ref(realtimeDb, 'settings');
    await set(settingsRef, seedData.settings);
    console.log('✅ Settings seeded');
    
    console.log('🎉 Database seeding completed successfully!');
    
    return {
      success: true,
      message: 'Database seeded successfully',
      data: {
        categories: Object.keys(seedData.categories).length,
        wallpapers: Object.keys(seedData.wallpapers).length,
        settings: 1
      }
    };
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Function to clear all data (use with caution)
export const clearDatabase = async () => {
  try {
    console.log('Clearing database...');
    
    const rootRef = ref(realtimeDb);
    await set(rootRef, null);
    
    console.log('✅ Database cleared');
    return { success: true, message: 'Database cleared successfully' };
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};

// Export seed data for reference
export { seedData };
