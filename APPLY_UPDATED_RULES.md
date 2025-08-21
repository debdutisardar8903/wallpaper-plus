# Apply Updated Firebase Realtime Database Rules

The Firebase Realtime Database rules have been updated to support the wallpaper upload functionality. Please follow these steps to apply the new rules:

## Option 1: Firebase Console (Recommended)

1. **Open Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `wallpaper-plus-web`

2. **Navigate to Realtime Database**
   - Click on "Realtime Database" in the left sidebar
   - Click on the "Rules" tab

3. **Copy and Paste New Rules**
   - Copy the entire content from `firebase-realtime-database-rules.json`
   - Replace the existing rules in the Firebase Console
   - Click "Publish" to apply the changes

## Option 2: Firebase CLI

```bash
# Make sure you're logged in
firebase login

# Deploy the rules
firebase deploy --only database
```

## What Changed

The updated rules now include validation for:

- ✅ **s3Key** - S3 storage key for the uploaded image
- ✅ **author** - Display name of the user who uploaded
- ✅ **authorId** - User ID validation (must match authenticated user)
- ✅ **tags** - Proper object structure validation (not array)

## Test After Applying Rules

1. **Upload a wallpaper** in the "My Wallpapers" section
2. **Check browser console** for any error messages
3. **Verify in Firebase Console** that data appears in `userUploads/[your-uid]/`

## Debug Steps if Still Not Working

1. **Check Console Logs**
   - Open browser Developer Tools → Console
   - Look for any Firebase permission errors

2. **Temporary Permissive Rules** (for debugging only)
   - Use `firebase-debug-rules.json` temporarily
   - Apply it in Firebase Console
   - Test upload functionality
   - **Remember to switch back to secure rules!**

3. **Verify User Authentication**
   - Make sure you're logged in
   - Check that `auth.uid` is available

## Security Notes

⚠️ **Important**: The debug rules (`firebase-debug-rules.json`) are for testing only and should NOT be used in production. They allow unrestricted access to authenticated users.

✅ **Secure**: The main rules (`firebase-realtime-database-rules.json`) enforce proper data validation and security constraints.
