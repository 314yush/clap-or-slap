'use client';

import { useAuth } from '@/hooks';
import { GameScreen } from '@/components/game';
import { LandingPage } from '@/components/landing';
import { useState } from 'react';

export default function Home() {
  const { isReady, playAsGuest } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);
  
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
  
  // Show game only after user explicitly starts it from landing page
  if (gameStarted) {
    return <GameScreen />;
  }
  
  // Always show landing page first - everyone sees it
  return <LandingPage onPlayAsGuest={playAsGuest} onConnect={() => setGameStarted(true)} />;
}
