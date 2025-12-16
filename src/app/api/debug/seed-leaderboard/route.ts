import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

/**
 * DEBUG ONLY: Seeds mock data into the leaderboard for testing overtakes
 * POST /api/debug/seed-leaderboard
 */

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    return null;
  }
  
  return new Redis({ url, token });
}

// Mock users with crypto-style names
const MOCK_USERS = [
  { userId: '0x1234567890abcdef1234567890abcdef12345678', displayName: 'vitalik.eth', avatarUrl: 'https://ui-avatars.com/api/?name=VB&background=627EEA&color=fff' },
  { userId: '0xabcdef1234567890abcdef1234567890abcdef12', displayName: 'punk6529.eth', avatarUrl: 'https://ui-avatars.com/api/?name=P6&background=E91E63&color=fff' },
  { userId: '0x9876543210fedcba9876543210fedcba98765432', displayName: '@dwr.eth', avatarUrl: 'https://ui-avatars.com/api/?name=DW&background=8B5CF6&color=fff' },
  { userId: '0xfedcba9876543210fedcba9876543210fedcba98', displayName: 'cobie.eth', avatarUrl: 'https://ui-avatars.com/api/?name=CO&background=F59E0B&color=fff' },
  { userId: '0x1111222233334444555566667777888899990000', displayName: '@jessepollak', avatarUrl: 'https://ui-avatars.com/api/?name=JP&background=3B82F6&color=fff' },
  { userId: '0x2222333344445555666677778888999900001111', displayName: 'sassal.eth', avatarUrl: 'https://ui-avatars.com/api/?name=SA&background=10B981&color=fff' },
  { userId: '0x3333444455556666777788889999000011112222', displayName: '@balajis', avatarUrl: 'https://ui-avatars.com/api/?name=BS&background=EF4444&color=fff' },
  { userId: '0x4444555566667777888899990000111122223333', displayName: 'hayden.eth', avatarUrl: 'https://ui-avatars.com/api/?name=HA&background=EC4899&color=fff' },
  { userId: '0x5555666677778888999900001111222233334444', displayName: '@cdixon', avatarUrl: 'https://ui-avatars.com/api/?name=CD&background=6366F1&color=fff' },
  { userId: '0x6666777788889999000011112222333344445555', displayName: 'pranksy.eth', avatarUrl: 'https://ui-avatars.com/api/?name=PR&background=14B8A6&color=fff' },
];

// Generate streaks that are beatable (around 5-15 range)
const MOCK_STREAKS = [15, 14, 12, 11, 10, 9, 8, 7, 6, 5];

function getWeekKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-${week.toString().padStart(2, '0')}`;
}

export async function POST() {
  try {
    const redis = getRedis();
    if (!redis) {
      return NextResponse.json(
        { success: false, error: 'Redis not configured - set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN' },
        { status: 500 }
      );
    }
    
    const weeklyKey = `leaderboard:weekly:${getWeekKey()}`;
    const globalKey = 'leaderboard:global';
    
    // Seed each mock user
    for (let i = 0; i < MOCK_USERS.length; i++) {
      const user = MOCK_USERS[i];
      const streak = MOCK_STREAKS[i];
      
      // Store user profile (this is used by overtake detection to show names)
      await redis.set(`user:${user.userId}:profile`, JSON.stringify({
        address: user.userId,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        source: 'ens',
      }));
      
      // Store user best streak
      await redis.set(`user:${user.userId}:best`, streak);
      
      // Add to weekly leaderboard
      // IMPORTANT: The member is just the userId, not a JSON object
      // This matches the format used by submitScoreWithOvertakes
      await redis.zadd(weeklyKey, {
        score: streak,
        member: user.userId,
      });
      
      // Add to global leaderboard
      await redis.zadd(globalKey, {
        score: streak,
        member: user.userId,
      });
      
      // Store user's rank cache
      await redis.set(`user:${user.userId}:rank:global`, i + 1);
      await redis.set(`user:${user.userId}:rank:weekly`, i + 1);
    }
    
    return NextResponse.json({
      success: true,
      message: `Seeded ${MOCK_USERS.length} mock users to leaderboard`,
      leaderboard: MOCK_USERS.map((u, i) => ({
        rank: i + 1,
        name: u.displayName,
        streak: MOCK_STREAKS[i],
      })),
      hint: 'Get streak 6+ to pass pranksy.eth (#10), streak 8+ to pass hayden.eth (#8), etc.',
    });
    
  } catch (error) {
    console.error('Error seeding leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed leaderboard' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const redis = getRedis();
    if (!redis) {
      return NextResponse.json(
        { success: false, error: 'Redis not configured' },
        { status: 500 }
      );
    }
    
    const weeklyKey = `leaderboard:weekly:${getWeekKey()}`;
    const globalKey = 'leaderboard:global';
    
    // Delete leaderboards
    await redis.del(weeklyKey);
    await redis.del(globalKey);
    
    // Delete mock user profiles
    for (const user of MOCK_USERS) {
      await redis.del(`user:${user.userId}:profile`);
      await redis.del(`user:${user.userId}:best`);
      await redis.del(`user:${user.userId}:rank:global`);
      await redis.del(`user:${user.userId}:rank:weekly`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cleared mock leaderboard data',
    });
    
  } catch (error) {
    console.error('Error clearing leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear leaderboard' },
      { status: 500 }
    );
  }
}

// GET - View current leaderboard state
export async function GET() {
  try {
    const redis = getRedis();
    if (!redis) {
      return NextResponse.json(
        { success: false, error: 'Redis not configured' },
        { status: 500 }
      );
    }
    
    const weeklyKey = `leaderboard:weekly:${getWeekKey()}`;
    const globalKey = 'leaderboard:global';
    
    const globalLeaderboard = await redis.zrange(globalKey, 0, 19, { 
      rev: true, 
      withScores: true 
    });
    
    const weeklyLeaderboard = await redis.zrange(weeklyKey, 0, 19, { 
      rev: true, 
      withScores: true 
    });
    
    // Format results
    const formatEntries = async (entries: (string | number)[]) => {
      const results = [];
      for (let i = 0; i < entries.length; i += 2) {
        const userId = entries[i] as string;
        const score = entries[i + 1] as number;
        
        const profile = await redis.get(`user:${userId}:profile`);
        const parsed = profile ? JSON.parse(profile as string) : null;
        
        results.push({
          rank: Math.floor(i / 2) + 1,
          userId: userId.slice(0, 10) + '...',
          displayName: parsed?.displayName || 'Unknown',
          streak: score,
        });
      }
      return results;
    };
    
    return NextResponse.json({
      success: true,
      global: await formatEntries(globalLeaderboard as (string | number)[]),
      weekly: await formatEntries(weeklyLeaderboard as (string | number)[]),
    });
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
