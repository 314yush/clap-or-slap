import { NextRequest, NextResponse } from 'next/server';
import {
  generateShareToken,
  generateCastText,
  getWarpcastShareUrl,
  getFidFromAddress,
} from '@/lib/social/farcaster-verify';
import { getReprieveType } from '@/lib/game-core/reprieve';

/**
 * POST /api/share/initiate
 * 
 * Initiates a share-to-reprieve flow.
 * Returns share token and Warpcast URL.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, runId, streak, walletAddress, lastTokenSymbol } = body;
    
    // Validate that user is eligible for share reprieve
    const reprieveType = getReprieveType(streak, false);
    if (reprieveType !== 'share') {
      return NextResponse.json({
        success: false,
        error: streak >= 5 
          ? 'Streak too high for share reprieve. Use paid reprieve instead.'
          : 'Share reprieve not available',
      }, { status: 400 });
    }
    
    // Try to get user's Farcaster ID if they have wallet
    let fid: number | undefined;
    if (walletAddress) {
      const userFid = await getFidFromAddress(walletAddress);
      if (userFid) fid = userFid;
    }
    
    // Generate share token
    const shareToken = await generateShareToken(userId, runId, streak, fid);
    
    // Generate cast text
    const castText = generateCastText(streak, lastTokenSymbol);
    
    // Get Warpcast share URL
    const shareUrl = getWarpcastShareUrl(castText);
    
    return NextResponse.json({
      success: true,
      token: shareToken.token,
      shareUrl,
      castText,
      fid,
      expiresAt: shareToken.expiresAt,
    });
    
  } catch (error) {
    console.error('[Share Initiate] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initiate share',
    }, { status: 500 });
  }
}

