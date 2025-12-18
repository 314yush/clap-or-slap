'use client';

import { useEffect, useState, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface MiniAppContext {
  isMiniApp: boolean;
  isReady: boolean;
  user: {
    fid?: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  } | null;
}

/**
 * Hook to detect and initialize the Farcaster Mini-App SDK
 * 
 * Usage:
 * - Call sdk.actions.ready() when app is ready to be displayed
 * - Check isMiniApp to conditionally render mini-app specific features
 * - Access user context from Farcaster/Base app
 */
export function useMiniApp() {
  const [context, setContext] = useState<MiniAppContext>({
    isMiniApp: false,
    isReady: false,
    user: null,
  });

  // Initialize the SDK and detect if running in mini-app environment
  useEffect(() => {
    const initMiniApp = async () => {
      try {
        // Check if we're in a mini-app environment
        // The SDK will throw or return null if not in mini-app context
        const appContext = await sdk.context;
        
        if (appContext) {
          setContext({
            isMiniApp: true,
            isReady: false,
            user: appContext.user ? {
              fid: appContext.user.fid,
              username: appContext.user.username,
              displayName: appContext.user.displayName,
              pfpUrl: appContext.user.pfpUrl,
            } : null,
          });
        }
      } catch {
        // Not in mini-app environment, running as regular web app
        setContext({
          isMiniApp: false,
          isReady: true,
          user: null,
        });
      }
    };

    initMiniApp();
  }, []);

  // Call ready() to hide splash screen and display app
  const ready = useCallback(async () => {
    if (context.isMiniApp && !context.isReady) {
      try {
        await sdk.actions.ready();
        setContext(prev => ({ ...prev, isReady: true }));
      } catch (error) {
        console.error('Failed to call sdk.actions.ready():', error);
        setContext(prev => ({ ...prev, isReady: true }));
      }
    }
  }, [context.isMiniApp, context.isReady]);

  // Auto-ready after a short delay if in mini-app context
  useEffect(() => {
    if (context.isMiniApp && !context.isReady) {
      // Small delay to ensure app content is rendered
      const timer = setTimeout(() => {
        ready();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [context.isMiniApp, context.isReady, ready]);

  return {
    ...context,
    ready,
    sdk,
  };
}

export default useMiniApp;
