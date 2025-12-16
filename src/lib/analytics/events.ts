/**
 * Analytics Event Types for CapOrSlap
 * 
 * These events track user behavior for understanding:
 * - User patterns and session behavior
 * - Where users struggle (token pairs, streaks)
 * - Monetization funnel (reprieve conversion)
 * - Virality metrics (share rate, sources)
 */

// Base event properties
export interface BaseEvent {
  timestamp: number;
  sessionId: string;
  userId?: string; // Anonymous if not logged in
}

// Session events
export interface SessionStartEvent extends BaseEvent {
  type: 'session_start';
  source?: string;      // utm_source or referrer
  referrer?: string;    // document.referrer
  platform: 'web' | 'farcaster_frame';
  userAgent?: string;
}

export interface SessionEndEvent extends BaseEvent {
  type: 'session_end';
  duration: number;       // seconds
  roundsPlayed: number;
  highestStreak: number;
}

// Game events
export interface GuessEvent extends BaseEvent {
  type: 'guess';
  runId: string;
  streak: number;
  currentToken: string;   // symbol
  nextToken: string;      // symbol
  guess: 'cap' | 'slap';
  correct: boolean;
  timeToGuess: number;    // ms from round start
  timerRemaining: number; // seconds left
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface LossEvent extends BaseEvent {
  type: 'loss';
  runId: string;
  streak: number;
  reason: 'wrong_guess' | 'timeout';
  currentToken: string;
  nextToken: string;
  marketCapRatio: number;  // For difficulty analysis
}

// Reprieve events
export interface ReprieveOfferedEvent extends BaseEvent {
  type: 'reprieve_offered';
  streak: number;
  offerType: 'share' | 'paid';  // share for low streaks, paid for high
}

export interface ReprieveUsedEvent extends BaseEvent {
  type: 'reprieve_used';
  streak: number;
  method: 'paid' | 'share';
  txHash?: string;  // For paid reprieves
}

export interface ReprieveDeclinedEvent extends BaseEvent {
  type: 'reprieve_declined';
  streak: number;
  offerType: 'share' | 'paid';
}

// Social events
export interface ShareEvent extends BaseEvent {
  type: 'share';
  platform: 'farcaster' | 'twitter' | 'copy';
  context: 'loss' | 'reprieve' | 'milestone' | 'challenge' | 'leaderboard';
  streak?: number;
  verified?: boolean;  // For share-to-reprieve
}

// Navigation events
export interface PageViewEvent extends BaseEvent {
  type: 'page_view';
  page: 'game' | 'leaderboard' | 'landing';
}

export interface LeaderboardViewEvent extends BaseEvent {
  type: 'leaderboard_view';
  tab: 'global' | 'weekly';
  userRank?: number;
}

// Union type for all events
export type AnalyticsEvent =
  | SessionStartEvent
  | SessionEndEvent
  | GuessEvent
  | LossEvent
  | ReprieveOfferedEvent
  | ReprieveUsedEvent
  | ReprieveDeclinedEvent
  | ShareEvent
  | PageViewEvent
  | LeaderboardViewEvent;

// Event type literal for type checking
export type EventType = AnalyticsEvent['type'];

/**
 * Helper to create event with timestamp
 */
export function createEvent<T extends AnalyticsEvent>(
  event: Omit<T, 'timestamp'>
): T {
  return {
    ...event,
    timestamp: Date.now(),
  } as T;
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

