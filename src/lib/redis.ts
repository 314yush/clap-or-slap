import { Redis } from '@upstash/redis';
import { LeaderboardEntry, Run, User } from './game-core/types';

/**
 * Upstash Redis integration for CapOrSlap
 * Handles leaderboard storage and user best streaks
 */

// Initialize Redis client (lazy - only when env vars are present)
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.warn('Upstash Redis not configured - leaderboard disabled');
    return null;
  }
  
  redis = new Redis({ url, token });
  return redis;
}

// Redis key patterns
const KEYS = {
  weeklyLeaderboard: () => `leaderboard:weekly:${getWeekKey()}`,
  globalLeaderboard: () => 'leaderboard:global',
  userBestStreak: (userId: string) => `user:${userId}:best`,
  userProfile: (userId: string) => `user:${userId}:profile`,
  runData: (runId: string) => `run:${runId}`,
};

/**
 * Gets the current week key (YYYY-WW format)
 */
function getWeekKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-${week.toString().padStart(2, '0')}`;
}

/**
 * Submits a run to the leaderboard
 * @param run - Completed run data
 * @param user - User who completed the run
 * @returns Whether submission was successful
 */
export async function submitToLeaderboard(run: Run, user: User): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;
  
  try {
    // Store run data
    await client.set(KEYS.runData(run.runId), JSON.stringify(run), { ex: 60 * 60 * 24 * 7 }); // 7 days
    
    // Store user profile for display
    await client.set(KEYS.userProfile(user.userId), JSON.stringify(user));
    
    // Get user's current best streak
    const currentBest = await client.get<number>(KEYS.userBestStreak(user.userId)) || 0;
    
    // Only update leaderboard if this is a new best
    if (run.streak > currentBest) {
      // Update user's best streak
      await client.set(KEYS.userBestStreak(user.userId), run.streak);
      
      // Add to weekly leaderboard (sorted set, score = streak)
      await client.zadd(KEYS.weeklyLeaderboard(), {
        score: run.streak,
        member: JSON.stringify({
          usedReprieve: run.usedReprieve,
          timestamp: run.timestamp,
          userId: user.userId,
        }),
      });
      
      // Add to global leaderboard
      await client.zadd(KEYS.globalLeaderboard(), {
        score: run.streak,
        member: JSON.stringify({
          usedReprieve: run.usedReprieve,
          timestamp: run.timestamp,
          userId: user.userId,
        }),
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error submitting to leaderboard:', error);
    return false;
  }
}

/**
 * Gets the weekly leaderboard
 * @param limit - Max entries to return
 * @returns Array of leaderboard entries
 */
export async function getWeeklyLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  const client = getRedis();
  if (!client) return [];
  
  try {
    // Get top scores (descending)
    const results = await client.zrange<string[]>(KEYS.weeklyLeaderboard(), 0, limit - 1, {
      rev: true,
      withScores: true,
    });
    
    return await formatLeaderboardResults(results);
  } catch (error) {
    console.error('Error fetching weekly leaderboard:', error);
    return [];
  }
}

/**
 * Gets the global (all-time) leaderboard
 * @param limit - Max entries to return
 * @returns Array of leaderboard entries
 */
export async function getGlobalLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  const client = getRedis();
  if (!client) return [];
  
  try {
    const results = await client.zrange<string[]>(KEYS.globalLeaderboard(), 0, limit - 1, {
      rev: true,
      withScores: true,
    });
    
    return await formatLeaderboardResults(results);
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    return [];
  }
}

/**
 * Gets a user's rank in the weekly leaderboard
 * @param userId - User ID
 * @returns Rank (1-indexed) or null if not found
 */
export async function getUserWeeklyRank(userId: string): Promise<number | null> {
  const client = getRedis();
  if (!client) return null;
  
  try {
    // Get all members to find user
    const results = await client.zrange<string[]>(KEYS.weeklyLeaderboard(), 0, -1, {
      rev: true,
    });
    
    for (let i = 0; i < results.length; i++) {
      const member = JSON.parse(results[i]);
      if (member.userId === userId) {
        return i + 1;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user rank:', error);
    return null;
  }
}

/**
 * Gets a user's best streak
 * @param userId - User ID
 * @returns Best streak or 0
 */
export async function getUserBestStreak(userId: string): Promise<number> {
  const client = getRedis();
  if (!client) return 0;
  
  try {
    const best = await client.get<number>(KEYS.userBestStreak(userId));
    return best || 0;
  } catch (error) {
    console.error('Error fetching user best streak:', error);
    return 0;
  }
}

/**
 * Formats raw Redis results into LeaderboardEntry array
 */
async function formatLeaderboardResults(results: string[]): Promise<LeaderboardEntry[]> {
  const client = getRedis();
  if (!client || results.length === 0) return [];
  
  const entries: LeaderboardEntry[] = [];
  
  // Results come in pairs: [member, score, member, score, ...]
  for (let i = 0; i < results.length; i += 2) {
    const memberStr = results[i];
    const score = parseInt(results[i + 1], 10);
    
    try {
      const member = JSON.parse(memberStr);
      
      // Fetch user profile
      const userJson = await client.get<string>(KEYS.userProfile(member.userId));
      const user: User = userJson 
        ? JSON.parse(userJson as string)
        : { userId: member.userId, userType: 'anon', displayName: 'Unknown' };
      
      entries.push({
        rank: Math.floor(i / 2) + 1,
        user,
        bestStreak: score,
        usedReprieve: member.usedReprieve || false,
        timestamp: member.timestamp || Date.now(),
      });
    } catch {
      // Skip malformed entries
      continue;
    }
  }
  
  return entries;
}

/**
 * Cleans up old weekly leaderboards
 * Should be called periodically
 */
export async function cleanupOldLeaderboards(): Promise<void> {
  const client = getRedis();
  if (!client) return;
  
  // This would be called from a cron job
  // For now, we rely on Redis TTL
  console.log('Leaderboard cleanup would run here');
}

