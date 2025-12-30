/**
 * Overtake Detection System
 * Detects when a player passes other players on the leaderboard
 */

import { Redis } from '@upstash/redis';
import { ResolvedIdentity, resolveIdentity } from '@/lib/auth/identity-resolver';
import { incrementWeeklyAttempts, calculateWeeklyScore } from './weekly-score';

export interface OvertakeEvent {
  overtakenUserId: string;
  overtakenUser: ResolvedIdentity;
  previousRank: number;
  newRank: number;
  board: 'global' | 'weekly';
}

export interface LeaderboardSubmitResult {
  success: boolean;
  isNewBest: boolean;
  previousRank: number | null;
  newRank: number;
  overtakes: OvertakeEvent[];
}

// Redis key patterns
const KEYS = {
  globalLeaderboard: 'leaderboard:global',
  weeklyLeaderboard: () => `leaderboard:weekly:${getWeekKey()}`,
  userRankGlobal: (userId: string) => `user:${userId}:rank:global`,
  userRankWeekly: (userId: string) => `user:${userId}:rank:weekly`,
  userProfile: (userId: string) => `user:${userId}:profile`,
};

function getWeekKey(): string {
  const now = new Date();
  const utcDate = new Date(now.toISOString());
  
  // Get the current day of week (0 = Sunday, 6 = Saturday)
  const day = utcDate.getUTCDay();
  
  // Calculate days to subtract to get to the most recent Sunday
  const daysToSunday = day === 0 ? 0 : day;
  const sunday = new Date(utcDate);
  sunday.setUTCDate(utcDate.getUTCDate() - daysToSunday);
  sunday.setUTCHours(0, 0, 0, 0);
  
  // Calculate week number from start of year
  const year = sunday.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  
  // Find the first Sunday of the year
  const firstSundayDay = startOfYear.getUTCDay();
  const daysToFirstSunday = firstSundayDay === 0 ? 0 : 7 - firstSundayDay;
  const firstSunday = new Date(startOfYear);
  firstSunday.setUTCDate(1 + daysToFirstSunday);
  firstSunday.setUTCHours(0, 0, 0, 0);
  
  // Calculate weeks since first Sunday
  const daysSinceFirstSunday = Math.floor((sunday.getTime() - firstSunday.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.floor(daysSinceFirstSunday / 7) + 1;
  
  return `${year}-${week.toString().padStart(2, '0')}`;
}

/**
 * Get user's current rank in a leaderboard
 */
export async function getUserRank(
  redis: Redis,
  userId: string,
  board: 'global' | 'weekly'
): Promise<number | null> {
  const key = board === 'global' ? KEYS.globalLeaderboard : KEYS.weeklyLeaderboard();
  
  try {
    const rank = await redis.zrevrank(key, userId);
    return rank !== null ? rank + 1 : null; // Convert 0-indexed to 1-indexed
  } catch {
    return null;
  }
}

/**
 * Find users between two ranks
 * Returns user IDs that would be overtaken
 */
export async function findOvertakenUsers(
  redis: Redis,
  board: 'global' | 'weekly',
  oldRank: number | null,
  newRank: number
): Promise<string[]> {
  const key = board === 'global' ? KEYS.globalLeaderboard : KEYS.weeklyLeaderboard();
  
  // If no old rank, user wasn't on board - they overtook everyone below them
  const startRank = oldRank ? oldRank - 1 : 100; // Max 100 overtakes
  const endRank = newRank - 1;
  
  if (startRank <= endRank) {
    return []; // No overtakes
  }
  
  try {
    // Get users in the range that would be overtaken
    // zrevrange gets members by descending score (highest first)
    const overtaken = await redis.zrange(key, newRank - 1, startRank - 1, { rev: true });
    return overtaken as string[];
  } catch {
    return [];
  }
}

/**
 * Detect overtakes when submitting a new score
 */
export async function detectOvertakes(
  redis: Redis,
  userId: string,
  newScore: number, // For weekly this is calculated score, for global this is streak
  board: 'global' | 'weekly'
): Promise<OvertakeEvent[]> {
  const key = board === 'global' ? KEYS.globalLeaderboard : KEYS.weeklyLeaderboard();
  
  // Get user's current rank before update
  const oldRank = await getUserRank(redis, userId, board);
  
  // Get current score (if exists)
  const currentScore = await redis.zscore(key, userId);
  
  // Only check for overtakes if new score is better
  if (currentScore !== null && newScore <= Number(currentScore)) {
    return [];
  }
  
  // Calculate new rank (approximately)
  // Count how many users have a score >= newScore
  const usersAbove = await redis.zcount(key, newScore, '+inf');
  const newRank = usersAbove + 1;
  
  // Find who would be overtaken
  const overtakenUserIds = await findOvertakenUsers(redis, board, oldRank, newRank);
  
  // Limit to 10 overtakes max for performance
  const limitedOvertakes = overtakenUserIds.slice(0, 10);
  
  // Resolve identities for overtaken users
  const overtakes: OvertakeEvent[] = [];
  
  for (let i = 0; i < limitedOvertakes.length; i++) {
    const overtakenId = limitedOvertakes[i];
    if (overtakenId === userId) continue; // Don't count self
    
    try {
      // Try to get cached identity first
      const cachedProfile = await redis.get(KEYS.userProfile(overtakenId));
      let identity: ResolvedIdentity;
      
      if (cachedProfile) {
        identity = JSON.parse(cachedProfile as string);
      } else {
        // Resolve identity (works for wallet addresses)
        identity = await resolveIdentity(overtakenId);
      }
      
      overtakes.push({
        overtakenUserId: overtakenId,
        overtakenUser: identity,
        previousRank: oldRank || 0,
        newRank: newRank + i, // Approximate position of overtaken user
        board,
      });
    } catch {
      // Skip if can't resolve identity
      continue;
    }
  }
  
  return overtakes;
}

/**
 * Submit score and detect all overtakes
 */
export async function submitScoreWithOvertakes(
  redis: Redis,
  userId: string,
  streak: number,
  userIdentity: ResolvedIdentity
): Promise<LeaderboardSubmitResult> {
  const globalKey = KEYS.globalLeaderboard;
  const weekKey = getWeekKey();
  const weeklyKey = KEYS.weeklyLeaderboard();
  
  try {
    // Get previous best streak for global leaderboard
    const previousBest = await redis.zscore(globalKey, userId);
    const isNewBest = previousBest === null || streak > Number(previousBest);
    
    // Always track attempts and update weekly leaderboard (even if not new best for global)
    // Increment weekly attempts
    const attempts = await incrementWeeklyAttempts(redis, userId, weekKey);
    
    // Calculate weekly score: (Streak × 10) + Attempts
    const weeklyScore = calculateWeeklyScore(streak, attempts);
    
    // Get previous weekly score
    const previousWeeklyScore = await redis.zscore(weeklyKey, userId);
    const isNewWeeklyBest = previousWeeklyScore === null || weeklyScore > Number(previousWeeklyScore);
    
    if (!isNewBest && !isNewWeeklyBest) {
      // Not a new best for either leaderboard, but we still tracked the attempt
      const currentRank = await getUserRank(redis, userId, 'global');
      return {
        success: true,
        isNewBest: false,
        previousRank: currentRank,
        newRank: currentRank || 0,
        overtakes: [],
      };
    }
    
    // Get previous rank
    const previousRank = await getUserRank(redis, userId, 'global');
    
    // Detect overtakes before updating
    // For global: use streak
    // For weekly: use calculated score
    const globalOvertakes = isNewBest 
      ? await detectOvertakes(redis, userId, streak, 'global')
      : [];
    const weeklyOvertakes = isNewWeeklyBest
      ? await detectOvertakes(redis, userId, weeklyScore, 'weekly')
      : [];
    
    // Update leaderboards
    // Global: use streak (unchanged)
    if (isNewBest) {
      await redis.zadd(globalKey, { score: streak, member: userId });
    }
    
    // Weekly: use calculated score
    if (isNewWeeklyBest) {
      await redis.zadd(weeklyKey, { score: weeklyScore, member: userId });
    }
    
    // Cache user identity for others to see
    await redis.set(KEYS.userProfile(userId), JSON.stringify(userIdentity), { ex: 86400 * 7 });
    
    // Get new rank
    const newRank = await getUserRank(redis, userId, 'global') || 0;
    
    // Store user's new rank for future overtake detection
    await redis.set(KEYS.userRankGlobal(userId), newRank);
    await redis.set(KEYS.userRankWeekly(userId), await getUserRank(redis, userId, 'weekly') || 0);
    
    // Combine overtakes
    const allOvertakes = [...globalOvertakes, ...weeklyOvertakes];
    
    // Deduplicate (same user might be in both)
    const uniqueOvertakes = allOvertakes.filter((overtake, index, self) =>
      index === self.findIndex(o => o.overtakenUserId === overtake.overtakenUserId)
    );
    
    return {
      success: true,
      isNewBest: true,
      previousRank,
      newRank,
      overtakes: uniqueOvertakes,
    };
  } catch (error) {
    // If Redis connection fails, return a safe fallback
    console.error('[Leaderboard] Redis error in submitScoreWithOvertakes:', error);
    return {
      success: false,
      isNewBest: false,
      previousRank: null,
      newRank: 0,
      overtakes: [],
    };
  }
}

