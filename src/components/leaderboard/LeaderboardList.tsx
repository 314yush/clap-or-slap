'use client';

import { LeaderboardEntry } from '@/lib/game-core/types';
import Image from 'next/image';

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  userRank?: number | null;
  currentUserId?: string;
  type?: 'weekly' | 'global';
}

export function LeaderboardList({ entries, userRank, currentUserId, type = 'weekly' }: LeaderboardListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🏆</div>
        <p className="text-zinc-400">No entries yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => (
        <LeaderboardRow
          key={entry.user.userId}
          entry={entry}
          isCurrentUser={entry.user.userId === currentUserId}
          type={type}
        />
      ))}
    </div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  type: 'weekly' | 'global';
}

function LeaderboardRow({ entry, isCurrentUser, type }: LeaderboardRowProps) {
  const getValueEmoji = (value: number) => {
    // For weekly (points), use different emojis
    if (type === 'weekly') {
      if (value >= 500) return '👑';
      if (value >= 200) return '🔥🔥🔥';
      if (value >= 100) return '🔥🔥';
      if (value >= 50) return '🔥';
      return '';
    }
    // For global (streak), use streak emojis
    if (value >= 50) return '👑';
    if (value >= 20) return '🔥🔥🔥';
    if (value >= 10) return '🔥🔥';
    if (value >= 5) return '🔥';
    return '';
  };

  const displayValue = entry.bestStreak;
  const label = type === 'weekly' ? 'Points' : 'Streak';

  return (
    <div
      className={`
        flex items-center gap-4 px-4 py-3 rounded-xl
        ${isCurrentUser 
          ? 'bg-violet-900/20 border border-violet-700/50' 
          : 'bg-white/5 border border-white/10 backdrop-blur-sm'
        }
      `}
    >
      {/* Rank */}
      <div className="w-12 text-center">
        <span className="font-bold text-zinc-400 text-sm">
          #{entry.rank}
        </span>
      </div>

      {/* Avatar */}
      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700">
        {entry.user.avatarUrl ? (
          <Image
            src={entry.user.avatarUrl}
            alt={entry.user.displayName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg text-white">
            {entry.user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isCurrentUser ? 'text-violet-300' : 'text-white'}`}>
          {entry.user.displayName}
        </p>
        {entry.usedReprieve && (
          <span className="text-xs text-amber-500">🕯 used reprieve</span>
        )}
      </div>

      {/* Value (Points or Streak) */}
      <div className="text-right">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-emerald-400 tabular-nums">
            {displayValue.toLocaleString()}
          </span>
          {getValueEmoji(displayValue) && (
            <span className="text-lg">{getValueEmoji(displayValue)}</span>
          )}
        </div>
        <div className="text-xs text-zinc-400 mt-0.5">{label}</div>
      </div>
    </div>
  );
}


