'use client';

import { useEffect, useState } from 'react';

export interface LiveOvertakeData {
  overtakenUserId: string;
  overtakenUser: {
    address: string;
    displayName: string;
    avatarUrl?: string;
    source: string;
  };
  theirStreak: number;
  yourStreak: number;
}

interface LiveOvertakeToastProps {
  overtake: LiveOvertakeData;
  onDismiss: () => void;
}

export function LiveOvertakeToast({ overtake, onDismiss }: LiveOvertakeToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in immediately
    requestAnimationFrame(() => setIsVisible(true));
    
    // Auto-dismiss after 2 seconds
    const dismissTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 200);
    }, 2000);

    return () => clearTimeout(dismissTimer);
  }, [onDismiss]);

  return (
    <div
      className={`
        fixed top-1/2 -translate-y-1/2 right-0 z-50
        transition-all duration-200 ease-out
        ${isVisible && !isExiting 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 translate-x-full'
        }
      `}
    >
      <div className="
        flex items-center gap-2 px-3 py-1.5
        bg-amber-500/90 text-black
        text-xs font-medium
        rounded-l-full
        shadow-lg
      ">
        <span>⚡</span>
        <span>Passed {overtake.overtakenUser.displayName}</span>
      </div>
    </div>
  );
}

interface LiveOvertakeQueueProps {
  overtakes: LiveOvertakeData[];
  onClear: () => void;
}

export function LiveOvertakeQueue({ overtakes, onClear }: LiveOvertakeQueueProps) {
  const [queue, setQueue] = useState<LiveOvertakeData[]>([]);
  const [currentOvertake, setCurrentOvertake] = useState<LiveOvertakeData | null>(null);

  useEffect(() => {
    if (overtakes.length > 0) {
      setQueue(prev => [...prev, ...overtakes]);
    }
  }, [overtakes]);

  useEffect(() => {
    if (!currentOvertake && queue.length > 0) {
      setCurrentOvertake(queue[0]);
      setQueue(prev => prev.slice(1));
    }
  }, [currentOvertake, queue]);

  const handleDismiss = () => {
    setCurrentOvertake(null);
    if (queue.length === 0) {
      onClear();
    }
  };

  if (!currentOvertake) return null;

  return (
    <LiveOvertakeToast
      overtake={currentOvertake}
      onDismiss={handleDismiss}
    />
  );
}
