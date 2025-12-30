/**
 * Auth Abstraction Types
 * Unified authentication interface for supporting multiple platforms
 * (Farcaster mini-app and Privy desktop)
 */

export interface PlatformUser {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  platform: 'farcaster' | 'privy' | 'anonymous';
  // Platform-specific fields
  fid?: number; // Farcaster ID
  username?: string; // Farcaster username
  walletAddress?: string; // Privy wallet address
}

export interface AuthProvider {
  isReady: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  user: PlatformUser | null;
  token: string | null;
  login: () => Promise<void>;
  logout: () => void;
}

export type AuthPlatform = 'farcaster' | 'privy';





