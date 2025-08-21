# Firebase Realtime Database Setup Guide

## 🚨 Fixing "PERMISSION_DENIED" Error

The permission denied error occurs because the Firebase Realtime Database rules haven't been configured yet. Follow these steps to fix it:

## Step 1: Apply Temporary Setup Rules

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `wallpaper-plus-web`
3. **Navigate to Realtime Database**: Left sidebar → Realtime Database
4. **Click on "Rules" tab**
5. **Replace the current rules** with these temporary setup rules:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

6. **Click "Publish"**

**⚠️ Important**: These are temporary rules that allow any authenticated user to read/write anything. We'll replace them with secure rules later.

## Step 2: Test Authentication

1. **Start your development server**: `npm run dev`
2. **Try to sign up/sign in** - the permission error should be gone
3. **Check browser console** for any remaining errors

## Step 3: Apply Secure Production Rules

Once authentication is working, replace the temporary rules with the secure production rules:

1. **Go back to Firebase Console → Realtime Database → Rules**
2. **Copy the contents** from `firebase-realtime-database-rules.json` in your project
3. **Paste and publish** the secure rules

## Step 4: Set Up Admin Access

1. **In Firebase Console, go to Realtime Database → Data**
2. **Click the "+" icon** next to the root to add data
3. **Add this structure**:
   ```
   Key: admins
   ```
   Then under `admins`, add:
   ```
   Key: YOUR_FIREBASE_UID_HERE
   Value: true (boolean)
   ```

To find your Firebase UID:
- Sign in to your app
- Open browser dev tools → Console
- Run: `firebase.auth().currentUser.uid`

## Step 5: Seed Initial Data

1. **Visit**: http://localhost:3000/admin
2. **Click "Seed Database"** to populate with sample data
3. **Verify data** was created in Firebase Console

## Alternative: Quick Fix with Firebase CLI

If you prefer using the command line:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init database

# Deploy rules
firebase deploy --only database
```

## Troubleshooting

### Still Getting Permission Denied?

1. **Check your database URL** in `src/lib/firebase.ts`:
   ```typescript
   databaseURL: "https://wallpaper-plus-web-default-rtdb.firebaseio.com"
   ```

2. **Verify authentication state** in browser dev tools:
   ```javascript
   // Check if user is authenticated
   firebase.auth().currentUser
   ```

3. **Check Firebase Console logs**:
   - Go to Firebase Console → Realtime Database → Usage
   - Look for denied requests

### Rules Not Taking Effect?

- Wait 1-2 minutes after publishing rules
- Clear browser cache and refresh
- Check if you're using the correct database instance

### Database URL Issues?

Make sure your database URL matches exactly:
- Format: `https://PROJECT_ID-default-rtdb.REGION.firebasedatabase.app`
- Your URL: `https://wallpaper-plus-web-default-rtdb.firebaseio.com`

## Final Security Rules Structure

Once everything is working, your final rules should include:

- **User data protection**: Users can only access their own data
- **Public wallpapers**: Read access for all, write access for admins only
- **Admin controls**: Special permissions for admin users
- **Data validation**: Type checking and format validation

The complete rules are in `firebase-realtime-database-rules.json`.

## Quick Commands Reference

```bash
# Check current user in browser console
firebase.auth().currentUser

# Test database connection
firebase.database().ref('.info/connected').once('value')

# Test write permission
firebase.database().ref('test').set('hello')
```

## Support

If you're still having issues:

1. **Check browser console** for detailed error messages
2. **Verify Firebase project configuration**
3. **Ensure billing is enabled** (for production usage)
4. **Check Firebase status**: https://status.firebase.google.com

---

**Next Steps After Setup:**
- Test user registration and login
- Test favorites functionality
- Test profile settings
- Review admin dashboard
- Add real wallpaper content
