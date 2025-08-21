// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAyp59KmtBlKBGjKZEw-1KvV8vSMSqna4c",
  authDomain: "wallpaper-plus-web.firebaseapp.com",
  databaseURL: "https://wallpaper-plus-web-default-rtdb.firebaseio.com",
  projectId: "wallpaper-plus-web",
  storageBucket: "wallpaper-plus-web.firebasestorage.app",
  messagingSenderId: "466730845630",
  appId: "1:466730845630:web:82bfe3a33588a09cf965ef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app); // Firestore database
export const realtimeDb = getDatabase(app); // Realtime Database
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
