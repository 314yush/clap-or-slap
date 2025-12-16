import { Token } from './types';

/**
 * Selects the next token to show, avoiding the current one
 * Uses weighted random selection to ensure variety
 * @param tokens - Pool of available tokens
 * @param currentTokenId - ID of current token to avoid
 * @param recentTokenIds - IDs of recently shown tokens to deprioritize
 * @returns Selected next token
 */
export function selectNextToken(
  tokens: Token[],
  currentTokenId: string | null,
  recentTokenIds: string[] = []
): Token {
  // Filter out current token
  const availableTokens = tokens.filter((t) => t.id !== currentTokenId);

  if (availableTokens.length === 0) {
    throw new Error('No available tokens to select');
  }

  // Assign weights - lower weight to recently shown tokens
  const weights = availableTokens.map((token) => {
    const recentIndex = recentTokenIds.indexOf(token.id);
    if (recentIndex === -1) return 1.0; // Not recent, full weight
    // More recent = lower weight
    return 0.2 + (recentIndex / recentTokenIds.length) * 0.6;
  });

  // Weighted random selection
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < availableTokens.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return availableTokens[i];
    }
  }

  // Fallback to last token
  return availableTokens[availableTokens.length - 1];
}

/**
 * Selects an initial pair of tokens to start the game
 * Tries to pick tokens with different market caps for interest
 * @param tokens - Pool of available tokens
 * @returns Tuple of [currentToken, nextToken]
 */
export function selectInitialPair(tokens: Token[]): [Token, Token] {
  if (tokens.length < 2) {
    throw new Error('Need at least 2 tokens to start game');
  }

  // Sort by market cap
  const sorted = [...tokens].sort((a, b) => b.marketCap - a.marketCap);

  // Pick one from top third and one from bottom third for contrast
  const topThird = sorted.slice(0, Math.ceil(sorted.length / 3));
  const bottomThird = sorted.slice(-Math.ceil(sorted.length / 3));

  const current = topThird[Math.floor(Math.random() * topThird.length)];
  let next = bottomThird[Math.floor(Math.random() * bottomThird.length)];

  // Ensure they're different
  if (next.id === current.id) {
    next = bottomThird.find((t) => t.id !== current.id) || sorted[sorted.length - 1];
  }

  // Randomly swap order
  return Math.random() > 0.5 ? [current, next] : [next, current];
}

/**
 * Updates the recent tokens list, keeping only last N
 * @param recentIds - Current recent IDs
 * @param newId - New ID to add
 * @param maxRecent - Maximum recent tokens to track
 * @returns Updated recent IDs array
 */
export function updateRecentTokens(
  recentIds: string[],
  newId: string,
  maxRecent: number = 10
): string[] {
  const updated = [newId, ...recentIds.filter((id) => id !== newId)];
  return updated.slice(0, maxRecent);
}

/**
 * Shuffles array using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns New shuffled array
 */
export function shuffleTokens<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

