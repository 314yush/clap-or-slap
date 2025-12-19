'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { detectEnvironment } from '@/lib/environment';

declare global {
  interface Window {
    __caporslapMiniAppState?: MiniAppState;
  }
}

type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

// Keep this intentionally loose so we don't couple to SDK types.
export type FarcasterMiniAppContext = {
  user?: {
    fid?: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  client?: {
    safeAreaInsets?: SafeAreaInsets;
  };
};

export type MiniAppState = {
  isMiniApp: boolean;
  isReady: boolean;
  context: FarcasterMiniAppContext | null;
  error: string | null;
};

const MiniAppContext = createContext<MiniAppState>({
  isMiniApp: false,
  isReady: true,
  context: null,
  error: null,
});

export function MiniAppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MiniAppState>({
    isMiniApp: false,
    isReady: false,
    context: null,
    error: null,
  });

  useEffect(() => {
    const debug =
      typeof window !== 'undefined' &&
      new URL(window.location.href).searchParams.has('debugMiniApp');

    let cancelled = false;

    async function init() {
      try {
        // Always try to import and use the SDK - it will handle non-miniapp contexts gracefully
        const mod = await import('@farcaster/miniapp-sdk');
        const sdk = mod.sdk as {
          actions?: { ready?: () => Promise<void> };
          context?: unknown | (() => Promise<unknown>);
        };

        // Signal ready FIRST to hide the splash screen ASAP
        try {
          await sdk.actions?.ready?.();
        } catch {
          // Not in a mini-app context, that's fine
        }

        // Fetch context if available (some clients may not provide it).
        let context: unknown = null;
        let isMiniApp = false;
        try {
          const maybeContext = sdk.context;
          context =
            typeof maybeContext === 'function'
              ? await maybeContext()
              : await Promise.resolve(maybeContext);
          // If we got context, we're in a mini-app
          isMiniApp = context !== null && context !== undefined;
        } catch {
          context = null;
        }

        // Also check environment detection as fallback
        if (!isMiniApp) {
          isMiniApp = detectEnvironment() === 'miniapp';
        }

        if (cancelled) return;

        const nextState: MiniAppState = {
          isMiniApp,
          isReady: true,
          context: (context as FarcasterMiniAppContext) ?? null,
          error: null,
        };
        if (debug) {
          window.__caporslapMiniAppState = nextState;
          console.info('[MiniApp]', nextState);
        }
        setState(nextState);
      } catch (e) {
        if (cancelled) return;
        // SDK import failed - we're likely in web context
        const nextState: MiniAppState = {
          isMiniApp: false,
          isReady: true,
          context: null,
          error: null,
        };
        if (debug) {
          window.__caporslapMiniAppState = nextState;
          console.info('[MiniApp] SDK not available, running as web:', e);
        }
        setState(nextState);
      }
    }

    // Start initialization immediately
    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return <MiniAppContext.Provider value={value}>{children}</MiniAppContext.Provider>;
}

export function useMiniApp(): MiniAppState {
  return useContext(MiniAppContext);
}


