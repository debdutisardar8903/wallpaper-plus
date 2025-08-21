import { 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  push, 
  onValue, 
  off,
  query,
  orderByChild,
  limitToFirst,
  equalTo,
  startAt
} from 'firebase/database';
import { realtimeDb } from './firebase';

// User operations
export const userOperations = {
  // Create or update user profile
  async createUser(uid: string, userData: Record<string, unknown>) {
    const userRef = ref(realtimeDb, `users/${uid}`);
    await set(userRef, {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        wallpapersUploaded: 0,
        totalViews: 0,
        totalDownloads: 0
      }
    });
  },

  // Get user profile
  async getUser(uid: string) {
    const userRef = ref(realtimeDb, `users/${uid}`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
  },

  // Update user profile
  async updateUser(uid: string, updates: Record<string, unknown>) {
    const userRef = ref(realtimeDb, `users/${uid}`);
    await update(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  // Listen to user changes
  subscribeToUser(uid: string, callback: (userData: Record<string, unknown> | null) => void) {
    const userRef = ref(realtimeDb, `users/${uid}`);
    onValue(userRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
    return () => off(userRef);
  }
};

// Wallpaper operations
export const wallpaperOperations = {
  // Get all wallpapers
  async getAllWallpapers() {
    const wallpapersRef = ref(realtimeDb, 'wallpapers');
    const snapshot = await get(wallpapersRef);
    return snapshot.exists() ? snapshot.val() : {};
  },

  // Get wallpapers by category
  async getWallpapersByCategory(category: string) {
    const wallpapersRef = ref(realtimeDb, 'wallpapers');
    const categoryQuery = query(wallpapersRef, orderByChild('category'), equalTo(category));
    const snapshot = await get(categoryQuery);
    return snapshot.exists() ? snapshot.val() : {};
  },

  // Get featured wallpapers
  async getFeaturedWallpapers() {
    const wallpapersRef = ref(realtimeDb, 'wallpapers');
    const featuredQuery = query(wallpapersRef, orderByChild('featured'), equalTo(true));
    const snapshot = await get(featuredQuery);
    return snapshot.exists() ? snapshot.val() : {};
  },

  // Get single wallpaper
  async getWallpaper(wallpaperId: string) {
    const wallpaperRef = ref(realtimeDb, `wallpapers/${wallpaperId}`);
    const snapshot = await get(wallpaperRef);
    return snapshot.exists() ? snapshot.val() : null;
  },

  // Add wallpaper (admin only)
  async addWallpaper(wallpaperData: Record<string, unknown>) {
    const wallpapersRef = ref(realtimeDb, 'wallpapers');
    const newWallpaperRef = push(wallpapersRef);
    await set(newWallpaperRef, {
      ...wallpaperData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      views: 0
    });
    return newWallpaperRef.key;
  },

  // Update wallpaper stats
  async incrementDownload(wallpaperId: string) {
    const wallpaperRef = ref(realtimeDb, `wallpapers/${wallpaperId}`);
    const snapshot = await get(wallpaperRef);
    if (snapshot.exists()) {
      const currentDownloads = snapshot.val().downloads || 0;
      await update(wallpaperRef, {
        downloads: currentDownloads + 1,
        updatedAt: new Date().toISOString()
      });
    }
  },

  async incrementView(wallpaperId: string) {
    const wallpaperRef = ref(realtimeDb, `wallpapers/${wallpaperId}`);
    const snapshot = await get(wallpaperRef);
    if (snapshot.exists()) {
      const currentViews = snapshot.val().views || 0;
      await update(wallpaperRef, {
        views: currentViews + 1,
        updatedAt: new Date().toISOString()
      });
    }
  }
};

// User uploads operations
export const uploadOperations = {
  // Add user upload
  async addUserUpload(uid: string, uploadData: Record<string, unknown>) {
    try {
      console.log('Adding user upload for uid:', uid);
      console.log('Upload data:', uploadData);
      
      const uploadsRef = ref(realtimeDb, `userUploads/${uid}`);
      const newUploadRef = push(uploadsRef);
      
      const dataToSave = {
        ...uploadData,
        status: 'pending',
        uploadDate: new Date().toISOString(),
        views: 0,
        downloads: 0
      };
      
      console.log('Final data to save:', dataToSave);
      console.log('Saving to path:', `userUploads/${uid}/${newUploadRef.key}`);
      
      await set(newUploadRef, dataToSave);
      console.log('Successfully saved upload with key:', newUploadRef.key);
      
      return newUploadRef.key;
    } catch (error) {
      console.error('Error in addUserUpload:', error);
      throw error;
    }
  },

  // Get user uploads
  async getUserUploads(uid: string) {
    const uploadsRef = ref(realtimeDb, `userUploads/${uid}`);
    const snapshot = await get(uploadsRef);
    return snapshot.exists() ? snapshot.val() : {};
  },

  // Update upload status (admin only)
  async updateUploadStatus(uid: string, uploadId: string, status: string, adminUid?: string, reason?: string) {
    const uploadRef = ref(realtimeDb, `userUploads/${uid}/${uploadId}`);
            const updates: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString()
    };
    
    if (status === 'approved') {
      updates.approvedAt = new Date().toISOString();
      updates.approvedBy = adminUid;
    } else if (status === 'rejected') {
      updates.rejectionReason = reason;
    }
    
    await update(uploadRef, updates);
  },

  // Delete user upload
  async deleteUserUpload(uid: string, uploadId: string) {
    const uploadRef = ref(realtimeDb, `userUploads/${uid}/${uploadId}`);
    await remove(uploadRef);
  },

  // Get all approved wallpapers for homepage (public access)
  async getAllApprovedWallpapers() {
    try {
      // Get all user uploads
      const uploadsRef = ref(realtimeDb, 'userUploads');
      const snapshot = await get(uploadsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const allUploads = snapshot.val();
      const approvedWallpapers: Record<string, unknown>[] = [];
      
      // Iterate through all users and their uploads
      Object.keys(allUploads).forEach(userId => {
        const userUploads = allUploads[userId];
        
        Object.keys(userUploads).forEach(uploadId => {
          const upload = userUploads[uploadId];
          
          // Only include approved wallpapers
          if (upload.status === 'approved') {
            approvedWallpapers.push({
              id: uploadId,
              userId,
              ...upload
            });
          }
        });
      });
      
      // Sort by upload date (newest first)
      approvedWallpapers.sort((a, b) => {
        const aDate = (a as Record<string, unknown>).uploadDate as string || '0';
        const bDate = (b as Record<string, unknown>).uploadDate as string || '0';
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
      
      console.log('Found approved wallpapers:', approvedWallpapers.length);
      return approvedWallpapers;
      
    } catch (error) {
      console.error('Error fetching approved wallpapers:', error);
      return [];
    }
  },

  // Get approved wallpapers by category
  async getApprovedWallpapersByCategory(categoryName: string) {
    try {
      // Get all approved wallpapers first
      const allWallpapers = await this.getAllApprovedWallpapers();
      
      // Filter by category (case-insensitive)
      const categoryWallpapers = allWallpapers.filter(wallpaper => {
        const category = (wallpaper as Record<string, unknown>).category as string;
        return category && category.toLowerCase() === categoryName.toLowerCase();
      });
      
      console.log(`Found ${categoryWallpapers.length} wallpapers for category: ${categoryName}`);
      return categoryWallpapers;
      
    } catch (error) {
      console.error(`Error fetching wallpapers for category ${categoryName}:`, error);
      return [];
    }
  },

  // Search approved wallpapers by query (title, category, tags, author)
  async searchApprovedWallpapers(query: string) {
    try {
      if (!query.trim()) {
        return [];
      }

      // Get all approved wallpapers first
      const allWallpapers = await this.getAllApprovedWallpapers();
      
      const searchTerm = query.toLowerCase().trim();
      
      // Search in title, category, tags, and author
      const searchResults = allWallpapers.filter(wallpaper => {
        const wallpaperObj = wallpaper as Record<string, unknown>;
        const title = (wallpaperObj.title as string) || '';
        const category = (wallpaperObj.category as string) || '';
        const author = (wallpaperObj.author as string) || '';
        const tags = wallpaperObj.tags as Record<string, string> | null;
        
        // Search in title
        if (title.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search in category
        if (category.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search in author
        if (author.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search in tags
        if (tags) {
          const tagValues = Object.values(tags);
          if (tagValues.some(tag => tag.toLowerCase().includes(searchTerm))) {
            return true;
          }
        }
        
        return false;
      });
      
      // Sort by relevance (exact matches first, then partial matches)
      const sortedResults = searchResults.sort((a, b) => {
        const aObj = a as Record<string, unknown>;
        const bObj = b as Record<string, unknown>;
        const aTitle = (aObj.title as string) || '';
        const bTitle = (bObj.title as string) || '';
        
        const aExactTitle = aTitle.toLowerCase() === searchTerm;
        const bExactTitle = bTitle.toLowerCase() === searchTerm;
        
        if (aExactTitle && !bExactTitle) return -1;
        if (!aExactTitle && bExactTitle) return 1;
        
        // Sort by views for same relevance level
        return ((bObj.views as number) || 0) - ((aObj.views as number) || 0);
      });
      
      console.log(`Found ${sortedResults.length} wallpapers for search: "${query}"`);
      return sortedResults;
      
    } catch (error) {
      console.error(`Error searching wallpapers for query "${query}":`, error);
      return [];
    }
  },

  // Get popular search terms and trending tags from database
  async getSearchAnalytics() {
    try {
      // Get all approved wallpapers to analyze tags and categories
      const allWallpapers = await this.getAllApprovedWallpapers();
      
      // Count tags
      const tagCounts: Record<string, number> = {};
      const categorySet = new Set<string>();
      
      allWallpapers.forEach(wallpaper => {
        const wallpaperObj = wallpaper as Record<string, unknown>;
        const category = (wallpaperObj.category as string) || '';
        const tags = wallpaperObj.tags as Record<string, string> | null;
        
        // Count categories
        if (category) {
          categorySet.add(category.toLowerCase());
        }
        
        // Count tags
        if (tags) {
          Object.values(tags).forEach(tag => {
            const normalizedTag = tag.toLowerCase();
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
          });
        }
      });
      
      // Get top tags
      const trendingTags = Object.entries(tagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Top 20 tags
      
      // Popular searches (combination of categories and top tags)
      const popularSearches = [
        ...Array.from(categorySet),
        ...trendingTags.slice(0, 10).map(tag => tag.name)
      ].slice(0, 15); // Limit to 15 popular searches
      
      console.log(`Generated analytics: ${trendingTags.length} trending tags, ${popularSearches.length} popular searches`);
      
      return {
        trendingTags,
        popularSearches
      };
      
    } catch (error) {
      console.error('Error getting search analytics:', error);
      return {
        trendingTags: [],
        popularSearches: []
      };
    }
  },

  // Get individual wallpaper by ID
  async getWallpaperById(wallpaperId: string) {
    try {
      let wallpaper = null;
      
      // Method 1: Try to find in main wallpapers collection first
      try {
        const wallpaperRef = ref(realtimeDb, `wallpapers/${wallpaperId}`);
        const snapshot = await get(wallpaperRef);
        
        if (snapshot.exists()) {
          wallpaper = {
            id: wallpaperId,
            ...snapshot.val()
          };
          console.log(`Found wallpaper in main collection: ${wallpaper.title} (downloads: ${wallpaper.downloads || 0})`);
          return wallpaper;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('Not found in main wallpapers collection:', errorMessage);
      }
      
      // Method 2: Search in userUploads (fallback)
      try {
        const uploadsRef = ref(realtimeDb, 'userUploads');
        const snapshot = await get(uploadsRef);
        
        if (snapshot.exists()) {
          const allUploads = snapshot.val();
          
          // Search through all users for this wallpaper
          for (const userId of Object.keys(allUploads)) {
            const userUploads = allUploads[userId];
            if (userUploads[wallpaperId] && userUploads[wallpaperId].status === 'approved') {
              wallpaper = {
                id: wallpaperId,
                userId,
                ...userUploads[wallpaperId]
              };
              console.log(`Found wallpaper in userUploads: ${wallpaper.title} (downloads: ${wallpaper.downloads || 0})`);
              break;
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('Error searching userUploads:', errorMessage);
      }
      
      if (!wallpaper) {
        console.log(`Wallpaper with ID ${wallpaperId} not found in any collection`);
        return null;
      }
      
      return wallpaper;
      
    } catch (error) {
      console.error(`Error fetching wallpaper ${wallpaperId}:`, error);
      return null;
    }
  },

  // Get related wallpapers (same category, excluding current wallpaper)
  async getRelatedWallpapers(wallpaperId: string, category: string, limit: number = 8) {
    try {
      const categoryWallpapers = await this.getApprovedWallpapersByCategory(category);
      
      // Filter out the current wallpaper and limit results
      const relatedWallpapers = categoryWallpapers
        .filter(w => w.id !== wallpaperId)
        .slice(0, limit);
      
      console.log(`Found ${relatedWallpapers.length} related wallpapers in ${category}`);
      return relatedWallpapers;
      
    } catch (error) {
      console.error(`Error fetching related wallpapers:`, error);
      return [];
    }
  },

  // Track wallpaper download and increment count
  async trackDownload(wallpaperId: string, userId?: string) {
    try {
      // 1. Check and update in main wallpapers collection first
      const wallpaperRef = ref(realtimeDb, `wallpapers/${wallpaperId}`);
      const wallpaperSnapshot = await get(wallpaperRef);
      
      if (wallpaperSnapshot.exists()) {
        const wallpaper = wallpaperSnapshot.val() as Record<string, unknown>;
        const currentDownloads = (wallpaper.downloads as number) || 0;
        await update(wallpaperRef, { downloads: currentDownloads + 1 });
        console.log(`Updated download count in wallpapers for ${wallpaperId}: ${currentDownloads + 1}`);
        // found = true; // Remove unused variable
      }
      
      // 2. Also check and update in user uploads (for consistency)
      const uploadsRef = ref(realtimeDb, 'userUploads');
      const snapshot = await get(uploadsRef);
      
      if (snapshot.exists()) {
        const allUploads = snapshot.val();
        
        // Find and update the wallpaper's download count in userUploads
        for (const uid of Object.keys(allUploads)) {
          const userUploads = allUploads[uid];
          if (userUploads[wallpaperId]) {
            const userWallpaperRef = ref(realtimeDb, `userUploads/${uid}/${wallpaperId}`);
            const currentDownloads = userUploads[wallpaperId].downloads || 0;
            await update(userWallpaperRef, { downloads: currentDownloads + 1 });
            
            console.log(`Updated download count in userUploads for wallpaper ${wallpaperId}: ${currentDownloads + 1}`);
            break;
          }
        }
      }
      
      // 3. Track individual download event (for analytics)
      const downloadRef = ref(realtimeDb, `downloads/${wallpaperId}`);
      const downloadRecordRef = push(downloadRef);
      await set(downloadRecordRef, {
        userId: userId || 'anonymous',
        downloadDate: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        anonymous: !userId
      });
      
      // 4. Update download counters for analytics
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const month = new Date().toISOString().substring(0, 7); // YYYY-MM
      
      // Update daily counter
      const dailyRef = ref(realtimeDb, `downloadCounters/${wallpaperId}/daily/${today}`);
      const dailySnapshot = await get(dailyRef);
      const dailyCount = dailySnapshot.exists() ? dailySnapshot.val() : 0;
      await set(dailyRef, dailyCount + 1);
      
      // Update monthly counter
      const monthlyRef = ref(realtimeDb, `downloadCounters/${wallpaperId}/monthly/${month}`);
      const monthlySnapshot = await get(monthlyRef);
      const monthlyCount = monthlySnapshot.exists() ? monthlySnapshot.val() : 0;
      await set(monthlyRef, monthlyCount + 1);
      
      // Update total counter
      const totalRef = ref(realtimeDb, `downloadCounters/${wallpaperId}/total`);
      const totalSnapshot = await get(totalRef);
      const totalCount = totalSnapshot.exists() ? totalSnapshot.val() : 0;
      await set(totalRef, totalCount + 1);
      
      // Update last updated timestamp
      await set(ref(realtimeDb, `downloadCounters/${wallpaperId}/lastUpdated`), new Date().toISOString());
      
      console.log(`Download tracking completed for wallpaper ${wallpaperId}`);
      return true;
      
    } catch (error) {
      console.error('Error tracking download:', error);
      // Fallback: try simpler increment
      try {
        await this.incrementDownloadCount(wallpaperId);
        return true;
      } catch (fallbackError) {
        console.error('Fallback download tracking also failed:', fallbackError);
        return false;
      }
    }
  },

  // Simple download count increment (fallback)
  async incrementDownloadCount(wallpaperId: string) {
    try {
      let success = false;
      
      // Method 1: Try userUploads first (most likely to work)
      try {
        const uploadsRef = ref(realtimeDb, 'userUploads');
        const snapshot = await get(uploadsRef);
        
        if (snapshot.exists()) {
          const allUploads = snapshot.val();
          
          for (const uid of Object.keys(allUploads)) {
            const userUploads = allUploads[uid];
            if (userUploads[wallpaperId]) {
              const userWallpaperRef = ref(realtimeDb, `userUploads/${uid}/${wallpaperId}`);
              const currentDownloads = userUploads[wallpaperId].downloads || 0;
              await update(userWallpaperRef, { downloads: currentDownloads + 1 });
              
              console.log(`Incremented download count in userUploads for ${wallpaperId} to ${currentDownloads + 1}`);
              success = true;
              break;
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('Failed to update userUploads:', errorMessage);
      }
      
      // Method 2: Try main wallpapers collection (if user is admin or if rules allow)
      if (!success) {
        try {
          const wallpaperRef = ref(realtimeDb, `wallpapers/${wallpaperId}`);
          const snapshot = await get(wallpaperRef);
          
          if (snapshot.exists()) {
            const wallpaper = snapshot.val();
            const currentCount = wallpaper.downloads || 0;
            
            await update(wallpaperRef, { downloads: currentCount + 1 });
            console.log(`Incremented download count in wallpapers for ${wallpaperId} to ${currentCount + 1}`);
            success = true;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log('Failed to update main wallpapers:', errorMessage);
        }
      }
      
      // Method 3: At minimum, track the download event
      if (!success) {
        try {
          const downloadRef = ref(realtimeDb, `downloads/${wallpaperId}`);
          const downloadRecordRef = push(downloadRef);
          await set(downloadRecordRef, {
            userId: 'anonymous',
            downloadDate: new Date().toISOString(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            anonymous: true
          });
          console.log(`At least tracked download event for ${wallpaperId}`);
          success = true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log('Failed to track download event:', errorMessage);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error incrementing download count:', error);
      return false;
    }
  },

  // Track wallpaper view and increment count
  async trackView(wallpaperId: string, userId?: string) {
    try {
      // 1. Check and update in main wallpapers collection first
      const wallpaperRef = ref(realtimeDb, `wallpapers/${wallpaperId}`);
      const wallpaperSnapshot = await get(wallpaperRef);
      
      if (wallpaperSnapshot.exists()) {
        const wallpaper = wallpaperSnapshot.val() as Record<string, unknown>;
        const currentViews = (wallpaper.views as number) || 0;
        await update(wallpaperRef, { views: currentViews + 1 });
        console.log(`Updated view count in wallpapers for ${wallpaperId}: ${currentViews + 1}`);
        // found = true; // Remove unused variable
      }
      
      // 2. Also check and update in user uploads (for consistency)
      const uploadsRef = ref(realtimeDb, 'userUploads');
      const snapshot = await get(uploadsRef);
      
      if (snapshot.exists()) {
        const allUploads = snapshot.val();
        
        // Find and update the wallpaper's view count in userUploads
        for (const uid of Object.keys(allUploads)) {
          const userUploads = allUploads[uid];
          if (userUploads[wallpaperId]) {
            const userWallpaperRef = ref(realtimeDb, `userUploads/${uid}/${wallpaperId}`);
            const currentViews = userUploads[wallpaperId].views || 0;
            await update(userWallpaperRef, { views: currentViews + 1 });
            
            console.log(`Updated view count in userUploads for wallpaper ${wallpaperId}: ${currentViews + 1}`);
            break;
          }
        }
      }
      
      // 3. Track individual view event (for analytics)
      const viewRef = ref(realtimeDb, `views/${wallpaperId}`);
      const viewRecordRef = push(viewRef);
      await set(viewRecordRef, {
        userId: userId || 'anonymous',
        viewDate: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        anonymous: !userId
      });
      
      console.log(`View tracking completed for wallpaper ${wallpaperId}`);
      return true;
      
    } catch (error) {
      console.error('Error tracking view:', error);
      // Fallback: try simpler increment
      try {
        await this.incrementViewCount(wallpaperId);
        return true;
      } catch (fallbackError) {
        console.error('Fallback view tracking also failed:', fallbackError);
        return false;
      }
    }
  },

  // Simple view count increment (fallback)
  async incrementViewCount(wallpaperId: string) {
    try {
      let success = false;
      
      // Method 1: Try userUploads first (most likely to work)
      try {
        const uploadsRef = ref(realtimeDb, 'userUploads');
        const snapshot = await get(uploadsRef);
        
        if (snapshot.exists()) {
          const allUploads = snapshot.val();
          
          for (const uid of Object.keys(allUploads)) {
            const userUploads = allUploads[uid];
            if (userUploads[wallpaperId]) {
              const userWallpaperRef = ref(realtimeDb, `userUploads/${uid}/${wallpaperId}`);
              const currentViews = userUploads[wallpaperId].views || 0;
              await update(userWallpaperRef, { views: currentViews + 1 });
              
              console.log(`Incremented view count in userUploads for ${wallpaperId} to ${currentViews + 1}`);
              success = true;
              break;
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('Failed to update userUploads views:', errorMessage);
      }
      
      // Method 2: Try main wallpapers collection (if user is admin or if rules allow)
      if (!success) {
        try {
          const wallpaperRef = ref(realtimeDb, `wallpapers/${wallpaperId}`);
          const snapshot = await get(wallpaperRef);
          
          if (snapshot.exists()) {
            const wallpaper = snapshot.val();
            const currentCount = wallpaper.views || 0;
            
            await update(wallpaperRef, { views: currentCount + 1 });
            console.log(`Incremented view count in wallpapers for ${wallpaperId} to ${currentCount + 1}`);
            success = true;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log('Failed to update main wallpapers views:', errorMessage);
        }
      }
      
      // Method 3: At minimum, track the view event
      if (!success) {
        try {
          const viewRef = ref(realtimeDb, `views/${wallpaperId}`);
          const viewRecordRef = push(viewRef);
          await set(viewRecordRef, {
            userId: 'anonymous',
            viewDate: new Date().toISOString(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            anonymous: true
          });
          console.log(`At least tracked view event for ${wallpaperId}`);
          success = true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log('Failed to track view event:', errorMessage);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error incrementing view count:', error);
      return false;
    }
  }
};

// Favorites operations
export const favoriteOperations = {
  // Add to favorites
  async addFavorite(uid: string, wallpaperId: string, wallpaperData: Record<string, unknown>) {
    const favoriteRef = ref(realtimeDb, `favorites/${uid}/${wallpaperId}`);
    await set(favoriteRef, {
      wallpaperId,
      favoriteDate: new Date().toISOString(),
      title: wallpaperData.title,
      imageUrl: wallpaperData.imageUrl,
      category: wallpaperData.category,
      author: wallpaperData.author
    });
  },

  // Remove from favorites
  async removeFavorite(uid: string, wallpaperId: string) {
    const favoriteRef = ref(realtimeDb, `favorites/${uid}/${wallpaperId}`);
    await remove(favoriteRef);
  },

  // Get user favorites
  async getUserFavorites(uid: string) {
    const favoritesRef = ref(realtimeDb, `favorites/${uid}`);
    const snapshot = await get(favoritesRef);
    return snapshot.exists() ? snapshot.val() : {};
  },

  // Check if wallpaper is favorited
  async isFavorite(uid: string, wallpaperId: string) {
    const favoriteRef = ref(realtimeDb, `favorites/${uid}/${wallpaperId}`);
    const snapshot = await get(favoriteRef);
    return snapshot.exists();
  },

  // Clear all favorites
  async clearAllFavorites(uid: string) {
    const favoritesRef = ref(realtimeDb, `favorites/${uid}`);
    await remove(favoritesRef);
  },

  // Listen to favorites changes
  subscribeToFavorites(uid: string, callback: (favorites: Record<string, unknown>) => void) {
    const favoritesRef = ref(realtimeDb, `favorites/${uid}`);
    onValue(favoritesRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : {});
    });
    return () => off(favoritesRef);
  }
};

// Categories operations
export const categoryOperations = {
  // Get all categories
  async getAllCategories() {
    const categoriesRef = ref(realtimeDb, 'categories');
    const snapshot = await get(categoriesRef);
    return snapshot.exists() ? snapshot.val() : {};
  },

  // Get featured categories
  async getFeaturedCategories() {
    const categoriesRef = ref(realtimeDb, 'categories');
    const featuredQuery = query(categoriesRef, orderByChild('featured'), equalTo(true));
    const snapshot = await get(featuredQuery);
    return snapshot.exists() ? snapshot.val() : {};
  },

  // Add category (admin only)
  async addCategory(categoryData: Record<string, unknown>) {
    const categoriesRef = ref(realtimeDb, 'categories');
    const newCategoryRef = push(categoriesRef);
    await set(newCategoryRef, {
      ...categoryData,
      wallpaperCount: 0,
      createdAt: new Date().toISOString()
    });
    return newCategoryRef.key;
  }
};

// Analytics operations
export const analyticsOperations = {
  // Track download
  async trackDownload(wallpaperId: string, userId: string, metadata: Record<string, unknown> = {}) {
    const downloadsRef = ref(realtimeDb, `downloads/${wallpaperId}`);
    const newDownloadRef = push(downloadsRef);
    await set(newDownloadRef, {
      userId,
      downloadDate: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      ...metadata
    });
  },

  // Track view
  async trackView(wallpaperId: string, userId: string = 'anonymous', metadata: Record<string, unknown> = {}) {
    const viewsRef = ref(realtimeDb, `views/${wallpaperId}`);
    const newViewRef = push(viewsRef);
    await set(newViewRef, {
      userId,
      viewDate: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      ...metadata
    });
  },

  // Track search
  async trackSearch(query: string, userId: string, resultsCount: number) {
    const searchRef = ref(realtimeDb, 'searchAnalytics');
    const newSearchRef = push(searchRef);
    await set(newSearchRef, {
      query,
      userId,
      timestamp: new Date().toISOString(),
      resultsCount
    });
  },

  // Track user activity
  async trackUserActivity(userId: string, action: string, metadata: Record<string, unknown> = {}) {
    const activityRef = ref(realtimeDb, 'userActivity');
    const newActivityRef = push(activityRef);
    await set(newActivityRef, {
      userId,
      action,
      timestamp: new Date().toISOString(),
      metadata
    });
  }
};

// Admin operations
export const adminOperations = {
  // Check if user is admin
  async isAdmin(uid: string) {
    const adminRef = ref(realtimeDb, `admins/${uid}`);
    const snapshot = await get(adminRef);
    return snapshot.exists() && snapshot.val() === true;
  },

  // Get all pending uploads for moderation
  async getPendingUploads() {
    const uploadsRef = ref(realtimeDb, 'userUploads');
    const snapshot = await get(uploadsRef);
    
    if (!snapshot.exists()) return {};
    
    const allUploads = snapshot.val();
    const pendingUploads: Record<string, unknown> = {};
    
    // Filter pending uploads across all users
    Object.keys(allUploads).forEach(uid => {
      const userUploads = allUploads[uid] as Record<string, Record<string, unknown>>;
      Object.keys(userUploads).forEach(uploadId => {
        const upload = userUploads[uploadId];
        if ((upload.status as string) === 'pending') {
          if (!pendingUploads[uid]) pendingUploads[uid] = {};
          (pendingUploads[uid] as Record<string, unknown>)[uploadId] = upload;
        }
      });
    });
    
    return pendingUploads;
  },

  // Get app settings
  async getSettings() {
    const settingsRef = ref(realtimeDb, 'settings');
    const snapshot = await get(settingsRef);
    return snapshot.exists() ? snapshot.val() : {};
  },

  // Update app settings
  async updateSettings(updates: Record<string, unknown>) {
    const settingsRef = ref(realtimeDb, 'settings');
    await update(settingsRef, updates);
  }
};

// Report operations
export const reportOperations = {
  // Submit report
  async submitReport(wallpaperId: string, reportedBy: string, reason: string, description: string) {
    const reportsRef = ref(realtimeDb, 'reports');
    const newReportRef = push(reportsRef);
    await set(newReportRef, {
      wallpaperId,
      reportedBy,
      reason,
      description,
      status: 'pending',
      reportDate: new Date().toISOString()
    });
    return newReportRef.key;
  },

  // Get all reports (admin only)
  async getAllReports() {
    const reportsRef = ref(realtimeDb, 'reports');
    const snapshot = await get(reportsRef);
    return snapshot.exists() ? snapshot.val() : {};
  },

  // Update report status
  async updateReportStatus(reportId: string, status: string, reviewedBy: string) {
    const reportRef = ref(realtimeDb, `reports/${reportId}`);
    await update(reportRef, {
      status,
      reviewedBy,
      reviewDate: new Date().toISOString()
    });
  }
};

// Helper function to convert Firebase object to array
export const objectToArray = (firebaseObject: Record<string, unknown> | null) => {
  if (!firebaseObject) return [];
  return Object.keys(firebaseObject).map(key => ({
    id: key,
    ...(firebaseObject[key] as Record<string, unknown>)
  }));
};

// Helper function to get paginated data
export const getPaginatedData = async (
  path: string, 
  orderBy: string = 'createdAt', 
  limit: number = 20, 
  startAfter?: string
) => {
  const dbRef = ref(realtimeDb, path);
  let dataQuery = query(dbRef, orderByChild(orderBy), limitToFirst(limit));
  
  if (startAfter) {
    dataQuery = query(dbRef, orderByChild(orderBy), startAt(startAfter), limitToFirst(limit + 1));
  }
  
  const snapshot = await get(dataQuery);
  const data = snapshot.exists() ? snapshot.val() : {};
  
  return {
    data: objectToArray(data),
    hasMore: Object.keys(data).length > limit
  };
};
