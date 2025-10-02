'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getClientAuth, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const auth = await getClientAuth();
      if (!auth) return;

      unsub = onAuthStateChanged(auth, async (user) => {
        if (cancelled) return;

        // Not signed in → to /login
        if (!user) {
          router.replace('/login');
          return;
        }

        // If not verified → send them to verify (preserve where to go next)
        if (!user.emailVerified) {
          if (!pathname.startsWith('/verify-email')) {
            const next = encodeURIComponent('/account/health');
            router.replace(`/verify-email?next=${next}`);
          }
          return;
        }

        // After verified: force the health wizard until it's completed
        try {
          const hpRef = doc(db, 'users', user.uid, 'private', 'health_profile'); // ← fixed path
          const hpSnap = await getDoc(hpRef);
          const completed = hpSnap.exists() && hpSnap.data()?.completed === true;

          if (!completed && !pathname.startsWith('/account/health')) {
            router.replace('/account/health');
            return;
          }
        } catch {
          // If profile read fails, still force to wizard
          if (!pathname.startsWith('/account/health')) {
            router.replace('/account/health');
            return;
          }
        }

        setReady(true);
      });
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [router, pathname]);

  if (!ready) return null;
  return <>{children}</>;
}
