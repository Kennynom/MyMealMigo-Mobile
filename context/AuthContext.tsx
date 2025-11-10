"use client";

import { db } from "@/config/firebase";
import type { User } from "firebase/auth";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type UserRole = 'guest' | 'free' | 'premium' | 'admin' | 'nutritionist';

type AuthCtx = {
  user: User | null;
  loading: boolean;
  userRole: UserRole;
  isAdmin: boolean;
  isNutritionist: boolean;
  canAccessWeb: boolean;
  canAccessMobile: boolean;
  logout: () => Promise<void>;
};

type FirestoreUserDoc = {
  role?: string;
  subscription?: {
    plan?: string;
    active?: boolean;
  };
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  userRole: 'guest',
  isAdmin: false,
  isNutritionist: false,
  canAccessWeb: false,
  canAccessMobile: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState(true);

  // Derived states
  const isAdmin = userRole === 'admin';
  const isNutritionist = userRole === 'nutritionist';
  const canAccessWeb = isAdmin || isNutritionist;
  const canAccessMobile = userRole === 'guest' || userRole === 'free' || userRole === 'premium';

  const logout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let unsubscribeFirestore: (() => void) | null = null;
    const auth = getAuth();

    const unsubAuth = onAuthStateChanged(auth, async (u: User | null) => {
      if (cancelled) return;

      setUser(u);

      // Clean up previous Firestore listener
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (u) {
        // Set up real-time listener for user document
        try {
          const userDocRef = doc(db, "users", u.uid);
          
          unsubscribeFirestore = onSnapshot(
            userDocRef,
            (snap) => {
              if (cancelled) return;
              
              const data = (snap.data() ?? {}) as FirestoreUserDoc;
              const role = typeof data.role === "string" ? data.role.toLowerCase() : "";
              
              // Determine user role based on Firebase data
              let finalRole: UserRole = 'guest';
              if (role === 'admin') {
                finalRole = 'admin';
              } else if (role === 'nutritionist') {
                finalRole = 'nutritionist';
              } else if (role === 'premium') {
                finalRole = 'premium';
              } else if (role === 'free') {
                finalRole = 'free';
              } else {
                finalRole = 'guest';
              }
              
              console.log('🔄 [AUTH] Role updated in real-time:', finalRole);
              setUserRole(finalRole);
            },
            (error) => {
              console.error('❌ [AUTH] Error listening to user doc:', error);
              if (!cancelled) setUserRole('guest');
            }
          );
        } catch (error) {
          console.error('❌ [AUTH] Error setting up listener:', error);
          if (!cancelled) setUserRole('guest');
        }
      } else {
        setUserRole('guest');
      }

      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
      try {
        unsubAuth();
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      userRole,
      isAdmin, 
      isNutritionist,
      canAccessWeb,
      canAccessMobile,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { AuthContext };

