'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { resolveIdentity, ResolvedIdentity } from '@/lib/auth/identity-resolver';
import { usePrivyAuthProvider } from '@/lib/auth/platforms/privy';
import type { PlatformUser } from '@/lib/auth/types';

export interface AuthState {
  // Connection state
  isReady: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // User info (backward compatible)
  address: string | null;
  identity: ResolvedIdentity | null;
  
  // Auth methods
  login: () => void;
  logout: () => Promise<void>;
  
  // Guest mode (for playing without wallet)
  isGuest: boolean;
  playAsGuest: () => void;
  
  // New unified fields (auth abstraction)
  userId: string | null;
  platformUser: PlatformUser | null;
}

// Generate anonymous user ID for guests
function getGuestId(): string {
  if (typeof window === 'undefined') return '';
  
  let guestId = localStorage.getItem('caporslap_guest_id');
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('caporslap_guest_id', guestId);
  }
  return guestId;
}

export function useAuth(): AuthState {
  // Use the abstraction layer
  const authProvider = usePrivyAuthProvider();
  
  const [identity, setIdentity] = useState<ResolvedIdentity | null>(null);
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  
  // Get address from auth provider (for backward compatibility)
  const address = useMemo(() => {
    if (isGuest) {
      return getGuestId();
    }
    return authProvider.user?.walletAddress || authProvider.userId || null;
  }, [authProvider.user, authProvider.userId, isGuest]);
  
  // Resolve identity when address changes (for backward compatibility)
  useEffect(() => {
    async function resolve() {
      // Skip resolution for guest mode or if no address
      if (isGuest || !address || address.startsWith('guest_')) {
        if (isGuest) {
          setIdentity({
            address: getGuestId(),
            displayName: 'Guest',
            source: 'address',
          });
        } else {
          setIdentity(null);
        }
        return;
      }
      
      setIsLoadingIdentity(true);
      try {
        const resolved = await resolveIdentity(address);
        setIdentity(resolved);
      } catch (error) {
        console.error('[useAuth] Identity resolution failed:', error);
        setIdentity({
          address,
          displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
          source: 'address',
        });
      } finally {
        setIsLoadingIdentity(false);
      }
    }
    
    resolve();
  }, [address, isGuest]);
  
  // Update platformUser with resolved identity
  const platformUser: PlatformUser | null = useMemo(() => {
    if (!authProvider.user) {
      if (isGuest) {
        return {
          userId: getGuestId(),
          displayName: 'Guest',
          platform: 'anonymous',
        };
      }
      return null;
    }
    
    // Enhance platformUser with resolved identity if available
    return {
      ...authProvider.user,
      displayName: identity?.displayName || authProvider.user.displayName,
      avatarUrl: identity?.avatarUrl || authProvider.user.avatarUrl,
    };
  }, [authProvider.user, identity, isGuest]);
  
  // Wrap login to match AuthState signature (void instead of Promise<void>)
  const handleLogin = useCallback(() => {
    authProvider.login().catch((error) => {
      console.error('[useAuth] Login failed:', error);
    });
  }, [authProvider]);
  
  // Handle logout
  const handleLogout = useCallback(async () => {
    setIsLoadingIdentity(true);
    try {
      authProvider.logout();
      setIdentity(null);
      setIsGuest(false);
    } finally {
      setIsLoadingIdentity(false);
    }
  }, [authProvider]);
  
  // Play as guest (no wallet)
  const playAsGuest = useCallback(() => {
    const guestId = getGuestId();
    setIsGuest(true);
    setIdentity({
      address: guestId,
      displayName: 'Guest',
      source: 'address',
    });
  }, []);
  
  // Get normalized userId (for backward compatibility with useUserId)
  const userId = useMemo(() => {
    if (isGuest) {
      return getGuestId();
    }
    return authProvider.userId || null;
  }, [authProvider.userId, isGuest]);
  
  return {
    // Backward compatible fields
    isReady: authProvider.isReady,
    isAuthenticated: authProvider.isAuthenticated || isGuest,
    isLoading: authProvider.isLoading || isLoadingIdentity,
    address: isGuest ? getGuestId() : address,
    identity,
    login: handleLogin,
    logout: handleLogout,
    isGuest,
    playAsGuest,
    
    // New unified fields
    userId,
    platformUser,
  };
}

/**
 * Hook to get just the user ID (address or guest ID)
 * Useful for API calls
 * Now uses normalized userId from auth abstraction
 */
export function useUserId(): string {
  const { userId, isGuest } = useAuth();
  
  if (isGuest) {
    return getGuestId();
  }
  
  return userId || getGuestId();
}


