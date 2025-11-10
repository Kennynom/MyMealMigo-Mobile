// hooks/usePremiumStatus.js
import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';

/**
 * Hook to check if the current user has premium access
 * @returns {Object} { isPremium: boolean, isLoading: boolean, userRole: string }
 */
export function usePremiumStatus() {
  const { userRole, loading } = useAuth();

  const isPremium = useMemo(() => {
    // Premium access for: premium, admin, nutritionist roles
    return userRole === 'premium' || userRole === 'admin' || userRole === 'nutritionist';
  }, [userRole]);

  return {
    isPremium,
    isLoading: loading,
    userRole,
    isFree: userRole === 'free',
    isGuest: userRole === 'guest',
  };
}
