/**
 * Timer System for CapOrSlap
 * Timer decreases as streak increases
 */

export interface TimerConfig {
  duration: number;      // Seconds for this tier
  tier: string;          // Tier name for display
  warningAt: number;     // When to show warning (percentage remaining)
  criticalAt: number;    // When to show critical (percentage remaining)
}

/**
 * Get timer configuration based on current streak
 * 
 * Timer curve designed for exponential pressure:
 * Streak 0-4:   60s (learning phase)
 * Streak 5-9:   45s (engaged)
 * Streak 10-14: 30s (pressure builds)
 * Streak 15-19: 20s (intense)
 * Streak 20+:   12s (legendary)
 */
export function getTimerConfig(streak: number): TimerConfig {
  if (streak < 5) {
    return {
      duration: 60,
      tier: 'Warmup',
      warningAt: 0.5,    // 30s
      criticalAt: 0.25,  // 15s
    };
  }
  
  if (streak < 10) {
    return {
      duration: 45,
      tier: 'Challenge',
      warningAt: 0.5,    // 22.5s
      criticalAt: 0.25,  // 11s
    };
  }
  
  if (streak < 15) {
    return {
      duration: 30,
      tier: 'Pressure',
      warningAt: 0.5,    // 15s
      criticalAt: 0.25,  // 7.5s
    };
  }
  
  if (streak < 20) {
    return {
      duration: 20,
      tier: 'Intense',
      warningAt: 0.5,    // 10s
      criticalAt: 0.3,   // 6s
    };
  }
  
  // 20+: Maximum difficulty - the legendary tier
  return {
    duration: 12,
    tier: 'Legendary',
    warningAt: 0.5,      // 6s
    criticalAt: 0.33,    // 4s
  };
}

/**
 * Get just the timer duration for a streak
 */
export function getTimerDuration(streak: number): number {
  return getTimerConfig(streak).duration;
}

/**
 * Get timer duration after using reprieve
 * Gives a grace period with extra time
 */
export function getTimerDurationAfterReprieve(streak: number): number {
  const baseDuration = getTimerDuration(streak);
  // Add 10 seconds grace period after reprieve, but cap at 60
  return Math.min(baseDuration + 10, 60);
}

/**
 * Pause duration between rounds (when correct animation plays)
 */
export const CORRECT_ANIMATION_PAUSE = 1500; // 1.5 seconds

/**
 * Get color for timer based on remaining percentage
 */
export function getTimerColor(remainingPercent: number, config: TimerConfig): 'green' | 'yellow' | 'red' {
  if (remainingPercent <= config.criticalAt) {
    return 'red';
  }
  if (remainingPercent <= config.warningAt) {
    return 'yellow';
  }
  return 'green';
}

/**
 * Format seconds to display string
 */
export function formatTimer(seconds: number): string {
  if (seconds < 0) seconds = 0;
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Show decimal for last 10 seconds
  if (seconds <= 10 && seconds > 0) {
    return seconds.toFixed(1);
  }
  
  return secs.toString();
}

/**
 * Check if timer should pulse (final countdown)
 */
export function shouldPulse(seconds: number): boolean {
  return seconds <= 5 && seconds > 0;
}

