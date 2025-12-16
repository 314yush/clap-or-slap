import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getTokenPool } from '@/lib/data/token-pool';
import { selectInitialPair } from '@/lib/game-core/sequencing';

/**
 * POST /api/game/start
 * Starts a new game run
 * Returns initial token pair and run ID
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get token pool
    const tokens = await getTokenPool();
    
    if (tokens.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Not enough tokens available' },
        { status: 500 }
      );
    }

    // Select initial pair
    const [currentToken, nextToken] = selectInitialPair(tokens);

    // Generate run ID
    const runId = uuidv4();

    return NextResponse.json({
      success: true,
      runId,
      currentToken,
      nextToken,
    });
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start game' },
      { status: 500 }
    );
  }
}

