'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/lib/game-core/types';
import { 
  getOrCreateUser, 
  updateDisplayName, 
  clearStoredUser,
  isAnonymous 
} from '@/lib/identity';

/**
 * Hook for managing user identity
 * Handles anonymous users with localStorage persistence
 */
export function useIdentity() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadedUser = getOrCreateUser();
    setUser(loadedUser);
    setIsLoading(false);
  }, []);

  // Update display name
  const setDisplayName = useCallback((name: string) => {
    const updated = updateDisplayName(name);
    setUser(updated);
  }, []);

  // Reset user (for testing)
  const resetUser = useCallback(() => {
    clearStoredUser();
    const newUser = getOrCreateUser();
    setUser(newUser);
  }, []);

  return {
    user,
    isLoading,
    isAnonymous: user ? isAnonymous(user) : true,
    userId: user?.userId || '',
    displayName: user?.displayName || 'Anonymous',
    setDisplayName,
    resetUser,
  };
}

