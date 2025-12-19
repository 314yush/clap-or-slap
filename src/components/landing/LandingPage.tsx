'use client';

import Image from 'next/image';
import { ConnectButton } from '@/components/auth/ConnectButton';
import { assets } from '@/lib/branding';
import { useMiniApp } from '@/components/providers/MiniAppProvider';

interface LandingPageProps {
  onPlayAsGuest: () => void;
}

export function LandingPage({ onPlayAsGuest }: LandingPageProps) {
  const { isMiniApp } = useMiniApp();
  
  return (
    <div className="h-screen flex flex-col items-center justify-center px-0 sm:px-4 md:px-6 bg-black relative overflow-hidden">
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-6xl px-4">
        {/* Logo */}
        <div className="mb-4 sm:mb-6 w-full">
          <div className="relative w-full max-w-[220px] sm:max-w-xs md:max-w-sm mx-auto">
            <Image
              src={assets.logos.wordmark}
              alt="CapOrSlap"
              width={500}
              height={200}
              priority
              className="w-full h-auto"
            />
          </div>
        </div>
        
        {/* Tagline */}
        <div className="mb-4 sm:mb-6 w-full">
          <p className="text-sm sm:text-base md:text-lg text-white mb-1">
            Guess the market cap.
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-black text-yellow-400 leading-tight">
            BEAT YOUR STREAK.
          </p>
        </div>
        
        {/* Main Character Image - Hero */}
        <div className="w-full mb-4 sm:mb-6 flex justify-center">
          <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg">
            <Image
              src="/images/branding/characters/characters.png"
              alt="Crypto characters ready to battle"
              width={600}
              height={300}
              className="w-full h-auto object-contain"
              priority
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-3 w-full mb-4">
          <ConnectButton className="w-full max-w-[280px]" size="lg" />
          {/* Hide guest option in mini-app - users should connect their Base account */}
          {!isMiniApp && (
            <button
              onClick={onPlayAsGuest}
              className="text-xs sm:text-sm text-white/80 hover:text-white underline underline-offset-4 transition-colors"
            >
              or play as guest
            </button>
          )}
        </div>
        
        {/* Simple Stats Row */}
        <div className="flex items-center justify-center gap-6 text-center">
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">80+</div>
            <div className="text-[10px] text-zinc-500 uppercase">Tokens</div>
          </div>
          <div className="w-px h-8 bg-zinc-700" />
          <div>
            <div className="text-xl sm:text-2xl font-black text-yellow-400">∞</div>
            <div className="text-[10px] text-zinc-500 uppercase">Streaks</div>
          </div>
          <div className="w-px h-8 bg-zinc-700" />
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">🔥</div>
            <div className="text-[10px] text-zinc-500 uppercase">Compete</div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-2 sm:bottom-3 left-0 right-0 text-center text-[9px] text-zinc-600">
        Built for degens • Data from CoinGecko
      </div>
    </div>
  );
}


