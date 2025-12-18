import { NextResponse } from 'next/server';

/**
 * Farcaster Mini-App Manifest
 * 
 * This manifest is required for Base mini-app integration.
 * Served at: https://your-domain.com/.well-known/farcaster.json
 * 
 * After deploying, you need to:
 * 1. Visit https://build.base.org/tools/account-association
 * 2. Enter your domain to generate accountAssociation credentials
 * 3. Update the accountAssociation fields below
 */

// Get the base URL from environment
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://caporslap.com';

// Manifest configuration
const manifest = {
  // Account association - UPDATE AFTER DOMAIN VERIFICATION
  // Generate these at: https://build.base.org/tools/account-association
  accountAssociation: {
    header: '', // Will be populated after domain verification
    payload: '', // Will be populated after domain verification
    signature: '', // Will be populated after domain verification
  },
  
  // Mini-app configuration
  miniapp: {
    version: '1',
    name: 'CapOrSlap',
    homeUrl: APP_URL,
    iconUrl: `${APP_URL}/images/miniapp/icon-512.png`,
    splashImageUrl: `${APP_URL}/images/miniapp/splash-1200.png`,
    splashBackgroundColor: '#09090b',
    
    // App store metadata
    subtitle: 'Higher or Lower • Crypto Edition',
    description: 'A fast, social, skill-based crypto market cap guessing game. Compare two tokens, guess which has the higher market cap, build streaks, and compete on global leaderboards!',
    
    // Screenshots for app store
    screenshotUrls: [
      `${APP_URL}/images/miniapp/screenshots/screenshot-1-landing.png`,
      `${APP_URL}/images/miniapp/screenshots/screenshot-2-gameplay.png`,
      `${APP_URL}/images/miniapp/screenshots/screenshot-3-leaderboard.png`,
      `${APP_URL}/images/miniapp/screenshots/screenshot-4-loss.png`,
      `${APP_URL}/images/miniapp/screenshots/screenshot-5-streak.png`,
    ],
    
    // Categorization
    primaryCategory: 'games',
    tags: ['crypto', 'game', 'trading', 'competition', 'market-cap', 'base'],
    
    // Social/OG metadata
    heroImageUrl: `${APP_URL}/images/miniapp/hero-1200x630.png`,
    tagline: 'Guess the market cap. Beat your streak.',
    ogTitle: 'CapOrSlap',
    ogDescription: 'Can you guess the crypto market cap? Play now and compete globally!',
    ogImageUrl: `${APP_URL}/images/miniapp/hero-1200x630.png`,
    
    // Webhook for notifications (optional)
    // webhookUrl: `${APP_URL}/api/webhook`,
    
    // Set to true during development to hide from search
    noindex: false,
  },
};

export async function GET() {
  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
