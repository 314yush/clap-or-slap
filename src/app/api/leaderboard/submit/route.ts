import { NextRequest, NextResponse } from 'next/server';
import { submitToLeaderboard, getUserBestStreak } from '@/lib/redis';
import { Run } from '@/lib/game-core/types';
import { getOrCreateUser } from '@/lib/identity';

/**
 * POST /api/leaderboard/submit
 * Submits a completed run to the leaderboard
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { run } = body as { run: Run };

    if (!run || !run.runId || !run.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid run data' },
        { status: 400 }
      );
    }

    // Get user profile (server-side we create a basic one)
    const user = {
      userId: run.userId,
      userType: 'anon' as const,
      displayName: `Player_${run.userId.slice(0, 8)}`,
    };

    // Submit to leaderboard
    const submitted = await submitToLeaderboard(run, user);

    // Get user's best streak
    const bestStreak = await getUserBestStreak(run.userId);

    return NextResponse.json({
      success: submitted,
      isNewBest: run.streak > bestStreak,
      bestStreak: Math.max(run.streak, bestStreak),
    });
  } catch (error) {
    console.error('Error submitting to leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit to leaderboard' },
      { status: 500 }
    );
  }
}

