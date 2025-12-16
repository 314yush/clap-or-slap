/**
 * Reprieve system - allows continuing a streak once after losing
 * This is a monetization feature - pay $1 to continue
 */

export interface ReprieveState {
  available: boolean;
  used: boolean;
  price: number;
  minStreak: number;
}

// Minimum streak required to unlock reprieve
const MIN_STREAK_FOR_REPRIEVE = 5;
const REPRIEVE_PRICE = 1.00; // $1 USD

/**
 * Checks if reprieve can be offered
 * @param streak - Current streak
 * @param hasUsedReprieve - Whether reprieve was already used this run
 * @returns Whether reprieve is available
 */
export function canOfferReprieve(
  streak: number,
  hasUsedReprieve: boolean
): boolean {
  // Can only use once per run
  if (hasUsedReprieve) return false;
  
  // Must meet minimum streak
  return streak >= MIN_STREAK_FOR_REPRIEVE;
}

/**
 * Gets reprieve state for display
 * @param streak - Current streak
 * @param hasUsedReprieve - Whether reprieve was already used
 * @returns Reprieve state object
 */
export function getReprieveState(
  streak: number,
  hasUsedReprieve: boolean
): ReprieveState {
  return {
    available: canOfferReprieve(streak, hasUsedReprieve),
    used: hasUsedReprieve,
    price: REPRIEVE_PRICE,
    minStreak: MIN_STREAK_FOR_REPRIEVE,
  };
}

/**
 * Generates the reprieve offer copy
 * @param streak - Current streak
 * @returns Copy for the reprieve button
 */
export function getReprieveCopy(streak: number): {
  title: string;
  description: string;
  buttonText: string;
  emoji: string;
} {
  return {
    title: 'One Last Candle',
    description: `Keep your ${streak} streak alive`,
    buttonText: `Continue for $${REPRIEVE_PRICE.toFixed(2)}`,
    emoji: '🕯️',
  };
}

/**
 * Gets the minimum streak required for reprieve
 */
export function getMinStreakForReprieve(): number {
  return MIN_STREAK_FOR_REPRIEVE;
}

/**
 * Gets the reprieve price
 */
export function getReprievePrice(): number {
  return REPRIEVE_PRICE;
}
