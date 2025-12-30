/**
 * Platform Factory
 * Determines which auth provider to use based on the environment
 */

import type { AuthPlatform } from '../types';
import { usePrivyAuthProvider } from './privy';

/**
 * Gets the auth platform for the current environment
 * @returns 'farcaster' for mini-app, 'privy' for desktop/web
 */
export function getAuthPlatform(): AuthPlatform {
  // Desktop/web environment uses Privy
  // Mini-app environment would use Farcaster (but we're in desktop repo)
  // For desktop repo, always return 'privy'
  // In mini-app repo, this would return 'farcaster' for miniapp environment
  return 'privy';
}

/**
 * Creates the appropriate auth provider hook for the current platform
 * Returns the hook function that can be called in useAuth
 */
export function createAuthProvider() {
  const platform = getAuthPlatform();
  
  if (platform === 'privy') {
    // Return the Privy auth provider hook
    return usePrivyAuthProvider;
  }
  
  // Fallback (should not happen in desktop repo)
  throw new Error(`Unsupported auth platform: ${platform}`);
}

