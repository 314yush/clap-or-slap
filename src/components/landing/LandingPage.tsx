'use client';

import { ConnectButton, GuestPlayButton } from '@/components/auth/ConnectButton';

interface LandingPageProps {
  onPlayAsGuest: () => void;
}

export function LandingPage({ onPlayAsGuest }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-zinc-950 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
        {/* Logo/Title */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">
            Cap<span className="text-amber-400">Or</span>Slap
          </h1>
          <div className="mt-2 text-sm text-zinc-500 uppercase tracking-widest">
            Higher or Lower • Crypto Edition
          </div>
        </div>
        
        {/* Tagline */}
        <p className="text-xl md:text-2xl text-zinc-300 mb-12 leading-relaxed">
          Guess the market cap.
          <br />
          <span className="text-amber-400 font-semibold">Beat your streak.</span>
        </p>
        
        {/* Game preview illustration */}
        <div className="w-full mb-12 relative">
          <div className="flex justify-center gap-4">
            {/* Token card previews */}
            <div className="w-24 h-32 rounded-xl bg-zinc-800/50 border border-zinc-700 flex flex-col items-center justify-center p-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 mb-2" />
              <span className="text-xs font-bold text-white">ETH</span>
              <span className="text-[10px] text-amber-400">$2.1T</span>
            </div>
            
            <div className="flex items-center">
              <span className="text-2xl font-bold text-zinc-600">VS</span>
            </div>
            
            <div className="w-24 h-32 rounded-xl bg-zinc-800/50 border border-zinc-700 flex flex-col items-center justify-center p-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 mb-2" />
              <span className="text-xs font-bold text-white">SOL</span>
              <span className="text-[10px] text-amber-400 animate-pulse">?</span>
            </div>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-4 w-full">
          <ConnectButton className="w-full max-w-xs" size="lg" />
          <GuestPlayButton onClick={onPlayAsGuest} />
        </div>
        
        {/* Stats teaser */}
        <div className="mt-12 flex gap-8 text-center">
          <div>
            <div className="text-2xl font-bold text-white">80+</div>
            <div className="text-xs text-zinc-500">Tokens</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">∞</div>
            <div className="text-xs text-zinc-500">Streaks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">🔥</div>
            <div className="text-xs text-zinc-500">Compete</div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-6 text-xs text-zinc-600">
        Built for degens • Data from CoinGecko
      </div>
    </div>
  );
}


