/**
 * Mock In-Memory Leaderboard for Local Testing
 * Simulates Redis sorted sets for leaderboard functionality
 */

import { ResolvedIdentity } from './auth/identity-resolver';

// In-memory storage
interface LeaderboardEntry {
  userId: string;
  score: number;
  timestamp: number;
}

interface UserProfile {
  address: string;
  displayName: string;
  avatarUrl?: string;
  source: string;
}

// Global state (persists during dev server session)
const globalLeaderboard: LeaderboardEntry[] = [];
const weeklyLeaderboard: LeaderboardEntry[] = [];
const userProfiles: Map<string, UserProfile> = new Map();
const userBestStreaks: Map<string, number> = new Map();

// Mock users with crypto-style names
const MOCK_USERS: UserProfile[] = [
  { address: '0x1234567890abcdef1234567890abcdef12345678', displayName: 'vitalik.eth', avatarUrl: 'https://ui-avatars.com/api/?name=VB&background=627EEA&color=fff', source: 'ens' },
  { address: '0xabcdef1234567890abcdef1234567890abcdef12', displayName: 'punk6529.eth', avatarUrl: 'https://ui-avatars.com/api/?name=P6&background=E91E63&color=fff', source: 'ens' },
  { address: '0x9876543210fedcba9876543210fedcba98765432', displayName: '@dwr.eth', avatarUrl: 'https://ui-avatars.com/api/?name=DW&background=8B5CF6&color=fff', source: 'farcaster' },
  { address: '0xfedcba9876543210fedcba9876543210fedcba98', displayName: 'cobie.eth', avatarUrl: 'https://ui-avatars.com/api/?name=CO&background=F59E0B&color=fff', source: 'ens' },
  { address: '0x1111222233334444555566667777888899990000', displayName: '@jessepollak', avatarUrl: 'https://ui-avatars.com/api/?name=JP&background=3B82F6&color=fff', source: 'farcaster' },
  { address: '0x2222333344445555666677778888999900001111', displayName: 'sassal.eth', avatarUrl: 'https://ui-avatars.com/api/?name=SA&background=10B981&color=fff', source: 'ens' },
  { address: '0x3333444455556666777788889999000011112222', displayName: '@balajis', avatarUrl: 'https://ui-avatars.com/api/?name=BS&background=EF4444&color=fff', source: 'farcaster' },
  { address: '0x4444555566667777888899990000111122223333', displayName: 'hayden.eth', avatarUrl: 'https://ui-avatars.com/api/?name=HA&background=EC4899&color=fff', source: 'ens' },
  { address: '0x5555666677778888999900001111222233334444', displayName: '@cdixon', avatarUrl: 'https://ui-avatars.com/api/?name=CD&background=6366F1&color=fff', source: 'farcaster' },
  { address: '0x6666777788889999000011112222333344445555', displayName: 'pranksy.eth', avatarUrl: 'https://ui-avatars.com/api/?name=PR&background=14B8A6&color=fff', source: 'ens' },
];

// Streaks that are beatable
const MOCK_STREAKS = [15, 14, 12, 11, 10, 9, 8, 7, 6, 5];

// Initialize with mock data on first import
let initialized = false;

export function initializeMockLeaderboard() {
  if (initialized) return;
  
  console.log('[MockLeaderboard] Initializing with mock data...');
  
  MOCK_USERS.forEach((user, i) => {
    const streak = MOCK_STREAKS[i];
    
    // Add to leaderboards
    globalLeaderboard.push({
      userId: user.address,
      score: streak,
      timestamp: Date.now() - (i * 1000 * 60 * 30),
    });
    
    weeklyLeaderboard.push({
      userId: user.address,
      score: streak,
      timestamp: Date.now() - (i * 1000 * 60 * 30),
    });
    
    // Store profile
    userProfiles.set(user.address, user);
    userBestStreaks.set(user.address, streak);
  });
  
  // Sort by score descending
  globalLeaderboard.sort((a, b) => b.score - a.score);
  weeklyLeaderboard.sort((a, b) => b.score - a.score);
  
  initialized = true;
  console.log('[MockLeaderboard] Initialized with', MOCK_USERS.length, 'mock users');
}

// Auto-initialize
initializeMockLeaderboard();

/**
 * Get user's rank (1-indexed)
 */
export function getMockUserRank(userId: string, board: 'global' | 'weekly'): number | null {
  const leaderboard = board === 'global' ? globalLeaderboard : weeklyLeaderboard;
  const index = leaderboard.findIndex(e => e.userId === userId);
  return index === -1 ? null : index + 1;
}

/**
 * Get user profile
 */
export function getMockUserProfile(userId: string): UserProfile | null {
  return userProfiles.get(userId) || null;
}

/**
 * Submit score and detect overtakes
 */
export interface MockOvertakeEvent {
  overtakenUserId: string;
  overtakenUser: ResolvedIdentity;
  previousRank: number;
  newRank: number;
  board: 'global' | 'weekly';
}

export interface MockSubmitResult {
  success: boolean;
  isNewBest: boolean;
  previousRank: number | null;
  newRank: number;
  overtakes: MockOvertakeEvent[];
}

export function submitMockScore(
  userId: string,
  streak: number,
  userIdentity: ResolvedIdentity
): MockSubmitResult {
  initializeMockLeaderboard();
  
  const previousBest = userBestStreaks.get(userId) || 0;
  const isNewBest = streak > previousBest;
  
  if (!isNewBest) {
    const currentRank = getMockUserRank(userId, 'global');
    return {
      success: true,
      isNewBest: false,
      previousRank: currentRank,
      newRank: currentRank || 0,
      overtakes: [],
    };
  }
  
  // Get previous rank
  const previousRank = getMockUserRank(userId, 'global');
  
  // Find users who will be overtaken
  const overtakes: MockOvertakeEvent[] = [];
  
  // Check global leaderboard for overtakes
  for (const entry of globalLeaderboard) {
    if (entry.userId !== userId && entry.score < streak && entry.score >= previousBest) {
      const profile = userProfiles.get(entry.userId);
      if (profile) {
        const entryRank = getMockUserRank(entry.userId, 'global') || 0;
        overtakes.push({
          overtakenUserId: entry.userId,
          overtakenUser: {
            address: profile.address,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            source: profile.source as 'ens' | 'farcaster' | 'basename' | 'address',
          },
          previousRank: previousRank || globalLeaderboard.length + 1,
          newRank: entryRank,
          board: 'global',
        });
      }
    }
  }
  
  // Update or add user's entry
  const existingGlobal = globalLeaderboard.find(e => e.userId === userId);
  if (existingGlobal) {
    existingGlobal.score = streak;
    existingGlobal.timestamp = Date.now();
  } else {
    globalLeaderboard.push({ userId, score: streak, timestamp: Date.now() });
  }
  
  const existingWeekly = weeklyLeaderboard.find(e => e.userId === userId);
  if (existingWeekly) {
    existingWeekly.score = streak;
    existingWeekly.timestamp = Date.now();
  } else {
    weeklyLeaderboard.push({ userId, score: streak, timestamp: Date.now() });
  }
  
  // Re-sort
  globalLeaderboard.sort((a, b) => b.score - a.score);
  weeklyLeaderboard.sort((a, b) => b.score - a.score);
  
  // Update best streak
  userBestStreaks.set(userId, streak);
  
  // Store user profile
  userProfiles.set(userId, {
    address: userIdentity.address,
    displayName: userIdentity.displayName,
    avatarUrl: userIdentity.avatarUrl,
    source: userIdentity.source,
  });
  
  const newRank = getMockUserRank(userId, 'global') || 0;
  
  // Limit overtakes to top 5 for cleaner UI
  return {
    success: true,
    isNewBest: true,
    previousRank,
    newRank,
    overtakes: overtakes.slice(0, 5),
  };
}

/**
 * Get leaderboard entries
 */
export function getMockLeaderboard(board: 'global' | 'weekly', limit: number = 20) {
  initializeMockLeaderboard();
  
  const leaderboard = board === 'global' ? globalLeaderboard : weeklyLeaderboard;
  
  return leaderboard.slice(0, limit).map((entry, index) => {
    const profile = userProfiles.get(entry.userId);
    return {
      rank: index + 1,
      userId: entry.userId,
      displayName: profile?.displayName || entry.userId.slice(0, 10) + '...',
      avatarUrl: profile?.avatarUrl,
      streak: entry.score,
      timestamp: entry.timestamp,
    };
  });
}

/**
 * Check if Redis is available, otherwise use mock
 */
export function shouldUseMock(): boolean {
  return !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN;
}

