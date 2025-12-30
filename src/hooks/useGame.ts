'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  GameState, 
  Guess, 
  GuessResult,
  Run,
  Token
} from '@/lib/game-core/types';
import { compareMarketCaps, generateLossExplanation } from '@/lib/game-core/comparison';
import { getReprieveState } from '@/lib/game-core/reprieve';
import { getStreakTier, getStreakMilestoneMessage } from '@/lib/game-core/streak';
import { OvertakeEvent } from '@/lib/leaderboard/overtake';
import { LiveOvertakeData } from '@/components/game/LiveOvertakeToast';

interface UseGameReturn {
  // State
  gameState: GameState;
  isLoading: boolean;
  error: string | null;
  lastResult: GuessResult | null;
  lossExplanation: string | null;
  overtakes: OvertakeEvent[];
  liveOvertakes: LiveOvertakeData[];
  
  // Actions
  startGame: () => Promise<void>;
  makeGuess: (guess: Guess) => void;
  continueAfterCorrect: () => Promise<void>;
  activateReprieve: () => Promise<void>; // Called after payment is verified
  playAgain: () => void; // Start a new game
  clearLiveOvertakes: () => void; // Clear live overtake notifications
  
  // Derived
  canUseReprieve: boolean;
  streakTier: 0 | 1 | 2 | 3;
  milestoneMessage: string | null;
  completedRun: Run | null;
}

const initialGameState: GameState = {
  phase: 'playing',
  currentToken: null,
  nextToken: null,
  streak: 0,
  hasUsedReprieve: false,
  runId: '',
};

/**
 * Main game state management hook
 * Handles all game logic including guessing, streaks, and game flow
 */
export function useGame(userId: string): UseGameReturn {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [completedRun, setCompletedRun] = useState<Run | null>(null);
  const [overtakes, setOvertakes] = useState<OvertakeEvent[]>([]);
  const [liveOvertakes, setLiveOvertakes] = useState<LiveOvertakeData[]>([]);
  const isStartingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const prefetchedNextTokenRef = useRef<Token | null>(null);

  // Check for live overtakes after streak increases
  const checkLiveOvertakes = useCallback(async (newStreak: number, previousStreak: number) => {
    try {
      const response = await fetch('/api/leaderboard/check-overtakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentStreak: newStreak, previousStreak }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.overtakes && data.overtakes.length > 0) {
          console.log('[useGame] Live overtakes:', data.overtakes);
          setLiveOvertakes(data.overtakes);
        }
      }
    } catch (err) {
      console.error('Failed to check overtakes:', err);
    }
  }, [userId]);

  // Clear live overtakes
  const clearLiveOvertakes = useCallback(() => {
    setLiveOvertakes([]);
  }, []);

  // Prefetch next token in background for smoother gameplay
  const prefetchNextToken = useCallback(async (currentTokenId: string | undefined, runId: string) => {
    if (!currentTokenId || !runId) return;
    
    try {
      const response = await fetch('/api/tokens/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentTokenId,
          runId,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        prefetchedNextTokenRef.current = data.nextToken;
      }
    } catch (err) {
      // Silently fail - prefetch is optional
      console.debug('[useGame] Prefetch failed:', err);
    }
  }, []);

  // Start a new game
  const startGame = useCallback(async () => {
    // Prevent multiple simultaneous starts
    if (isStartingRef.current) {
      return;
    }
    
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    isStartingRef.current = true;
    setIsLoading(true);
    setError(null);
    setLastResult(null);
    setCompletedRun(null);
    setOvertakes([]);
    setLiveOvertakes([]);
    
    try {
      // Fetch initial tokens from API
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        signal: abortController.signal,
      });
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to start game');
      }
      
      const data = await response.json();
      
      // Check again if request was aborted before updating state
      if (abortController.signal.aborted) {
        return;
      }
      
      setGameState({
        phase: 'playing',
        currentToken: data.currentToken,
        nextToken: data.nextToken,
        streak: 0,
        hasUsedReprieve: false,
        runId: data.runId,
      });
      
      // Prefetch the next token in the background for smoother gameplay
      prefetchNextToken(data.nextToken?.id, data.runId);
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setIsLoading(false);
      isStartingRef.current = false;
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [userId]);

  // Make a guess
  const makeGuess = useCallback((guess: Guess) => {
    if (!gameState.currentToken || !gameState.nextToken) return;
    if (gameState.phase !== 'playing') return;
    
    // Compare market caps
    const result = compareMarketCaps(
      gameState.currentToken,
      gameState.nextToken,
      guess
    );
    
    setLastResult(result);
    
    if (result.correct) {
      const newStreak = gameState.streak + 1;
      const previousStreak = gameState.streak;
      
      // Correct guess - show animation, then continue
      setGameState(prev => ({
        ...prev,
        phase: 'correct',
        streak: newStreak,
      }));
      
      // Check for live overtakes (fire and forget)
      checkLiveOvertakes(newStreak, previousStreak);
    } else {
      // Incorrect - game over
      const run: Run = {
        runId: gameState.runId,
        userId,
        streak: gameState.streak,
        usedReprieve: gameState.hasUsedReprieve,
        timestamp: Date.now(),
        lastToken: gameState.currentToken!,
        failedGuess: result,
      };
      
      setCompletedRun(run);
      setGameState(prev => ({
        ...prev,
        phase: 'loss',
      }));
      
      // Submit to leaderboard and capture overtakes
      fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run, userId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.overtakes && data.overtakes.length > 0) {
            console.log('[useGame] Overtakes detected:', data.overtakes);
            setOvertakes(data.overtakes);
          }
        })
        .catch(console.error);
    }
  }, [gameState, userId]);

  // Continue after correct guess animation
  const continueAfterCorrect = useCallback(async () => {
    if (gameState.phase !== 'correct') return;
    
    // Optimistic update: immediately move to next token
    const currentNextToken = gameState.nextToken;
    
    // Use prefetched token if available for instant update
    const prefetchedToken = prefetchedNextTokenRef.current;
    prefetchedNextTokenRef.current = null; // Clear prefetched token
    
    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      currentToken: prev.nextToken,
      nextToken: prefetchedToken || prev.nextToken, // Use prefetched if available
    }));
    
    // If we have a prefetched token, we can skip loading state
    if (prefetchedToken) {
      // Prefetch the next token for the next round
      prefetchNextToken(prefetchedToken?.id, gameState.runId);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Fetch next token
      const response = await fetch('/api/tokens/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentTokenId: currentNextToken?.id,
          runId: gameState.runId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get next token');
      }
      
      const data = await response.json();
      
      // Update with the new next token
      setGameState(prev => ({
        ...prev,
        nextToken: data.nextToken,
      }));
      
      // Prefetch the next token for the next round
      prefetchNextToken(data.nextToken?.id, gameState.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to continue');
      // Revert optimistic update on error
      setGameState(prev => ({
        ...prev,
        phase: 'correct',
        currentToken: prev.currentToken,
        nextToken: currentNextToken,
      }));
    } finally {
      setIsLoading(false);
    }
  }, [gameState, prefetchNextToken]);

  // Activate reprieve (called AFTER payment is verified)
  // This just resumes the game - payment verification happens separately
  const activateReprieve = useCallback(async () => {
    if (gameState.phase !== 'loss') return;
    if (gameState.hasUsedReprieve) return;
    if (gameState.streak < 5) return; // Min streak requirement
    
    setIsLoading(true);
    
    try {
      // Fetch a new token to continue with
      const response = await fetch('/api/tokens/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentTokenId: gameState.currentToken?.id,
          runId: gameState.runId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get next token');
      }
      
      const data = await response.json();
      
      // Continue the game with the current token and a new next token
      // The failed comparison is discarded
      setGameState(prev => ({
        ...prev,
        phase: 'playing',
        nextToken: data.nextToken,
        hasUsedReprieve: true,
      }));
      
      setLastResult(null);
      setCompletedRun(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to use reprieve');
    } finally {
      setIsLoading(false);
    }
  }, [gameState]);

  // Play again (start fresh)
  const playAgain = useCallback(() => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset all state and flags
    isStartingRef.current = false;
    setIsLoading(false);
    setError(null);
    setLastResult(null);
    setCompletedRun(null);
    setOvertakes([]);
    setLiveOvertakes([]);
    // Reset game state - this will trigger the useEffect to start a new game
    setGameState(initialGameState);
  }, []);

  // Auto-start game on mount or after playAgain
  useEffect(() => {
    // Only start if:
    // 1. We have a userId (non-empty string)
    // 2. There's no runId (game not started)
    // 3. We're not currently loading or starting
    // 4. We have no current token (fresh start)
    if (
      userId && 
      userId.trim() !== '' &&
      !gameState.runId && 
      !gameState.currentToken &&
      !isLoading && 
      !isStartingRef.current
    ) {
      startGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, gameState.runId, gameState.currentToken, startGame]);

  // Derived values
  const reprieveState = getReprieveState(gameState.streak, gameState.hasUsedReprieve);
  const streakTier = getStreakTier(gameState.streak);
  const milestoneMessage = getStreakMilestoneMessage(gameState.streak);
  const lossExplanation = lastResult && !lastResult.correct 
    ? generateLossExplanation(lastResult)
    : null;

  return {
    gameState,
    isLoading,
    error,
    lastResult,
    lossExplanation,
    overtakes,
    liveOvertakes,
    startGame,
    makeGuess,
    continueAfterCorrect,
    activateReprieve,
    playAgain,
    clearLiveOvertakes,
    canUseReprieve: reprieveState.available,
    streakTier,
    milestoneMessage,
    completedRun,
  };
}
