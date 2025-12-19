import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getTokenPool } from '@/lib/data/token-pool';
import { 
  generateGameSeed, 
  selectInitialPairSeeded
} from '@/lib/game-core/seeded-selection';
import { selectInitialPair } from '@/lib/game-core/sequencing';
import { getTimerDuration } from '@/lib/game-core/timer';
import { getTierName } from '@/lib/game-core/difficulty';
import { getRedis } from '@/lib/redis';

/**
 * POST /api/game/start
 * Starts a new game run with server-side state tracking
 * Returns initial token pair, run ID, and timer info
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
    console.log('[Game Start API] Fetching token pool...');
    const tokens = await getTokenPool();
    console.log(`[Game Start API] Token pool size: ${tokens.length}`);
    
    if (tokens.length < 2) {
      console.error('[Game Start API] Not enough tokens available:', tokens.length);
      return NextResponse.json(
        { success: false, error: 'Not enough tokens available' },
        { status: 500 }
      );
    }

    // Generate run ID and seed
    const runId = uuidv4();
    const seed = generateGameSeed();

    // Select initial pair using difficulty-aware selection
    console.log('[Game Start API] Selecting initial token pair...');
    let currentToken, nextToken;
    try {
      [currentToken, nextToken] = selectInitialPair(tokens);
      console.log(`[Game Start API] Selected tokens: ${currentToken.symbol} vs ${nextToken.symbol}`);
    } catch (selectError) {
      console.error('[Game Start API] Difficulty selection failed:', selectError);
      // Fallback to seeded selection if difficulty selection fails
      try {
        const pair = selectInitialPairSeeded(tokens, seed);
        if (!pair) {
          console.error('[Game Start API] Seeded selection also failed');
          return NextResponse.json(
            { success: false, error: 'Failed to select initial tokens' },
            { status: 500 }
          );
        }
        currentToken = pair.currentToken;
        nextToken = pair.nextToken;
        console.log(`[Game Start API] Fallback selected: ${currentToken.symbol} vs ${nextToken.symbol}`);
      } catch (fallbackError) {
        console.error('[Game Start API] Fallback selection error:', fallbackError);
        throw fallbackError;
      }
    }

    const startedAt = Date.now();
    const timerDuration = getTimerDuration(0);
    const difficulty = getTierName(0); // Initial difficulty is Easy

    // Store game state in Redis for validation
    const redis = getRedis();
    if (redis) {
      const gameState = {
        runId,
        seed,
        userId,
        startedAt,
        guesses: [],
        currentStreak: 0,
        hasUsedReprieve: false,
        currentTokenId: currentToken.id,
        nextTokenId: nextToken.id,
        roundNumber: 0,
        difficultyTier: difficulty,
        // Store token IDs for this game session
        tokenPoolIds: tokens.map(t => t.id),
      };
      
      // Store with 1 hour TTL (games shouldn't last longer)
      await redis.set(`game:${runId}:state`, JSON.stringify(gameState), { ex: 3600 });
      await redis.set(`game:${runId}:seed`, seed, { ex: 3600 });
    }

    return NextResponse.json({
      success: true,
      runId,
      seed, // Client needs seed for verification
      currentToken,
      nextToken,
      timerDuration,
      startedAt,
      difficulty,
    });
  } catch (error) {
    console.error('[Game Start API] Error starting game:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[Game Start API] Error details:', { errorMessage, errorStack });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to start game',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
