// config/firebase.js - Platform-safe Firebase config
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// Your real Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDq6YNdszu-gz_Ka2NNm0K8aVI7NBHrv2Y",
  authDomain: "test-6411d.firebaseapp.com",
  projectId: "test-6411d",
  storageBucket: "test-6411d.firebasestorage.app",
  messagingSenderId: "536257385862",
  appId: "1:536257385862:web:a364d29bac52f80838c807",
  measurementId: "G-QPTCXG06PL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);

// Only initialize analytics on web platform
let analytics = null;
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    const { getAnalytics } = require("firebase/analytics");
    analytics = getAnalytics(app);
  } catch (error) {
    console.log('Analytics not available:', error);
  }
}

export { analytics };
export default app;