'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  AnalyticsEvent,
  createEvent,
  generateSessionId,
  SessionStartEvent,
  SessionEndEvent,
  GuessEvent,
  LossEvent,
  ReprieveOfferedEvent,
  ReprieveUsedEvent,
  ReprieveDeclinedEvent,
  ShareEvent,
  PageViewEvent,
} from '@/lib/analytics/events';

// Session storage key
const SESSION_KEY = 'caporslap_session';

// Event buffer for batching
const EVENT_BUFFER: AnalyticsEvent[] = [];
const FLUSH_INTERVAL = 5000; // 5 seconds
const MAX_BUFFER_SIZE = 20;

/**
 * Get or create session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Flush buffered events to server
 */
async function flushEvents(): Promise<void> {
  if (EVENT_BUFFER.length === 0) return;
  
  const events = [...EVENT_BUFFER];
  EVENT_BUFFER.length = 0; // Clear buffer
  
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });
  } catch (error) {
    // Re-add events to buffer on failure (up to max size)
    const spaceLeft = MAX_BUFFER_SIZE - EVENT_BUFFER.length;
    EVENT_BUFFER.push(...events.slice(0, spaceLeft));
    console.error('[Analytics] Failed to flush events:', error);
  }
}

/**
 * Queue event for tracking
 */
function queueEvent(event: AnalyticsEvent): void {
  EVENT_BUFFER.push(event);
  
  // Flush immediately if buffer is full
  if (EVENT_BUFFER.length >= MAX_BUFFER_SIZE) {
    flushEvents();
  }
}

/**
 * Analytics hook for tracking user behavior
 */
export function useAnalytics(userId?: string) {
  const sessionId = useRef<string>('');
  const sessionStart = useRef<number>(0);
  const roundsPlayed = useRef<number>(0);
  const highestStreak = useRef<number>(0);
  
  // Initialize session
  useEffect(() => {
    sessionId.current = getSessionId();
    sessionStart.current = Date.now();
    
    // Set up periodic flush
    const interval = setInterval(flushEvents, FLUSH_INTERVAL);
    
    // Flush on page unload
    const handleUnload = () => {
      // Track session end
      if (sessionId.current) {
        const duration = Math.floor((Date.now() - sessionStart.current) / 1000);
        queueEvent(createEvent<SessionEndEvent>({
          type: 'session_end',
          sessionId: sessionId.current,
          userId,
          duration,
          roundsPlayed: roundsPlayed.current,
          highestStreak: highestStreak.current,
        }));
      }
      
      // Synchronous flush on unload
      if (EVENT_BUFFER.length > 0 && navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/analytics/track',
          JSON.stringify({ events: EVENT_BUFFER })
        );
      }
    };
    
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      flushEvents(); // Final flush on unmount
    };
  }, [userId]);
  
  // Track session start
  const trackSessionStart = useCallback((source?: string) => {
    queueEvent(createEvent<SessionStartEvent>({
      type: 'session_start',
      sessionId: sessionId.current,
      userId,
      source,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      platform: 'web',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    }));
  }, [userId]);
  
  // Track guess
  const trackGuess = useCallback((data: {
    runId: string;
    streak: number;
    currentToken: string;
    nextToken: string;
    guess: 'cap' | 'slap';
    correct: boolean;
    timeToGuess: number;
    timerRemaining: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  }) => {
    roundsPlayed.current += 1;
    if (data.streak > highestStreak.current) {
      highestStreak.current = data.streak;
    }
    
    queueEvent(createEvent<GuessEvent>({
      type: 'guess',
      sessionId: sessionId.current,
      userId,
      ...data,
    }));
  }, [userId]);
  
  // Track loss
  const trackLoss = useCallback((data: {
    runId: string;
    streak: number;
    reason: 'wrong_guess' | 'timeout';
    currentToken: string;
    nextToken: string;
    marketCapRatio: number;
  }) => {
    queueEvent(createEvent<LossEvent>({
      type: 'loss',
      sessionId: sessionId.current,
      userId,
      ...data,
    }));
  }, [userId]);
  
  // Track reprieve offered
  const trackReprieveOffered = useCallback((data: {
    streak: number;
    offerType: 'share' | 'paid';
  }) => {
    queueEvent(createEvent<ReprieveOfferedEvent>({
      type: 'reprieve_offered',
      sessionId: sessionId.current,
      userId,
      ...data,
    }));
  }, [userId]);
  
  // Track reprieve used
  const trackReprieveUsed = useCallback((data: {
    streak: number;
    method: 'paid' | 'share';
    txHash?: string;
  }) => {
    queueEvent(createEvent<ReprieveUsedEvent>({
      type: 'reprieve_used',
      sessionId: sessionId.current,
      userId,
      ...data,
    }));
  }, [userId]);
  
  // Track reprieve declined
  const trackReprieveDeclined = useCallback((data: {
    streak: number;
    offerType: 'share' | 'paid';
  }) => {
    queueEvent(createEvent<ReprieveDeclinedEvent>({
      type: 'reprieve_declined',
      sessionId: sessionId.current,
      userId,
      ...data,
    }));
  }, [userId]);
  
  // Track share
  const trackShare = useCallback((data: {
    platform: 'farcaster' | 'twitter' | 'copy';
    context: 'loss' | 'reprieve' | 'milestone' | 'challenge' | 'leaderboard';
    streak?: number;
    verified?: boolean;
  }) => {
    queueEvent(createEvent<ShareEvent>({
      type: 'share',
      sessionId: sessionId.current,
      userId,
      ...data,
    }));
  }, [userId]);
  
  // Track page view
  const trackPageView = useCallback((page: 'game' | 'leaderboard' | 'landing') => {
    queueEvent(createEvent<PageViewEvent>({
      type: 'page_view',
      sessionId: sessionId.current,
      userId,
      page,
    }));
  }, [userId]);
  
  return {
    trackSessionStart,
    trackGuess,
    trackLoss,
    trackReprieveOffered,
    trackReprieveUsed,
    trackReprieveDeclined,
    trackShare,
    trackPageView,
  };
}

