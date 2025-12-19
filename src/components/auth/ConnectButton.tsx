'use client';

import { useAuth } from '@/hooks/useAuth';

interface ConnectButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onConnect?: () => void; // Callback when connection succeeds
}

export function ConnectButton({ className = '', size = 'lg', onConnect }: ConnectButtonProps) {
  const { isReady, isAuthenticated, isLoading, login, address } = useAuth();
  
  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg',
  };
  
  // Show loading state while initializing
  if (!isReady || isLoading) {
    return (
      <button
        disabled
        className={`
          ${sizeClasses[size]}
          rounded-2xl font-bold
          bg-zinc-700 text-zinc-400
          cursor-not-allowed
          ${className}
        `}
      >
        Loading...
      </button>
    );
  }
  
  // Handle connect/login with callback
  const handleConnect = async () => {
    const success = await login();
    if (!success || !onConnect) return;
    
    // Wait for address to be set (state update after login)
    // Poll for address with timeout
    let attempts = 0;
    const maxAttempts = 20; // 2 seconds max wait
    
    const checkAddress = () => {
      attempts++;
      if (address) {
        // Address is set, trigger callback
        setTimeout(() => {
          onConnect();
        }, 200);
      } else if (attempts < maxAttempts) {
        // Keep checking
        setTimeout(checkAddress, 100);
      } else {
        // Timeout - still trigger callback, game will handle empty userId
        console.warn('[ConnectButton] Address not set after login, proceeding anyway');
        onConnect();
      }
    };
    
    checkAddress();
  };
  
  // User is already connected (from previous session) - show "Play Now" button
  if (isAuthenticated && address) {
    return (
      <button
        onClick={onConnect}
        className={`
          ${sizeClasses[size]}
          rounded-2xl font-bold
          bg-gradient-to-r from-amber-500 to-orange-500
          hover:from-amber-400 hover:to-orange-400
          text-white shadow-lg shadow-amber-500/25
          transform transition-all duration-200
          hover:scale-105 active:scale-95
          ${className}
        `}
      >
        Play Now
      </button>
    );
  }
  
  // Not connected - show connect button
  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        rounded-2xl font-bold
        bg-gradient-to-r from-amber-500 to-orange-500
        hover:from-amber-400 hover:to-orange-400
        disabled:from-zinc-600 disabled:to-zinc-600
        text-white shadow-lg shadow-amber-500/25
        transform transition-all duration-200
        hover:scale-105 active:scale-95
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
    >
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}




