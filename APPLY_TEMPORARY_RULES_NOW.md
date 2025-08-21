# 🚨 IMMEDIATE FIX: Apply Temporary Firebase Rules

## Quick Fix (2 minutes)

1. **Copy this JSON:**
```json
{
  "rules": {
    "userUploads": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid", 
        ".write": "$uid === auth.uid"
      }
    },
    "favorites": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

2. **Apply to Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `wallpaper-plus-web`
   - Navigate to **Realtime Database** → **Rules** tab
   - **Replace all existing rules** with the JSON above
   - Click **"Publish"**

3. **Test immediately:**
   - Go to your app
   - Try uploading a wallpaper
   - Should now save to database successfully

## After Testing Works
Once uploads work, you can apply the secure rules from `firebase-realtime-database-rules.json`

**⚠️ Important**: These temporary rules are less secure. Switch back to the main rules once everything is working.
