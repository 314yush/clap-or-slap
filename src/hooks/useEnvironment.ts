'use client';

import { useState, useEffect } from 'react';
import { Environment } from '@/lib/game-core/types';
import { detectEnvironment, getEnvironmentConfig } from '@/lib/environment';

/**
 * Hook for accessing the current runtime environment
 * Detects if running as web app or Farcaster Mini-App
 */
export function useEnvironment() {
  const [environment, setEnvironment] = useState<Environment>('web');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Detect environment on client
    const detected = detectEnvironment();
    setEnvironment(detected);
    setIsLoaded(true);
  }, []);

  const config = getEnvironmentConfig();

  return {
    environment,
    isLoaded,
    isMiniApp: environment === 'miniapp',
    isWeb: environment === 'web',
    config,
  };
}

