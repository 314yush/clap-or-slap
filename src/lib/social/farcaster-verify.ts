/**
 * Farcaster Verification for Share-to-Reprieve
 * 
 * Uses Neynar API to verify user posts about CapOrSlap
 */

import { Redis } from '@upstash/redis';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2';

// Redis for share token storage
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) return null;
  
  redis = new Redis({ url, token });
  return redis;
}

export interface ShareToken {
  token: string;
  userId: string;
  runId: string;
  streak: number;
  fid?: number; // Farcaster ID
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export interface VerifyShareResult {
  success: boolean;
  verified: boolean;
  castHash?: string;
  error?: string;
}

/**
 * Generate a share token for tracking
 */
export async function generateShareToken(
  userId: string,
  runId: string,
  streak: number,
  fid?: number
): Promise<ShareToken> {
  const token = `share_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  const shareToken: ShareToken = {
    token,
    userId,
    runId,
    streak,
    fid,
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    used: false,
  };
  
  // Store in Redis
  const client = getRedis();
  if (client) {
    await client.set(
      `share:${token}`,
      JSON.stringify(shareToken),
      { ex: 600 } // 10 min TTL
    );
  }
  
  return shareToken;
}

/**
 * Get share token from Redis
 */
export async function getShareToken(token: string): Promise<ShareToken | null> {
  const client = getRedis();
  if (!client) return null;
  
  const data = await client.get<string>(`share:${token}`);
  if (!data) return null;
  
  return JSON.parse(data) as ShareToken;
}

/**
 * Mark share token as used
 */
export async function markShareTokenUsed(token: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  
  const shareToken = await getShareToken(token);
  if (shareToken) {
    shareToken.used = true;
    await client.set(
      `share:${token}`,
      JSON.stringify(shareToken),
      { ex: 60 } // Short TTL after used
    );
  }
}

/**
 * Generate cast text for sharing
 */
export function generateCastText(streak: number, tokenSymbol?: string): string {
  const base = `Just got rekt at streak ${streak} on CapOrSlap 💀`;
  
  if (tokenSymbol) {
    return `${base}\n\nThought ${tokenSymbol} was the play... 😭\n\ncaporslap.xyz`;
  }
  
  return `${base}\n\ncaporslap.xyz`;
}

/**
 * Get Warpcast share URL
 */
export function getWarpcastShareUrl(text: string): string {
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
}

/**
 * Verify a cast was posted by a user
 * Uses Neynar API to check recent casts from user
 */
export async function verifyFarcasterShare(
  fid: number,
  sinceTimestamp: number
): Promise<VerifyShareResult> {
  if (!NEYNAR_API_KEY) {
    console.warn('[Farcaster] NEYNAR_API_KEY not set - skipping verification');
    return {
      success: true,
      verified: true, // Allow in dev mode
    };
  }
  
  try {
    // Fetch recent casts from user
    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/feed/user/${fid}/casts?limit=5`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY,
        },
      }
    );
    
    if (!response.ok) {
      console.error('[Farcaster] API error:', response.status);
      return {
        success: false,
        verified: false,
        error: 'Failed to verify cast',
      };
    }
    
    const data = await response.json();
    const casts = data.casts || [];
    
    // Look for a cast that mentions CapOrSlap posted after the share token was created
    for (const cast of casts) {
      const castTimestamp = new Date(cast.timestamp).getTime();
      
      // Must be after we generated the share token
      if (castTimestamp < sinceTimestamp) continue;
      
      // Check if cast mentions CapOrSlap or caporslap
      const text = cast.text.toLowerCase();
      if (text.includes('caporslap') || text.includes('cap or slap')) {
        return {
          success: true,
          verified: true,
          castHash: cast.hash,
        };
      }
    }
    
    return {
      success: true,
      verified: false,
      error: 'No matching cast found. Make sure to include "CapOrSlap" in your cast.',
    };
    
  } catch (error) {
    console.error('[Farcaster] Verification error:', error);
    return {
      success: false,
      verified: false,
      error: 'Verification failed',
    };
  }
}

/**
 * Get user's Farcaster ID from their custody address
 */
export async function getFidFromAddress(address: string): Promise<number | null> {
  if (!NEYNAR_API_KEY) {
    console.warn('[Farcaster] NEYNAR_API_KEY not set');
    return null;
  }
  
  try {
    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/user/by_verification?address=${address}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY,
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.user?.fid || null;
    
  } catch (error) {
    console.error('[Farcaster] FID lookup error:', error);
    return null;
  }
}

