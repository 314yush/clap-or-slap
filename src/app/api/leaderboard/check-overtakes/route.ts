import { NextRequest, NextResponse } from 'next/server';
import { getMockLeaderboard, getMockUserProfile, shouldUseMock } from '@/lib/mock-leaderboard';
import { ResolvedIdentity } from '@/lib/auth/identity-resolver';

export interface LiveOvertake {
  overtakenUserId: string;
  overtakenUser: ResolvedIdentity;
  theirStreak: number;
  yourStreak: number;
}

/**
 * POST /api/leaderboard/check-overtakes
 * Checks if current streak overtakes anyone on the leaderboard
 * Called after each correct guess to show real-time notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, currentStreak, previousStreak } = body as {
      userId: string;
      currentStreak: number;
      previousStreak: number;
    };

    if (!userId || currentStreak === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or currentStreak' },
        { status: 400 }
      );
    }

    // Only check for overtakes if streak increased
    if (currentStreak <= previousStreak) {
      return NextResponse.json({ success: true, overtakes: [] });
    }

    const overtakes: LiveOvertake[] = [];

    if (shouldUseMock()) {
      // Get leaderboard entries
      const leaderboard = getMockLeaderboard('global', 50);
      
      // Find users whose streak is between previousStreak and currentStreak
      // These are the people we just overtook
      for (const entry of leaderboard) {
        if (entry.userId === userId) continue; // Skip self
        
        // If their streak is less than our current streak but >= our previous streak
        // We just passed them!
        if (entry.streak < currentStreak && entry.streak >= previousStreak) {
          const profile = getMockUserProfile(entry.userId);
          overtakes.push({
            overtakenUserId: entry.userId,
            overtakenUser: {
              address: entry.userId,
              displayName: profile?.displayName || entry.displayName,
              avatarUrl: profile?.avatarUrl || entry.avatarUrl,
              source: (profile?.source as 'ens' | 'farcaster' | 'basename' | 'address') || 'address',
            },
            theirStreak: entry.streak,
            yourStreak: currentStreak,
          });
        }
      }
    }

    // Sort by streak descending (show highest overtaken first)
    overtakes.sort((a, b) => b.theirStreak - a.theirStreak);

    return NextResponse.json({
      success: true,
      overtakes: overtakes.slice(0, 3), // Max 3 notifications at once
    });
  } catch (error) {
    console.error('Error checking overtakes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check overtakes' },
      { status: 500 }
    );
  }
}

