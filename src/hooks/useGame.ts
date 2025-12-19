'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  GameState, 
  Guess, 
  GuessResult,
  Run 
} from '@/lib/game-core/types';
import { compareMarketCaps, generateLossExplanation } from '@/lib/game-core/comparison';
import { getReprieveState } from '@/lib/game-core/reprieve';
import { getStreakTier, getStreakMilestoneMessage } from '@/lib/game-core/streak';
import { OvertakeEvent } from '@/lib/leaderboard/overtake';
import { LiveOvertakeData } from '@/components/game/LiveOvertakeToast';
import {
  trackGameStart,
  trackGuess,
  trackStreakMilestone,
  trackGameLoss,
  trackLeaderboardSubmit,
} from '@/lib/analytics';

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

  // Start a new game
  const startGame = useCallback(async () => {
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
      });
      
      if (!response.ok) {
        throw new Error('Failed to start game');
      }
      
      const data = await response.json();
      
      console.log('[useGame] API response received:', {
        hasCurrentToken: !!data.currentToken,
        hasNextToken: !!data.nextToken,
        currentToken: data.currentToken,
        nextToken: data.nextToken,
        runId: data.runId,
      });
      
      if (!data.currentToken || !data.nextToken) {
        console.error('[useGame] API returned null tokens!', data);
        throw new Error('API returned invalid token data');
      }
      
      setGameState({
        phase: 'playing',
        currentToken: data.currentToken,
        nextToken: data.nextToken,
        streak: 0,
        hasUsedReprieve: false,
        runId: data.runId,
      });
      
      console.log('[useGame] Game state set successfully');
      
      // Track game start
      trackGameStart(data.runId, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setIsLoading(false);
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
    
    // Track guess event
    trackGuess(
      gameState.runId,
      guess,
      result.correct,
      gameState.streak,
      gameState.currentToken.id,
      gameState.nextToken.id
    );
    
    if (result.correct) {
      const newStreak = gameState.streak + 1;
      const previousStreak = gameState.streak;
      
      // Track streak milestone if reached
      trackStreakMilestone(newStreak, gameState.runId);
      
      // Correct guess - show animation, then continue
      setGameState(prev => ({
        ...prev,
        phase: 'correct',
        streak: newStreak,
      }));
      
      // Check for live overtakes (fire and forget)
      // Only check if streak actually increased
      if (newStreak > previousStreak) {
        checkLiveOvertakes(newStreak, previousStreak);
      }
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
      
      console.log('[useGame] Creating run for leaderboard:', {
        runId: run.runId,
        userId: run.userId,
        streak: run.streak,
        hasLastToken: !!run.lastToken,
        lastTokenId: run.lastToken?.id,
        lastTokenSymbol: run.lastToken?.symbol,
        hasFailedGuess: !!run.failedGuess,
      });
      
      setCompletedRun(run);
      setGameState(prev => ({
        ...prev,
        phase: 'loss',
      }));
      
      // Track game loss
      trackGameLoss(
        gameState.runId,
        gameState.streak,
        gameState.hasUsedReprieve,
        gameState.currentToken.id
      );
      
      // Submit to leaderboard and capture overtakes
      fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run, userId }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
            console.error('[useGame] Leaderboard submit failed:', res.status, errorData);
            throw new Error(`Leaderboard submit failed: ${res.status} ${errorData.error || ''}`);
          }
          return res.json();
        })
        .then(data => {
          // Track leaderboard submission
          trackLeaderboardSubmit(gameState.streak, data.newRank || data.rank);
          
          if (data.overtakes && data.overtakes.length > 0) {
            console.log('[useGame] Overtakes detected:', data.overtakes);
            setOvertakes(data.overtakes);
          }
        })
        .catch((error) => {
          console.error('[useGame] Leaderboard submit error:', error);
          // Don't block UI - leaderboard submission failure shouldn't prevent loss screen
        });
    }
  }, [gameState, userId]);

  // Continue after correct guess animation
  const continueAfterCorrect = useCallback(async () => {
    if (gameState.phase !== 'correct') return;
    
    setIsLoading(true);
    
    try {
      // Fetch next token
      const response = await fetch('/api/tokens/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentTokenId: gameState.nextToken?.id,
          runId: gameState.runId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get next token');
      }
      
      const data = await response.json();
      
      setGameState(prev => ({
        ...prev,
        phase: 'playing',
        currentToken: prev.nextToken,
        nextToken: data.nextToken,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to continue');
    } finally {
      setIsLoading(false);
    }
  }, [gameState]);

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
    // Reset to initial state, then start new game
    setGameState(initialGameState);
    setLastResult(null);
    setCompletedRun(null);
    setOvertakes([]);
    setLiveOvertakes([]);
  }, []);

  // Auto-start game on mount or after playAgain
  useEffect(() => {
    console.log('[useGame] Auto-start effect - userId:', userId, 'runId:', gameState.runId, 'hasTokens:', !!gameState.currentToken, 'isLoading:', isLoading);
    // Only start if we have a userId (can be empty for guests, but should be set)
    // and game hasn't started yet
    if (!gameState.runId && userId && !isLoading) {
      console.log('[useGame] Auto-starting game with userId:', userId);
      startGame();
    }
  }, [userId, gameState.runId, startGame, isLoading]);
  
  // Debug: Log gameState changes
  useEffect(() => {
    console.log('[useGame] GameState updated:', {
      phase: gameState.phase,
      hasCurrentToken: !!gameState.currentToken,
      hasNextToken: !!gameState.nextToken,
      currentTokenSymbol: gameState.currentToken?.symbol,
      nextTokenSymbol: gameState.nextToken?.symbol,
      runId: gameState.runId,
      streak: gameState.streak,
    });
  }, [gameState]);

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
