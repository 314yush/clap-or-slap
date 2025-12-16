'use client';

import { useState, useEffect } from 'react';
import { Run } from '@/lib/game-core/types';
import { formatMarketCap } from '@/lib/game-core/comparison';
import { shareRun, getSharePreview } from '@/lib/social/sharing';
import { getReprieveState, getReprieveCopy, isReprieveFree, ReprieveType } from '@/lib/game-core/reprieve';
import { useReprievePayment, PaymentStatus } from '@/hooks/useReprievePayment';

interface LossScreenProps {
  run: Run;
  lossExplanation: string | null;
  onPlayAgain: () => void;
  onReprieveComplete: (method: 'paid' | 'share') => void;
  isWalletConnected?: boolean;
  userId: string;
  walletAddress?: string;
}

// Get status text for payment flow
function getStatusText(status: PaymentStatus): string {
  switch (status) {
    case 'confirming': return 'Confirm in wallet...';
    case 'pending': return 'Transaction pending...';
    case 'verifying': return 'Verifying payment...';
    case 'success': return 'Payment verified!';
    case 'error': return 'Payment failed';
    default: return '';
  }
}

// Share verification status
type ShareStatus = 'idle' | 'initiating' | 'waiting' | 'verifying' | 'success' | 'error';

export function LossScreen({ 
  run, 
  lossExplanation: _lossExplanation, 
  onPlayAgain, 
  onReprieveComplete, 
  isWalletConnected = false,
  userId,
  walletAddress,
}: LossScreenProps) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  
  // Share-to-reprieve state
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  
  // Payment hook
  const { 
    status: paymentStatus,
    isPaying, 
    error: paymentError, 
    txHash,
    payForReprieve,
    reset: resetPayment,
    price,
    currency,
    chainName,
  } = useReprievePayment();

  // Delay showing actions for dramatic effect
  useEffect(() => {
    const timer = setTimeout(() => setShowActions(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // When payment succeeds, trigger reprieve continuation
  useEffect(() => {
    if (paymentStatus === 'success') {
      const timer = setTimeout(() => {
        onReprieveComplete('paid');
        resetPayment();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, onReprieveComplete, resetPayment]);

  // When share verification succeeds, trigger reprieve continuation
  useEffect(() => {
    if (shareStatus === 'success') {
      const timer = setTimeout(() => {
        onReprieveComplete('share');
        setShareStatus('idle');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shareStatus, onReprieveComplete]);

  const handleShare = async () => {
    setSharing(true);
    const success = await shareRun(run);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setSharing(false);
  };

  // Handle paid reprieve
  const handlePaidReprieve = async () => {
    await payForReprieve(run.runId);
  };

  // Handle share-to-reprieve initiation
  const handleShareReprieve = async () => {
    setShareStatus('initiating');
    setShareError(null);
    
    try {
      const response = await fetch('/api/share/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          runId: run.runId,
          streak: run.streak,
          walletAddress,
          lastTokenSymbol: run.failedGuess?.nextToken.symbol,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setShareError(data.error || 'Failed to initiate share');
        setShareStatus('error');
        return;
      }
      
      setShareToken(data.token);
      
      // Open Warpcast share dialog
      window.open(data.shareUrl, '_blank');
      
      setShareStatus('waiting');
    } catch (error) {
      console.error('Share initiate error:', error);
      setShareError('Failed to initiate share');
      setShareStatus('error');
    }
  };

  // Handle "I shared it" verification
  const handleVerifyShare = async () => {
    if (!shareToken) return;
    
    setShareStatus('verifying');
    setShareError(null);
    
    try {
      const response = await fetch('/api/share/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: shareToken,
          walletAddress,
        }),
      });
      
      const data = await response.json();
      
      if (data.verified) {
        setShareStatus('success');
      } else {
        setShareError(data.error || 'Cast not found. Make sure to include "CapOrSlap" in your post.');
        setShareStatus('waiting'); // Stay in waiting state to retry
      }
    } catch (error) {
      console.error('Share verify error:', error);
      setShareError('Verification failed');
      setShareStatus('error');
    }
  };

  // Handle free reprieve (testing mode or guest)
  const handleFreeReprieve = (method: 'paid' | 'share' = 'paid') => {
    onReprieveComplete(method);
  };

  const reprieveState = getReprieveState(run.streak, run.usedReprieve);
  const reprieveCopy = reprieveState.available ? getReprieveCopy(run.streak, run.usedReprieve) : null;
  const isFree = isReprieveFree();
  
  // Determine reprieve type
  const reprieveType: ReprieveType = reprieveState.type;
  const isShareReprieve = reprieveType === 'share';
  const isPaidReprieve = reprieveType === 'paid';
  
  // For paid reprieve: only require payment if wallet connected and not free mode
  const requiresActualPayment = isPaidReprieve && isWalletConnected && !isFree;

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
            
            {/* SHARE REPRIEVE - for low streaks */}
            {isShareReprieve && reprieveCopy && (
              <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-violet-900/40 to-purple-900/40 border border-violet-600/50 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl" />
                
                <div className="relative flex flex-col items-center gap-3">
                  <div className="text-4xl">{reprieveCopy.emoji}</div>
                  
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-violet-300">
                      {reprieveCopy.title}
                    </h3>
                    <p className="text-violet-200/70 text-sm mt-1">
                      {reprieveCopy.description}
                    </p>
                  </div>
                  
                  {/* Share status messages */}
                  {shareStatus === 'initiating' && (
                    <div className="w-full p-2 rounded-lg bg-violet-900/50 border border-violet-500/50 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-violet-300 border-t-transparent rounded-full animate-spin" />
                        <p className="text-violet-300 text-sm">Opening Warpcast...</p>
                      </div>
                    </div>
                  )}
                  
                  {shareStatus === 'verifying' && (
                    <div className="w-full p-2 rounded-lg bg-violet-900/50 border border-violet-500/50 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-violet-300 border-t-transparent rounded-full animate-spin" />
                        <p className="text-violet-300 text-sm">Verifying your cast...</p>
                      </div>
                    </div>
                  )}
                  
                  {shareStatus === 'success' && (
                    <div className="w-full p-2 rounded-lg bg-emerald-900/50 border border-emerald-500/50 text-center">
                      <p className="text-emerald-300 text-sm">✓ Cast verified! Resuming game...</p>
                    </div>
                  )}
                  
                  {shareError && (
                    <div className="w-full p-2 rounded-lg bg-rose-900/50 border border-rose-500/50 text-center">
                      <p className="text-rose-300 text-sm">{shareError}</p>
                    </div>
                  )}
                  
                  {/* Action buttons based on state */}
                  {shareStatus === 'idle' && (
                    <button
                      onClick={handleShareReprieve}
                      className="
                        w-full py-4 px-6 rounded-xl
                        bg-gradient-to-r from-violet-500 to-purple-500
                        hover:from-violet-400 hover:to-purple-400
                        text-white font-bold text-lg
                        shadow-lg shadow-violet-500/30
                        transform transition-all duration-200
                        hover:scale-[1.02] active:scale-[0.98]
                        flex items-center justify-center gap-2
                      "
                    >
                      {reprieveCopy.buttonText}
                    </button>
                  )}
                  
                  {shareStatus === 'waiting' && (
                    <button
                      onClick={handleVerifyShare}
                      className="
                        w-full py-4 px-6 rounded-xl
                        bg-gradient-to-r from-emerald-500 to-teal-500
                        hover:from-emerald-400 hover:to-teal-400
                        text-white font-bold text-lg
                        shadow-lg shadow-emerald-500/30
                        transform transition-all duration-200
                        hover:scale-[1.02] active:scale-[0.98]
                        flex items-center justify-center gap-2
                      "
                    >
                      ✓ I shared it
                    </button>
                  )}
                  
                  <p className="text-violet-400/50 text-xs text-center">
                    Post on Farcaster to continue • Free once per run
                  </p>
                </div>
              </div>
            )}
            
            {/* PAID REPRIEVE - for high streaks */}
            {isPaidReprieve && reprieveCopy && (
              <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-amber-900/40 to-orange-900/40 border border-amber-600/50 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
                
                <div className="relative flex flex-col items-center gap-3">
                  <div className="text-4xl animate-pulse">{reprieveCopy.emoji}</div>
                  
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-amber-300">
                      {reprieveCopy.title}
                    </h3>
                    <p className="text-amber-200/70 text-sm mt-1">
                      {reprieveCopy.description}
                    </p>
                  </div>
                  
                  {/* Payment status */}
                  {isPaying && (
                    <div className="w-full p-2 rounded-lg bg-amber-900/50 border border-amber-500/50 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                        <p className="text-amber-300 text-sm">{getStatusText(paymentStatus)}</p>
                      </div>
                      {txHash && (
                        <p className="text-amber-400/50 text-xs mt-1 truncate">
                          TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {paymentError && (
                    <div className="w-full p-2 rounded-lg bg-rose-900/50 border border-rose-500/50 text-center">
                      <p className="text-rose-300 text-sm">{paymentError}</p>
                      <button 
                        onClick={resetPayment}
                        className="text-rose-400 text-xs underline mt-1"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                  
                  {paymentStatus === 'success' && (
                    <div className="w-full p-2 rounded-lg bg-emerald-900/50 border border-emerald-500/50 text-center">
                      <p className="text-emerald-300 text-sm">✓ Payment verified! Resuming game...</p>
                    </div>
                  )}
                  
                  {paymentStatus !== 'success' && (
                    <button
                      onClick={requiresActualPayment ? handlePaidReprieve : () => handleFreeReprieve('paid')}
                      disabled={isPaying}
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
                      {isPaying ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {isFree || !isWalletConnected ? (
                            'Continue FREE'
                          ) : (
                            <>
                              💳 Pay ${price} {currency}
                              <span className="text-amber-200/70 text-sm font-normal">
                                ({chainName})
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </button>
                  )}
                  
                  <p className="text-amber-400/50 text-xs text-center">
                    {requiresActualPayment ? (
                      <>USDC on Base • One-time use per run</>
                    ) : (
                      <>One-time use per run • Your streak stays intact</>
                    )}
                  </p>
                  
                  {!isWalletConnected && !isFree && (
                    <p className="text-zinc-500 text-xs text-center">
                      Connect wallet to pay with USDC
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Divider if reprieve is shown */}
            {reprieveState.available && (
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-zinc-600 text-xs">or</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
            )}

            {/* Share button */}
            <button
              onClick={handleShare}
              disabled={sharing || isPaying}
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

            {/* Play Again button - renamed from Walk Away */}
            <button
              onClick={onPlayAgain}
              disabled={isPaying}
              className="
                w-full py-4 px-6 rounded-2xl
                bg-zinc-800 border border-zinc-700
                text-zinc-300 font-bold text-lg
                transform transition-all
                hover:bg-zinc-700 hover:text-white
                active:scale-[0.98]
                disabled:opacity-50
              "
            >
              🔄 Try Again
            </button>
            
            {/* Explanation text */}
            <p className="text-zinc-600 text-xs text-center">
              Start a new game from scratch
            </p>
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
