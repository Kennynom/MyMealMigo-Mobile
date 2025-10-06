"use client";

import { db } from "@/config/firebase";
import type { User } from "firebase/auth";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (u: User | null) => {
      if (cancelled) return;

      setUser(u);

      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (!cancelled) {
            const data = (snap.data() ?? {}) as FirestoreUserDoc;
            const role = typeof data.role === "string" ? data.role.toLowerCase() : "";
            const subscriptionPlan = data.subscription?.plan || "";
            const subscriptionActive = data.subscription?.active || false;
            
            // Determine user role based on Firebase data
            let finalRole: UserRole = 'guest';
            if (role === 'admin') {
              finalRole = 'admin';
            } else if (role === 'nutritionist') {
              finalRole = 'nutritionist';
            } else if (subscriptionActive && subscriptionPlan === 'premium') {
              finalRole = 'premium';
            } else if (subscriptionActive && subscriptionPlan === 'free') {
              finalRole = 'free';
            } else {
              finalRole = 'guest';
            }
            
            setUserRole(finalRole);
          }
        } catch {
          if (!cancelled) setUserRole('guest');
        }
      } else {
        setUserRole('guest');
      }

      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      try {
        unsub(); // ensure we detach the listener
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

