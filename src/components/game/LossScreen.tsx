'use client';

import { useState, useEffect } from 'react';
import { Run } from '@/lib/game-core/types';
import { formatMarketCap } from '@/lib/game-core/comparison';
import { shareRun, getSharePreview } from '@/lib/social/sharing';
import { canOfferReprieve, getReprieveCopy, getReprievePrice } from '@/lib/game-core/reprieve';

interface LossScreenProps {
  run: Run;
  lossExplanation: string | null;
  onWalkAway: () => void;
  onReprieve?: () => void;
  isLoading?: boolean;
}

export function LossScreen({ run, lossExplanation, onWalkAway, onReprieve, isLoading }: LossScreenProps) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Delay showing actions for dramatic effect
  useEffect(() => {
    const timer = setTimeout(() => setShowActions(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = async () => {
    setSharing(true);
    const success = await shareRun(run);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setSharing(false);
  };

  const showReprieve = canOfferReprieve(run.streak, run.usedReprieve);
  const reprieveCopy = showReprieve ? getReprieveCopy(run.streak) : null;
  const reprievePrice = getReprievePrice();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 px-6 overflow-y-auto py-8">
      {/* Dramatic vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50 pointer-events-none" />
      
      <div className="relative flex flex-col items-center gap-5 max-w-sm w-full">
        {/* Skull emoji */}
        <div className="text-5xl">💀</div>
        
        {/* Big streak number */}
        <div className="text-center">
          <div className="text-7xl font-black text-white tabular-nums">
            {run.streak}
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            You got rekt
          </div>
        </div>

        {/* Explanation */}
        {run.failedGuess && (
          <div className="w-full p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
            <p className="text-zinc-400 text-sm">
              You guessed{' '}
              <span className="text-white font-bold">
                {run.failedGuess.nextToken.symbol}
              </span>{' '}
              was{' '}
              <span className={run.failedGuess.guess === 'cap' ? 'text-emerald-400' : 'text-rose-400'}>
                {run.failedGuess.guess === 'cap' ? 'higher' : 'lower'}
              </span>
            </p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {run.failedGuess.currentToken.symbol}
                </div>
                <div className="text-sm text-emerald-400">
                  {formatMarketCap(run.failedGuess.currentToken.marketCap)}
                </div>
              </div>
              <div className="text-zinc-600 text-xl">→</div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {run.failedGuess.nextToken.symbol}
                </div>
                <div className="text-sm text-emerald-400">
                  {formatMarketCap(run.failedGuess.nextToken.marketCap)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="w-full flex flex-col gap-3 animate-fade-in">
            
            {/* REPRIEVE OPTION - Most prominent when available */}
            {showReprieve && reprieveCopy && onReprieve && (
              <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-amber-900/40 to-orange-900/40 border border-amber-600/50 relative overflow-hidden">
                {/* Candle glow effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
                
                <div className="relative flex flex-col items-center gap-3">
                  {/* Candle icon */}
                  <div className="text-4xl animate-pulse">{reprieveCopy.emoji}</div>
                  
                  {/* Title */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-amber-300">
                      {reprieveCopy.title}
                    </h3>
                    <p className="text-amber-200/70 text-sm mt-1">
                      {reprieveCopy.description}
                    </p>
                  </div>
                  
                  {/* Continue button */}
                  <button
                    onClick={onReprieve}
                    disabled={isLoading}
                    className="
                      w-full py-4 px-6 rounded-xl
                      bg-gradient-to-r from-amber-500 to-orange-500
                      hover:from-amber-400 hover:to-orange-400
                      text-white font-bold text-lg
                      shadow-lg shadow-amber-500/30
                      transform transition-all duration-200
                      hover:scale-[1.02] active:scale-[0.98]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2
                    "
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Continue for ${reprievePrice.toFixed(2)}
                      </>
                    )}
                  </button>
                  
                  {/* One-time note */}
                  <p className="text-amber-400/50 text-xs text-center">
                    One-time use per run • Your streak stays intact
                  </p>
                </div>
              </div>
            )}

            {/* Divider if reprieve is shown */}
            {showReprieve && (
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-zinc-600 text-xs">or</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
            )}

            {/* Share button */}
            <button
              onClick={handleShare}
              disabled={sharing}
              className="
                w-full py-4 px-6 rounded-2xl
                bg-gradient-to-br from-violet-500 to-purple-600
                text-white font-bold text-lg
                shadow-lg shadow-violet-500/25
                transform transition-all
                hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50
              "
            >
              {copied ? '✅ Copied!' : sharing ? 'Sharing...' : '📤 Share My L'}
            </button>

            {/* Walk Away button */}
            <button
              onClick={onWalkAway}
              className="
                w-full py-4 px-6 rounded-2xl
                bg-zinc-800 border border-zinc-700
                text-zinc-300 font-bold text-lg
                transform transition-all
                hover:bg-zinc-700 hover:text-white
                active:scale-[0.98]
              "
            >
              Walk Away
            </button>
          </div>
        )}

        {/* Share preview */}
        <div className="text-center text-xs text-zinc-600 mt-2">
          <p>{getSharePreview(run.streak)}</p>
        </div>
      </div>
    </div>
  );
}
