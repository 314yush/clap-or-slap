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

interface UseGameReturn {
  // State
  gameState: GameState;
  isLoading: boolean;
  error: string | null;
  lastResult: GuessResult | null;
  lossExplanation: string | null;
  
  // Actions
  startGame: () => Promise<void>;
  makeGuess: (guess: Guess) => void;
  continueAfterCorrect: () => Promise<void>;
  activateReprieve: () => Promise<void>; // Called after payment is verified
  playAgain: () => void; // Start a new game
  
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

  // Start a new game
  const startGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLastResult(null);
    setCompletedRun(null);
    
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
      
      setGameState({
        phase: 'playing',
        currentToken: data.currentToken,
        nextToken: data.nextToken,
        streak: 0,
        hasUsedReprieve: false,
        runId: data.runId,
      });
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
    
    if (result.correct) {
      // Correct guess - show animation, then continue
      setGameState(prev => ({
        ...prev,
        phase: 'correct',
        streak: prev.streak + 1,
      }));
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
      
      // Submit to leaderboard
      fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run }),
      }).catch(console.error);
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
  }, []);

  // Auto-start game on mount or after playAgain
  useEffect(() => {
    if (!gameState.runId && userId) {
      startGame();
    }
  }, [userId, gameState.runId, startGame]);

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
    startGame,
    makeGuess,
    continueAfterCorrect,
    activateReprieve,
    playAgain,
    canUseReprieve: reprieveState.available,
    streakTier,
    milestoneMessage,
    completedRun,
  };
}
