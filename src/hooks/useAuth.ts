'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect, useCallback } from 'react';
import { resolveIdentity, ResolvedIdentity } from '@/lib/auth/identity-resolver';
import { useMiniApp } from '@/components/providers/MiniAppProvider';

export interface AuthState {
  // Connection state
  isReady: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // User info
  address: string | null;
  identity: ResolvedIdentity | null;
  
  // Auth methods
  login: () => void;
  logout: () => Promise<void>;
  
  // Guest mode (for playing without wallet)
  isGuest: boolean;
  playAsGuest: () => void;
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

// Get injected Ethereum provider (Base smart account in mini-app)
type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function getInjectedProvider(): Eip1193Provider | null {
  if (typeof window === 'undefined') return null;
  const eth = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  if (!eth || typeof eth.request !== 'function') return null;
  return eth;
}

export function useAuth(): AuthState {
  const { ready, authenticated, login: privyLogin, logout: privyLogout, user } = usePrivy();
  const { wallets } = useWallets();
  const { isMiniApp, isReady: miniAppReady } = useMiniApp();
  
  const [identity, setIdentity] = useState<ResolvedIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [miniAppAddress, setMiniAppAddress] = useState<string | null>(null);
  
  // Get the primary wallet address (Privy for web, injected for mini-app)
  const primaryWallet = wallets?.[0];
  const privyAddress = primaryWallet?.address || user?.wallet?.address || null;
  const address = isMiniApp ? miniAppAddress : privyAddress;
  
  // In mini-app: auto-connect to the injected Base smart account
  useEffect(() => {
    if (!isMiniApp || !miniAppReady) return;
    
    let cancelled = false;
    
    async function connectSmartAccount() {
      try {
        const provider = getInjectedProvider();
        if (!provider) {
          console.log('[useAuth] No injected provider found');
          return;
        }
        
        // Try to get existing accounts first
        const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
        if (accounts?.[0]) {
          if (!cancelled) setMiniAppAddress(accounts[0]);
          return;
        }
        
        // Request connection if not connected
        const requestedAccounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
        if (!cancelled && requestedAccounts?.[0]) {
          setMiniAppAddress(requestedAccounts[0]);
        }
      } catch (error) {
        console.error('[useAuth] Failed to connect smart account:', error);
      }
    }
    
    connectSmartAccount();
    
    return () => { cancelled = true; };
  }, [isMiniApp, miniAppReady]);
  
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
  
  // Handle login - use injected provider in mini-app, Privy otherwise
  const login = useCallback(() => {
    if (isMiniApp) {
      // Re-trigger smart account connection
      const provider = getInjectedProvider();
      if (provider) {
        provider.request({ method: 'eth_requestAccounts' })
          .then((accounts) => {
            const accountList = accounts as string[];
            if (accountList?.[0]) setMiniAppAddress(accountList[0]);
          })
          .catch(console.error);
      }
    } else {
      privyLogin();
    }
  }, [isMiniApp, privyLogin]);
  
  // Handle logout
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isMiniApp) {
        setMiniAppAddress(null);
      } else {
        await privyLogout();
      }
      setIdentity(null);
      setIsGuest(false);
    } finally {
      setIsLoading(false);
    }
  }, [isMiniApp, privyLogout]);
  
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
  
  return {
    isReady: isMiniApp ? miniAppReady : ready,
    isAuthenticated: (isMiniApp ? !!miniAppAddress : authenticated) || isGuest,
    isLoading,
    address: isGuest ? getGuestId() : address,
    identity,
    login,
    logout: handleLogout,
    isGuest,
    playAsGuest,
  };
}

/**
 * Hook to get just the user ID (address or guest ID)
 * Useful for API calls
 */
export function useUserId(): string {
  const { address, isGuest } = useAuth();
  
  if (isGuest) {
    return getGuestId();
  }
  
  return address || getGuestId();
}




