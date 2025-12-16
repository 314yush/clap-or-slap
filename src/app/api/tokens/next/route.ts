import { NextRequest, NextResponse } from 'next/server';
import { getTokenPool } from '@/lib/data/token-pool';
import { selectNextToken } from '@/lib/game-core/sequencing';

/**
 * POST /api/tokens/next
 * Gets the next token for comparison
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentTokenId, recentTokenIds = [] } = body;

    // Get token pool
    const tokens = await getTokenPool();
    
    if (tokens.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Not enough tokens available' },
        { status: 500 }
      );
    }

    // Select next token
    const nextToken = selectNextToken(tokens, currentTokenId, recentTokenIds);

    return NextResponse.json({
      success: true,
      nextToken,
    });
  } catch (error) {
    console.error('Error getting next token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get next token' },
      { status: 500 }
    );
  }
}

