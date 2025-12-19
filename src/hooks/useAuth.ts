'use client';

import { useState, useEffect, useCallback } from 'react';
import { resolveIdentity, ResolvedIdentity } from '@/lib/auth/identity-resolver';
import { useMiniApp } from '@/components/providers/MiniAppProvider';
import { trackWalletConnect } from '@/lib/analytics';

export interface AuthState {
  // Connection state
  isReady: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // User info
  address: string | null;
  identity: ResolvedIdentity | null;
  
  // Auth methods
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Guest mode (not used in mini-app but kept for API compatibility)
  isGuest: boolean;
  playAsGuest: () => void;
}

// EIP-1193 Provider type (Base smart account injected by Base app)
export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

// Get injected Ethereum provider (Base smart account)
export function getInjectedProvider(): Eip1193Provider | null {
  if (typeof window === 'undefined') return null;
  const eth = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  if (!eth || typeof eth.request !== 'function') return null;
  return eth;
}

export function useAuth(): AuthState {
  const { isReady: miniAppReady } = useMiniApp();
  
  const [address, setAddress] = useState<string | null>(null);
  const [identity, setIdentity] = useState<ResolvedIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Mark as ready when mini-app SDK is ready
  // Don't auto-connect - always show landing page first per user requirement
  useEffect(() => {
    if (miniAppReady) {
      setIsReady(true);
    }
  }, [miniAppReady]);
  
  // Resolve identity when address changes
  useEffect(() => {
    async function resolve() {
      if (!address) {
        setIdentity(null);
        return;
      }
      
      setIsLoading(true);
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
        setIsLoading(false);
      }
    }
    
    resolve();
  }, [address]);
  
  // Handle login - request accounts from injected provider
  const login = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const provider = getInjectedProvider();
      if (!provider) {
        console.error('[useAuth] No wallet provider available');
        return false;
      }
      
      const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
      if (accounts?.[0]) {
        setAddress(accounts[0]);
        // Track wallet connection
        trackWalletConnect(accounts[0]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useAuth] Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Handle logout - just clear local state (can't actually disconnect in mini-app)
  const handleLogout = useCallback(async () => {
    setAddress(null);
    setIdentity(null);
    setIsGuest(false);
  }, []);
  
  // Play as guest - not really used in mini-app but kept for compatibility
  const playAsGuest = useCallback(() => {
    setIsGuest(true);
    setIdentity({
      address: 'guest',
      displayName: 'Guest',
      source: 'address',
    });
  }, []);
  
  return {
    isReady,
    isAuthenticated: !!address || isGuest,
    isLoading,
    address: isGuest ? 'guest' : address,
    identity,
    login,
    logout: handleLogout,
    isGuest,
    playAsGuest,
  };
}

/**
 * Hook to get just the user ID (address)
 * Useful for API calls
 */
export function useUserId(): string {
  const { address } = useAuth();
  return address || 'anonymous';
}




