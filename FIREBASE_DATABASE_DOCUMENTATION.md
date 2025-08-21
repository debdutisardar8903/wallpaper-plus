# Firebase Realtime Database Rules Documentation

## 🏗️ Database Structure Overview

This document explains the Firebase Realtime Database structure and security rules for the Wallpaper Plus website.

## 📊 Data Models

### 🔐 **Users** (`/users/{uid}`)
Stores user profile information and statistics.

```json
{
  "users": {
    "user_uid_here": {
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "gender": "male", // male, female, non-binary, prefer-not-to-say
      "photoURL": "https://...",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "stats": {
        "wallpapersUploaded": 5,
        "totalViews": 1250,
        "totalDownloads": 340
      }
    }
  }
}
```

**Security Rules:**
- ✅ Users can only read/write their own data
- ✅ Username validation: 3-30 chars, alphanumeric + underscore
- ✅ Email must match authenticated user's email
- ✅ Gender validation with predefined values

### 🖼️ **Wallpapers** (`/wallpapers/{wallpaperId}`)
Public wallpaper collection visible to all users.

```json
{
  "wallpapers": {
    "wallpaper_id_here": {
      "title": "Mountain Landscape",
      "imageUrl": "https://example.com/image.jpg",
      "category": "Nature",
      "resolution": "4K", // HD, FHD, 2K, 4K, 8K, or custom like 1920x1080
      "tags": ["mountain", "landscape", "nature"],
      "uploadedBy": "user_uid",
      "author": "John Doe",
      "downloads": 15420,
      "views": 25680,
      "featured": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Security Rules:**
- ✅ Read access: Public (all users)
- ✅ Write access: Admins only
- ✅ Image URL must start with https://
- ✅ Resolution format validation
- ✅ Tag validation (1-30 chars each)

### 📤 **User Uploads** (`/userUploads/{uid}/{uploadId}`)
Wallpapers uploaded by users pending approval.

```json
{
  "userUploads": {
    "user_uid_here": {
      "upload_id_here": {
        "title": "My Wallpaper",
        "imageUrl": "https://storage.googleapis.com/...",
        "category": "Nature",
        "tags": ["custom", "personal"],
        "status": "pending", // pending, approved, rejected
        "uploadDate": "2024-01-15T10:30:00Z",
        "approvedAt": "2024-01-16T12:00:00Z",
        "approvedBy": "admin_uid",
        "rejectionReason": "Copyright violation",
        "views": 0,
        "downloads": 0
      }
    }
  }
}
```

**Security Rules:**
- ✅ Users can only access their own uploads
- ✅ Admins can read all uploads for moderation
- ✅ Status validation: pending/approved/rejected
- ✅ Title length: 1-100 characters

### ❤️ **Favorites** (`/favorites/{uid}/{wallpaperId}`)
User's favorite wallpapers collection.

```json
{
  "favorites": {
    "user_uid_here": {
      "wallpaper_id_here": {
        "wallpaperId": "wallpaper_id_here",
        "favoriteDate": "2024-01-15T10:30:00Z",
        "title": "Mountain Landscape",
        "imageUrl": "https://example.com/image.jpg",
        "category": "Nature",
        "author": "John Doe"
      }
    }
  }
}
```

**Security Rules:**
- ✅ Users can only access their own favorites
- ✅ Wallpaper ID validation
- ✅ Favorite date required
- ✅ Cached wallpaper info for performance

### 📁 **Categories** (`/categories/{categoryId}`)
Wallpaper categories managed by admins.

```json
{
  "categories": {
    "nature": {
      "name": "Nature",
      "slug": "nature",
      "description": "Beautiful landscapes and natural scenery",
      "thumbnailUrl": "https://example.com/nature-thumb.jpg",
      "wallpaperCount": 1247,
      "color": "#10B981",
      "featured": true,
      "order": 1
    }
  }
}
```

**Security Rules:**
- ✅ Read access: Public
- ✅ Write access: Admins only
- ✅ Slug validation: lowercase, numbers, hyphens only
- ✅ Color validation: hex format (#RRGGBB)

### 📊 **Download Tracking** (`/downloads/{wallpaperId}/{downloadId}`)
Track wallpaper downloads for analytics.

```json
{
  "downloads": {
    "wallpaper_id": {
      "download_id": {
        "userId": "user_uid",
        "downloadDate": "2024-01-15T10:30:00Z",
        "userAgent": "Mozilla/5.0...",
        "ipAddress": "192.168.1.1"
      }
    }
  }
}
```

### 👁️ **View Tracking** (`/views/{wallpaperId}/{viewId}`)
Track wallpaper views for popularity metrics.

```json
{
  "views": {
    "wallpaper_id": {
      "view_id": {
        "userId": "user_uid_or_anonymous",
        "viewDate": "2024-01-15T10:30:00Z",
        "userAgent": "Mozilla/5.0...",
        "ipAddress": "192.168.1.1"
      }
    }
  }
}
```

### 👑 **Admins** (`/admins/{uid}`)
List of admin users with elevated permissions.

```json
{
  "admins": {
    "admin_uid_here": true,
    "another_admin_uid": true
  }
}
```

**Security Rules:**
- ✅ Only admins can read/write admin list
- ✅ Values must be boolean true

### ⚙️ **Settings** (`/settings/`)
App-wide configuration and settings.

```json
{
  "settings": {
    "featuredWallpapers": ["wallpaper1", "wallpaper2"],
    "maxUploadsPerUser": 50,
    "allowedFileTypes": [".jpg", ".jpeg", ".png", ".webp"],
    "maxFileSize": 52428800,
    "maintenanceMode": false,
    "announcementBanner": {
      "enabled": true,
      "message": "Welcome to Wallpaper Plus!",
      "type": "info"
    }
  }
}
```

### 🔍 **Search Analytics** (`/searchAnalytics/{searchId}`)
Track search queries for improving search functionality.

```json
{
  "searchAnalytics": {
    "search_id": {
      "query": "mountain landscape",
      "userId": "user_uid",
      "timestamp": "2024-01-15T10:30:00Z",
      "resultsCount": 45
    }
  }
}
```

### 🚨 **Reports** (`/reports/{reportId}`)
User reports for inappropriate content.

```json
{
  "reports": {
    "report_id": {
      "wallpaperId": "wallpaper_id",
      "reportedBy": "user_uid",
      "reason": "copyright", // copyright, inappropriate, spam, other
      "description": "This image is copyrighted material",
      "status": "pending", // pending, reviewed, resolved
      "reportDate": "2024-01-15T10:30:00Z",
      "reviewedBy": "admin_uid",
      "reviewDate": "2024-01-16T09:00:00Z"
    }
  }
}
```

### 📝 **User Activity** (`/userActivity/{activityId}`)
Track user actions for admin monitoring.

```json
{
  "userActivity": {
    "activity_id": {
      "userId": "user_uid",
      "action": "upload", // login, logout, upload, download, favorite, search
      "timestamp": "2024-01-15T10:30:00Z",
      "metadata": {
        "wallpaperId": "wallpaper_id",
        "category": "Nature"
      }
    }
  }
}
```

## 🔒 Security Rules Summary

### **Authentication Requirements**
- Most operations require user authentication
- Public data (wallpapers, categories) readable by all
- User-specific data only accessible by the owner
- Admin operations require admin privileges

### **Data Validation**
- String length limits prevent spam/abuse
- Format validation (emails, URLs, slugs)
- Type validation (numbers, booleans, strings)
- Required field validation
- Enum validation for status fields

### **Access Control Levels**

| Collection | Public Read | User Read | User Write | Admin Read | Admin Write |
|-----------|-------------|-----------|------------|------------|-------------|
| wallpapers | ✅ | ✅ | ❌ | ✅ | ✅ |
| categories | ✅ | ✅ | ❌ | ✅ | ✅ |
| users | ❌ | Own data only | Own data only | ✅ | ✅ |
| userUploads | ❌ | Own data only | Own data only | ✅ | ✅ |
| favorites | ❌ | Own data only | Own data only | ✅ | ❌ |
| downloads | ✅ | ✅ | ✅ | ✅ | ✅ |
| views | ✅ | ✅ | ✅ | ✅ | ✅ |
| admins | ❌ | ❌ | ❌ | ✅ | ✅ |
| settings | ✅ | ✅ | ❌ | ✅ | ✅ |
| reports | ❌ | ❌ | Create only | ✅ | ✅ |
| searchAnalytics | ❌ | ❌ | Create only | ✅ | ❌ |
| userActivity | ❌ | ❌ | Create only | ✅ | ❌ |

## 🚀 Implementation Guide

### **Setting Up Rules**
1. Copy the rules from `firebase-realtime-database-rules.json`
2. Go to Firebase Console > Realtime Database > Rules
3. Paste the rules and publish
4. Test with Firebase Rules Playground

### **Admin Setup**
1. Add admin UIDs to `/admins/{uid}: true`
2. Only existing admins can add new admins
3. First admin must be added manually via Firebase Console

### **Data Migration**
If migrating from existing data:
1. Backup existing data
2. Transform data to match new structure
3. Apply rules gradually to test compatibility
4. Monitor for rule violations

### **Testing Rules**
Use Firebase Rules Playground to test:
- User authentication scenarios
- Admin operations
- Data validation
- Access control

## 🔧 Maintenance

### **Regular Tasks**
- Monitor rule violations in Firebase Console
- Review user reports and take action
- Update featured wallpapers
- Clean up old analytics data
- Monitor storage usage

### **Performance Optimization**
- Index frequently queried fields
- Implement pagination for large collections
- Cache category and featured wallpaper data
- Optimize image URLs for different resolutions

## 🆘 Troubleshooting

### **Common Issues**
1. **Permission Denied**: Check user authentication and admin status
2. **Validation Failed**: Verify data format matches validation rules
3. **Read Timeout**: Implement pagination for large data sets
4. **Write Conflicts**: Use transactions for concurrent updates

### **Debug Steps**
1. Check Firebase Console for detailed error messages
2. Verify user authentication status
3. Test rules in Firebase Rules Playground
4. Review data structure against validation rules
5. Check admin permissions for protected operations

This database structure provides a secure, scalable foundation for your wallpaper website with proper access controls, data validation, and admin functionality.
