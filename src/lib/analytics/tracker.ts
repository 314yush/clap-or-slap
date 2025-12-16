/**
 * Server-side Analytics Tracker
 * 
 * Stores events in Redis for real-time metrics and batch processing.
 * Designed for high-volume tracking without blocking game performance.
 */

import { Redis } from '@upstash/redis';
import { AnalyticsEvent, EventType } from './events';

// Redis client (lazy init)
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.warn('[Analytics] Redis not configured - analytics disabled');
    return null;
  }
  
  redis = new Redis({ url, token });
  return redis;
}

// Check if analytics is enabled
function isEnabled(): boolean {
  return process.env.ANALYTICS_ENABLED !== 'false';
}

// Redis key patterns
const KEYS = {
  // Events list for batch processing
  eventsList: (date: string) => `analytics:events:${date}`,
  
  // Daily active users (HyperLogLog)
  dau: (date: string) => `analytics:dau:${date}`,
  
  // Streak distribution (sorted set: streak -> count)
  streakDistribution: () => 'analytics:streak_distribution',
  
  // Token pair difficulty (hash: pair -> {wins, losses})
  tokenDifficulty: (pair: string) => `analytics:token_difficulty:${pair}`,
  
  // Session data (hash, TTL 30min)
  session: (sessionId: string) => `analytics:session:${sessionId}`,
  
  // User lifetime stats (hash)
  userStats: (userId: string) => `analytics:user:${userId}:stats`,
  
  // Real-time counters
  counter: (metric: string, date: string) => `analytics:counter:${metric}:${date}`,
};

/**
 * Get today's date key (YYYY-MM-DD)
 */
function getDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Track a single event
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  if (!isEnabled()) return;
  
  const client = getRedis();
  if (!client) return;
  
  const date = getDateKey();
  
  try {
    // Store event in daily list (for batch processing)
    await client.lpush(KEYS.eventsList(date), JSON.stringify(event));
    
    // Set TTL on events list (7 days)
    await client.expire(KEYS.eventsList(date), 60 * 60 * 24 * 7);
    
    // Track DAU if user is logged in
    if (event.userId) {
      await client.pfadd(KEYS.dau(date), event.userId);
    }
    
    // Process event-specific metrics
    await processEventMetrics(client, event, date);
    
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error);
  }
}

/**
 * Track multiple events (batch)
 */
export async function trackEvents(events: AnalyticsEvent[]): Promise<void> {
  if (!isEnabled() || events.length === 0) return;
  
  const client = getRedis();
  if (!client) return;
  
  try {
    // Use pipeline for efficiency
    const pipeline = client.pipeline();
    const date = getDateKey();
    
    for (const event of events) {
      pipeline.lpush(KEYS.eventsList(date), JSON.stringify(event));
      
      if (event.userId) {
        pipeline.pfadd(KEYS.dau(date), event.userId);
      }
    }
    
    await pipeline.exec();
    
    // Process metrics for each event
    for (const event of events) {
      await processEventMetrics(client, event, date);
    }
    
  } catch (error) {
    console.error('[Analytics] Error tracking batch events:', error);
  }
}

/**
 * Process event-specific metrics
 */
async function processEventMetrics(
  client: Redis,
  event: AnalyticsEvent,
  date: string
): Promise<void> {
  switch (event.type) {
    case 'session_start':
      await client.incr(KEYS.counter('sessions', date));
      break;
      
    case 'guess':
      await client.incr(KEYS.counter('guesses', date));
      if (event.correct) {
        await client.incr(KEYS.counter('correct_guesses', date));
      }
      // Track token pair difficulty
      const pair = `${event.currentToken}_${event.nextToken}`;
      const field = event.correct ? 'wins' : 'losses';
      await client.hincrby(KEYS.tokenDifficulty(pair), field, 1);
      break;
      
    case 'loss':
      await client.incr(KEYS.counter('losses', date));
      await client.incr(KEYS.counter(`losses_${event.reason}`, date));
      // Track streak distribution
      await client.zincrby(KEYS.streakDistribution(), 1, event.streak.toString());
      break;
      
    case 'reprieve_offered':
      await client.incr(KEYS.counter('reprieve_offered', date));
      await client.incr(KEYS.counter(`reprieve_offered_${event.offerType}`, date));
      break;
      
    case 'reprieve_used':
      await client.incr(KEYS.counter('reprieve_used', date));
      await client.incr(KEYS.counter(`reprieve_used_${event.method}`, date));
      break;
      
    case 'reprieve_declined':
      await client.incr(KEYS.counter('reprieve_declined', date));
      break;
      
    case 'share':
      await client.incr(KEYS.counter('shares', date));
      await client.incr(KEYS.counter(`shares_${event.platform}`, date));
      await client.incr(KEYS.counter(`shares_${event.context}`, date));
      break;
  }
}

/**
 * Update session data
 */
export async function updateSession(
  sessionId: string,
  data: Partial<{
    userId: string;
    roundsPlayed: number;
    highestStreak: number;
    startTime: number;
  }>
): Promise<void> {
  if (!isEnabled()) return;
  
  const client = getRedis();
  if (!client) return;
  
  try {
    const key = KEYS.session(sessionId);
    
    for (const [field, value] of Object.entries(data)) {
      if (value !== undefined) {
        await client.hset(key, { [field]: value.toString() });
      }
    }
    
    // Set/refresh TTL (30 minutes)
    await client.expire(key, 60 * 30);
    
  } catch (error) {
    console.error('[Analytics] Error updating session:', error);
  }
}

/**
 * Get session data
 */
export async function getSession(sessionId: string): Promise<Record<string, string> | null> {
  if (!isEnabled()) return null;
  
  const client = getRedis();
  if (!client) return null;
  
  try {
    return await client.hgetall(KEYS.session(sessionId));
  } catch (error) {
    console.error('[Analytics] Error getting session:', error);
    return null;
  }
}

/**
 * Update user lifetime stats
 */
export async function updateUserStats(
  userId: string,
  stats: Partial<{
    totalGames: number;
    totalGuesses: number;
    correctGuesses: number;
    bestStreak: number;
    totalReprieves: number;
    totalShares: number;
  }>
): Promise<void> {
  if (!isEnabled()) return;
  
  const client = getRedis();
  if (!client) return;
  
  try {
    const key = KEYS.userStats(userId);
    
    for (const [field, value] of Object.entries(stats)) {
      if (value !== undefined) {
        await client.hincrby(key, field, value);
      }
    }
    
  } catch (error) {
    console.error('[Analytics] Error updating user stats:', error);
  }
}

// =====================
// Metrics Retrieval
// =====================

/**
 * Get daily active users count
 */
export async function getDAU(date?: string): Promise<number> {
  const client = getRedis();
  if (!client) return 0;
  
  try {
    const key = KEYS.dau(date || getDateKey());
    return await client.pfcount(key);
  } catch (error) {
    console.error('[Analytics] Error getting DAU:', error);
    return 0;
  }
}

/**
 * Get counter value
 */
export async function getCounter(metric: string, date?: string): Promise<number> {
  const client = getRedis();
  if (!client) return 0;
  
  try {
    const key = KEYS.counter(metric, date || getDateKey());
    const value = await client.get<number>(key);
    return value || 0;
  } catch (error) {
    console.error('[Analytics] Error getting counter:', error);
    return 0;
  }
}

/**
 * Get streak distribution
 */
export async function getStreakDistribution(limit: number = 50): Promise<{ streak: number; count: number }[]> {
  const client = getRedis();
  if (!client) return [];
  
  try {
    const results = await client.zrange<string[]>(
      KEYS.streakDistribution(),
      0,
      limit - 1,
      { rev: true, withScores: true }
    );
    
    const distribution: { streak: number; count: number }[] = [];
    for (let i = 0; i < results.length; i += 2) {
      distribution.push({
        streak: parseInt(results[i], 10),
        count: parseInt(results[i + 1], 10),
      });
    }
    
    return distribution;
  } catch (error) {
    console.error('[Analytics] Error getting streak distribution:', error);
    return [];
  }
}

/**
 * Get token pair difficulty stats
 */
export async function getTokenPairDifficulty(
  currentToken: string,
  nextToken: string
): Promise<{ wins: number; losses: number; winRate: number } | null> {
  const client = getRedis();
  if (!client) return null;
  
  try {
    const pair = `${currentToken}_${nextToken}`;
    const stats = await client.hgetall<{ wins?: string; losses?: string }>(
      KEYS.tokenDifficulty(pair)
    );
    
    if (!stats) return null;
    
    const wins = parseInt(stats.wins || '0', 10);
    const losses = parseInt(stats.losses || '0', 10);
    const total = wins + losses;
    
    return {
      wins,
      losses,
      winRate: total > 0 ? wins / total : 0,
    };
  } catch (error) {
    console.error('[Analytics] Error getting token pair difficulty:', error);
    return null;
  }
}

/**
 * Get summary metrics for admin dashboard
 */
export async function getDailyMetrics(date?: string): Promise<{
  dau: number;
  sessions: number;
  guesses: number;
  correctRate: number;
  losses: number;
  lossReasons: { wrong: number; timeout: number };
  reprieveOffered: number;
  reprieveUsed: number;
  reprieveConversion: number;
  shares: number;
}> {
  const d = date || getDateKey();
  
  const [
    dau,
    sessions,
    guesses,
    correctGuesses,
    losses,
    lossesWrong,
    lossesTimeout,
    reprieveOffered,
    reprieveUsed,
    shares,
  ] = await Promise.all([
    getDAU(d),
    getCounter('sessions', d),
    getCounter('guesses', d),
    getCounter('correct_guesses', d),
    getCounter('losses', d),
    getCounter('losses_wrong_guess', d),
    getCounter('losses_timeout', d),
    getCounter('reprieve_offered', d),
    getCounter('reprieve_used', d),
    getCounter('shares', d),
  ]);
  
  return {
    dau,
    sessions,
    guesses,
    correctRate: guesses > 0 ? correctGuesses / guesses : 0,
    losses,
    lossReasons: { wrong: lossesWrong, timeout: lossesTimeout },
    reprieveOffered,
    reprieveUsed,
    reprieveConversion: reprieveOffered > 0 ? reprieveUsed / reprieveOffered : 0,
    shares,
  };
}

