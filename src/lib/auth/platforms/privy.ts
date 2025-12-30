/**
 * Privy Auth Provider Implementation
 * Desktop-specific authentication using Privy
 */

'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCallback, useMemo } from 'react';
import type { AuthProvider, PlatformUser } from '../types';
import { resolveIdentity } from '../identity-resolver';

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

/**
 * Privy Auth Provider Hook
 * Returns an AuthProvider-compatible interface for Privy authentication
 */
export function usePrivyAuthProvider(): AuthProvider {
  const { ready, authenticated, login: privyLogin, logout: privyLogout, user } = usePrivy();
  const { wallets } = useWallets();
  
  // Get the primary wallet address
  const primaryWallet = wallets?.[0];
  const address = primaryWallet?.address || user?.wallet?.address || null;
  
  // Normalize userId: wallet address || Privy ID || guest ID
  const userId = useMemo(() => {
    if (address) {
      return address;
    }
    if (user?.id) {
      return String(user.id);
    }
    return getGuestId();
  }, [address, user?.id]);
  
  // Convert Privy user to PlatformUser format
  const platformUser: PlatformUser | null = useMemo(() => {
    if (!authenticated && !address) {
      return null;
    }
    
    // Guest mode (handled separately in useAuth, but included for completeness)
    if (!address && !user) {
      const guestId = getGuestId();
      return {
        userId: guestId,
        displayName: 'Guest',
        platform: 'anonymous',
      };
    }
    
    // Authenticated user
    return {
      userId: userId,
      displayName: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'User',
      avatarUrl: undefined, // Will be resolved via identity resolver if needed
      platform: 'privy',
      walletAddress: address || undefined,
    };
  }, [authenticated, address, user, userId]);
  
  // Login handler
  const login = useCallback(async () => {
    await privyLogin();
  }, [privyLogin]);
  
  // Logout handler
  const logout = useCallback(() => {
    privyLogout();
  }, [privyLogout]);
  
  return {
    isReady: ready,
    isAuthenticated: authenticated || false,
    isLoading: !ready,
    userId: authenticated || address ? userId : null,
    user: platformUser,
    token: null, // Privy doesn't use tokens in the same way
    login,
    logout,
  };
}

/**
 * Factory function to create Privy auth provider
 * Returns the hook function for use in useAuth
 */
export function createPrivyAuthProvider() {
  return usePrivyAuthProvider;
}

