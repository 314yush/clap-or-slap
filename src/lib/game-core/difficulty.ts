/**
 * Difficulty System for CapOrSlap
 * 
 * Determines how hard a token comparison is and selects
 * appropriate pairs based on current streak.
 */

import { Token } from './types';

export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Get the market cap ratio between two tokens
 * Higher ratio = easier to distinguish
 */
export function getMarketCapRatio(tokenA: Token, tokenB: Token): number {
  const larger = Math.max(tokenA.marketCap, tokenB.marketCap);
  const smaller = Math.min(tokenA.marketCap, tokenB.marketCap);
  return smaller > 0 ? larger / smaller : Infinity;
}

/**
 * Determine difficulty of a token pair
 * Based on market cap ratio:
 * - Easy: > 10x difference (BTC vs random meme)
 * - Medium: 3x-10x difference (requires some knowledge)
 * - Hard: < 3x difference (close call, expert territory)
 */
export function getPairDifficulty(tokenA: Token, tokenB: Token): Difficulty {
  const ratio = getMarketCapRatio(tokenA, tokenB);
  
  if (ratio > 10) return 'easy';
  if (ratio > 3) return 'medium';
  return 'hard';
}

/**
 * Get difficulty score (0-1, higher = harder)
 */
export function getDifficultyScore(tokenA: Token, tokenB: Token): number {
  const ratio = getMarketCapRatio(tokenA, tokenB);
  
  // Convert ratio to score: closer = harder
  // Ratio of 1 = score of 1 (hardest)
  // Ratio of 100 = score of ~0 (easiest)
  return Math.max(0, 1 - Math.log10(ratio) / 2);
}

/**
 * Determine target difficulty based on streak
 * 
 * Streak 0-4:   Easy (build confidence)
 * Streak 5-9:   Medium (challenge begins)
 * Streak 10-14: Mixed (unpredictable)
 * Streak 15+:   Hard (expert territory)
 */
export function getTargetDifficulty(streak: number): Difficulty | 'mixed' {
  if (streak < 5) return 'easy';
  if (streak < 10) return 'medium';
  if (streak < 15) return 'mixed';
  return 'hard';
}

/**
 * Filter tokens to create pairs of desired difficulty
 */
export function filterTokensByDifficulty(
  tokens: Token[],
  currentToken: Token,
  difficulty: Difficulty | 'mixed'
): Token[] {
  if (difficulty === 'mixed') {
    // Return all tokens for unpredictable difficulty
    return tokens.filter(t => t.id !== currentToken.id);
  }
  
  return tokens.filter(t => {
    if (t.id === currentToken.id) return false;
    const pairDifficulty = getPairDifficulty(currentToken, t);
    return pairDifficulty === difficulty;
  });
}

/**
 * Select next token based on streak-appropriate difficulty
 */
export function selectTokenByDifficulty(
  tokens: Token[],
  currentToken: Token,
  streak: number,
  recentTokenIds: string[] = []
): Token {
  const targetDifficulty = getTargetDifficulty(streak);
  
  // Filter to appropriate difficulty
  let candidates = filterTokensByDifficulty(tokens, currentToken, targetDifficulty);
  
  // If no candidates at target difficulty, fall back to all tokens
  if (candidates.length === 0) {
    candidates = tokens.filter(t => t.id !== currentToken.id);
  }
  
  // Apply recency penalty
  const weights = candidates.map(token => {
    const recentIndex = recentTokenIds.indexOf(token.id);
    if (recentIndex === -1) return 1.0;
    return 0.3 + (recentIndex / recentTokenIds.length) * 0.5;
  });
  
  // Weighted random selection
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < candidates.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return candidates[i];
    }
  }
  
  return candidates[candidates.length - 1];
}

/**
 * Check if this is a "boss round" (every 5th streak)
 * Boss rounds are intentionally hard
 */
export function isBossRound(streak: number): boolean {
  return streak > 0 && streak % 5 === 0;
}

/**
 * Get boss round difficulty modifier
 * Makes boss rounds harder than normal
 */
export function getBossRoundDifficulty(): Difficulty {
  return 'hard';
}

/**
 * Select token considering boss rounds
 */
export function selectTokenWithBossRound(
  tokens: Token[],
  currentToken: Token,
  streak: number,
  recentTokenIds: string[] = []
): Token {
  // Boss rounds are always hard
  if (isBossRound(streak)) {
    const hardTokens = filterTokensByDifficulty(tokens, currentToken, 'hard');
    if (hardTokens.length > 0) {
      const idx = Math.floor(Math.random() * hardTokens.length);
      return hardTokens[idx];
    }
  }
  
  return selectTokenByDifficulty(tokens, currentToken, streak, recentTokenIds);
}

/**
 * Get difficulty label for UI display
 */
export function getDifficultyLabel(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'easy': return 'Warmup';
    case 'medium': return 'Challenge';
    case 'hard': return 'Expert';
  }
}

/**
 * Get insight text for post-loss analysis
 */
export function getDifficultyInsight(tokenA: Token, tokenB: Token): string {
  const ratio = getMarketCapRatio(tokenA, tokenB);
  const difficulty = getPairDifficulty(tokenA, tokenB);
  
  const larger = tokenA.marketCap > tokenB.marketCap ? tokenA : tokenB;
  const smaller = tokenA.marketCap > tokenB.marketCap ? tokenB : tokenA;
  
  const formatMcap = (mcap: number) => {
    if (mcap >= 1e9) return `$${(mcap / 1e9).toFixed(1)}B`;
    if (mcap >= 1e6) return `$${(mcap / 1e6).toFixed(0)}M`;
    return `$${(mcap / 1e3).toFixed(0)}K`;
  };
  
  if (difficulty === 'hard') {
    return `Close one! ${larger.symbol}: ${formatMcap(larger.marketCap)} vs ${smaller.symbol}: ${formatMcap(smaller.marketCap)} (${ratio.toFixed(1)}x)`;
  }
  
  if (difficulty === 'medium') {
    return `${larger.symbol}: ${formatMcap(larger.marketCap)} vs ${smaller.symbol}: ${formatMcap(smaller.marketCap)} (${ratio.toFixed(1)}x)`;
  }
  
  return `${larger.symbol}: ${formatMcap(larger.marketCap)} vs ${smaller.symbol}: ${formatMcap(smaller.marketCap)}`;
}

