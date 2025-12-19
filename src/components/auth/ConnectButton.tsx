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
    await login();
    // After login succeeds, trigger callback to start game
    if (onConnect) {
      // Small delay to ensure state updates
      setTimeout(() => {
        onConnect();
      }, 100);
    }
  };
  
  // User is connected - show "Play Now" button (per Base onboarding: don't show address, start game)
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
      Connect Wallet
    </button>
  );
}




