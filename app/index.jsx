import { router } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
    const auth = getAuth();
    const sub = onAuthStateChanged(auth, (user) => {
      if (user) {
        // already logged in -> app
        router.replace('/(tabs)/(home)');
      } else {
        // signed out -> landing
        router.replace('/(auth)/landing');
      }
    });
    return () => sub();
  }, []);

  return null; // nothing to render; we just redirect
}
