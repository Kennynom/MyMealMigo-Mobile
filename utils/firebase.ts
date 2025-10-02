import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, type Auth, type User } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const app = getApps().length ? getApp() : initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
});

export const auth: Auth = getAuth(app);

// 👇 Avoid watch-stream assertion issues
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  // useFetchStreams: false, // uncomment if your network environment is strict
});

export const storage = getStorage(app);
export const getClientAuth = (): Auth => auth;
export const onAuthStateChangedClient = (cb: (u: User | null) => void) =>
  (typeof window === "undefined" ? () => {} : onAuthStateChanged(auth, cb));
