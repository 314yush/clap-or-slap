import { NextRequest, NextResponse } from 'next/server';
import { getTokenPool } from '@/lib/data/token-pool';
import { selectTokenWithBossRound, isBossRound } from '@/lib/game-core/difficulty';

/**
 * POST /api/tokens/next
 * Gets the next token for comparison
 * Now uses difficulty-based selection based on streak
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentTokenId, recentTokenIds = [], streak = 0 } = body;

    // Get token pool
    const tokens = await getTokenPool();
    
    if (tokens.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Not enough tokens available' },
        { status: 500 }
      );
    }

    // Find current token for difficulty calculation
    const currentToken = tokens.find(t => t.id === currentTokenId);
    
    if (!currentToken) {
      return NextResponse.json(
        { success: false, error: 'Current token not found' },
        { status: 400 }
      );
    }

    // Select next token with difficulty-based selection
    const nextToken = selectTokenWithBossRound(
      tokens,
      currentToken,
      streak,
      recentTokenIds
    );

    return NextResponse.json({
      success: true,
      nextToken,
      isBossRound: isBossRound(streak + 1), // Next round might be boss
    });
  } catch (error) {
    console.error('Error getting next token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get next token' },
      { status: 500 }
    );
  }
}

