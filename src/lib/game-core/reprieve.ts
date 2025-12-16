/**
 * Reprieve system - tiered continuation options
 * 
 * Streak < 5: Share on Farcaster to continue (viral acquisition)
 * Streak >= 5: Pay $1 USDC to continue (monetization)
 */

export type ReprieveType = 'share' | 'paid' | 'none';

export interface ReprieveState {
  available: boolean;
  used: boolean;
  type: ReprieveType;
  price: number;
  currency: 'USDC';
}

export interface ReprieveResult {
  success: boolean;
  paymentRequired: boolean;
  shareRequired: boolean;
  paymentAmount?: number;
  paymentCurrency?: 'USDC';
  transactionId?: string;
  shareToken?: string; // Token to verify share was posted
  error?: string;
}

export interface PaymentRequest {
  userId: string;
  runId: string;
  amount: number;
  currency: 'USDC';
  streak: number;
}

// Streak threshold for paid reprieve
const SHARE_REPRIEVE_MAX_STREAK = 5; // Share option for streaks 0-4
const REPRIEVE_PRICE = 1.00; // $1 USDC

// Feature flag for free reprieves during testing
const REPRIEVE_FREE = process.env.NEXT_PUBLIC_REPRIEVE_FREE === 'true';

/**
 * Get the reprieve type available for a streak
 */
export function getReprieveType(streak: number, hasUsedReprieve: boolean): ReprieveType {
  if (hasUsedReprieve) return 'none';
  
  // Low streaks: share to continue (viral acquisition)
  if (streak < SHARE_REPRIEVE_MAX_STREAK) return 'share';
  
  // High streaks: pay to continue (monetization)
  return 'paid';
}

/**
 * Checks if reprieve can be offered
 */
export function canOfferReprieve(
  streak: number,
  hasUsedReprieve: boolean
): boolean {
  return getReprieveType(streak, hasUsedReprieve) !== 'none';
}

/**
 * Gets reprieve state for display
 */
export function getReprieveState(
  streak: number,
  hasUsedReprieve: boolean
): ReprieveState {
  const type = getReprieveType(streak, hasUsedReprieve);
  
  return {
    available: type !== 'none',
    used: hasUsedReprieve,
    type,
    price: type === 'paid' ? REPRIEVE_PRICE : 0,
    currency: 'USDC',
  };
}

/**
 * Generates the reprieve offer copy
 */
export function getReprieveCopy(streak: number, hasUsedReprieve: boolean): {
  title: string;
  description: string;
  buttonText: string;
  emoji: string;
} {
  const type = getReprieveType(streak, hasUsedReprieve);
  
  if (type === 'share') {
    return {
      title: 'Share to Continue',
      description: `Keep your streak at ${streak}`,
      buttonText: '📢 Share on Farcaster',
      emoji: '📢',
    };
  }
  
  const priceText = REPRIEVE_FREE 
    ? 'FREE (testing)' 
    : `$${REPRIEVE_PRICE.toFixed(0)} USDC`;
  
  return {
    title: 'One Last Candle',
    description: `Keep your ${streak} streak alive`,
    buttonText: `💳 Continue for ${priceText}`,
    emoji: '🕯️',
  };
}

/**
 * Get max streak for share reprieve
 */
export function getShareReprieveMaxStreak(): number {
  return SHARE_REPRIEVE_MAX_STREAK;
}

/**
 * Gets the reprieve price
 */
export function getReprievePrice(): number {
  return REPRIEVE_PRICE;
}

/**
 * Check if reprieves are currently free
 */
export function isReprieveFree(): boolean {
  return REPRIEVE_FREE;
}

// ===========================================
// PAYMENT INTEGRATION HOOKS
// ===========================================

/**
 * Payment provider interface
 * Implement this for different payment methods
 */
export interface PaymentProvider {
  name: string;
  processPayment(request: PaymentRequest): Promise<ReprieveResult>;
  verifyPayment(transactionId: string): Promise<boolean>;
}

/**
 * Mock payment provider for testing
 */
export const mockPaymentProvider: PaymentProvider = {
  name: 'mock',
  async processPayment(request: PaymentRequest): Promise<ReprieveResult> {
    console.log('[Reprieve] Mock payment processed:', request);
    
    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      paymentRequired: false,
      shareRequired: false,
      transactionId: `mock_${Date.now()}_${request.runId}`,
    };
  },
  async verifyPayment(transactionId: string): Promise<boolean> {
    return transactionId.startsWith('mock_');
  },
};

/**
 * Stripe payment provider placeholder
 * TODO: Implement when ready
 */
export const stripePaymentProvider: PaymentProvider = {
  name: 'stripe',
  async processPayment(request: PaymentRequest): Promise<ReprieveResult> {
    // TODO: Implement Stripe payment intent creation
    // 1. Create payment intent on server
    // 2. Return client secret for frontend to complete
    // 3. Verify payment webhook
    
    console.log('[Reprieve] Stripe payment not yet implemented:', request);
    return {
      success: false,
      paymentRequired: true,
      shareRequired: false,
      paymentAmount: request.amount,
      paymentCurrency: request.currency,
      error: 'Stripe payments not yet implemented',
    };
  },
  async verifyPayment(_transactionId: string): Promise<boolean> {
    // TODO: Verify with Stripe API
    return false;
  },
};

/**
 * Crypto payment provider placeholder (USDC, ETH)
 * TODO: Implement when ready
 */
export const cryptoPaymentProvider: PaymentProvider = {
  name: 'crypto',
  async processPayment(request: PaymentRequest): Promise<ReprieveResult> {
    // TODO: Implement crypto payment
    // 1. Generate payment address or use Coinbase Commerce
    // 2. Wait for confirmation
    // 3. Verify on-chain
    
    console.log('[Reprieve] Crypto payment not yet implemented:', request);
    return {
      success: false,
      paymentRequired: true,
      shareRequired: false,
      paymentAmount: request.amount,
      paymentCurrency: request.currency,
      error: 'Crypto payments not yet implemented',
    };
  },
  async verifyPayment(_transactionId: string): Promise<boolean> {
    // TODO: Verify on-chain
    return false;
  },
};

/**
 * Get the active payment provider
 */
export function getPaymentProvider(): PaymentProvider {
  // During testing, use mock provider if reprieve is free
  if (REPRIEVE_FREE) {
    return mockPaymentProvider;
  }
  
  // TODO: Select based on user preference or config
  // For now, default to mock
  return mockPaymentProvider;
}

/**
 * Process a reprieve request
 * Main entry point for reprieve payment
 */
export async function processReprieve(
  userId: string,
  runId: string,
  streak: number,
  hasUsedReprieve: boolean
): Promise<ReprieveResult> {
  // Check if reprieve is available
  if (!canOfferReprieve(streak, hasUsedReprieve)) {
    return {
      success: false,
      paymentRequired: false,
      shareRequired: false,
      error: hasUsedReprieve 
        ? 'Reprieve already used this run' 
        : 'Reprieve not available',
    };
  }
  
  // If free, just allow it
  if (REPRIEVE_FREE) {
    return {
      success: true,
      paymentRequired: false,
      shareRequired: false,
      transactionId: `free_${Date.now()}_${runId}`,
    };
  }
  
  // Process payment
  const provider = getPaymentProvider();
  const request: PaymentRequest = {
    userId,
    runId,
    amount: REPRIEVE_PRICE,
    currency: 'USDC',
    streak,
  };
  
  return provider.processPayment(request);
}

/**
 * Verify a reprieve payment was completed
 */
export async function verifyReprievePayment(transactionId: string): Promise<boolean> {
  // Free reprieves are always valid
  if (transactionId.startsWith('free_')) {
    return true;
  }
  
  const provider = getPaymentProvider();
  return provider.verifyPayment(transactionId);
}
