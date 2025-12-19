'use client';

import { useAuth } from '@/hooks';
import { GameScreen } from '@/components/game';
import { LandingPage } from '@/components/landing';
import { useState } from 'react';

export default function Home() {
  const { isReady, isAuthenticated, playAsGuest } = useAuth();
  const [forceGameStart, setForceGameStart] = useState(false);
  
  // Show loading while auth initializes
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
  
  // Always show landing page first - user clicks "Connect Wallet" to start game
  // Show game only after user explicitly connects
  if (forceGameStart || isAuthenticated) {
    return <GameScreen />;
  }
  
  // Show landing page (always shown first)
  return <LandingPage onPlayAsGuest={playAsGuest} onConnect={() => setForceGameStart(true)} />;
}
