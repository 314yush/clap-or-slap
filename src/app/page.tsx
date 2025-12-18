'use client';

import { useEffect } from 'react';
import { useAuth, useMiniApp } from '@/hooks';
import { GameScreen } from '@/components/game';
import { LandingPage } from '@/components/landing';

export default function Home() {
  const { isReady, isAuthenticated, playAsGuest } = useAuth();
  const { isMiniApp, ready } = useMiniApp();
  
  // Call SDK ready() when app is loaded (for Base mini-app)
  useEffect(() => {
    if (isMiniApp) {
      ready();
    }
  }, [isMiniApp, ready]);
  
  // Show loading while Privy initializes
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return <LandingPage onPlayAsGuest={playAsGuest} />;
  }
  
  // Show game if authenticated (wallet or guest)
  return <GameScreen />;
}
