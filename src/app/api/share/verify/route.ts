import { NextRequest, NextResponse } from 'next/server';
import {
  getShareToken,
  markShareTokenUsed,
  verifyFarcasterShare,
  getFidFromAddress,
} from '@/lib/social/farcaster-verify';

/**
 * POST /api/share/verify
 * 
 * Verifies that a user posted about CapOrSlap on Farcaster.
 * Called after user clicks "I shared it".
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, fid, walletAddress } = body;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Share token required',
      }, { status: 400 });
    }
    
    // Get share token from Redis
    const shareToken = await getShareToken(token);
    
    if (!shareToken) {
      return NextResponse.json({
        success: false,
        error: 'Share token not found or expired',
      }, { status: 404 });
    }
    
    // Check if already used
    if (shareToken.used) {
      return NextResponse.json({
        success: false,
        error: 'Share token already used',
      }, { status: 400 });
    }
    
    // Check expiration
    if (Date.now() > shareToken.expiresAt) {
      return NextResponse.json({
        success: false,
        error: 'Share token expired',
      }, { status: 400 });
    }
    
    // Determine FID to verify against
    let fidToVerify = fid || shareToken.fid;
    
    // If no FID but have wallet, try to look it up
    if (!fidToVerify && walletAddress) {
      fidToVerify = await getFidFromAddress(walletAddress) ?? undefined;
    }
    
    // If we still don't have FID, we can't verify on-chain
    // In dev mode, allow it through
    if (!fidToVerify) {
      // Allow without verification in dev/test mode
      if (process.env.NODE_ENV === 'development' || !process.env.NEYNAR_API_KEY) {
        await markShareTokenUsed(token);
        return NextResponse.json({
          success: true,
          verified: true,
          message: 'Share verified (dev mode)',
        });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Could not find Farcaster account. Make sure your wallet is connected to Farcaster.',
      }, { status: 400 });
    }
    
    // Verify the share was posted
    const result = await verifyFarcasterShare(fidToVerify, shareToken.createdAt);
    
    if (result.verified) {
      // Mark token as used
      await markShareTokenUsed(token);
      
      return NextResponse.json({
        success: true,
        verified: true,
        castHash: result.castHash,
      });
    }
    
    // Not verified yet
    return NextResponse.json({
      success: true,
      verified: false,
      error: result.error || 'Cast not found. Make sure to include "CapOrSlap" in your post.',
    });
    
  } catch (error) {
    console.error('[Share Verify] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Verification failed',
    }, { status: 500 });
  }
}

