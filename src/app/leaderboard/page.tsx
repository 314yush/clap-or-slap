'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LeaderboardList } from '@/components/leaderboard';
import { LeaderboardPodium } from '@/components/leaderboard/LeaderboardPodium';
import { WeekTimer } from '@/components/leaderboard/WeekTimer';
import { LeaderboardEntry } from '@/lib/game-core/types';
import { useIdentity } from '@/hooks';

type LeaderboardType = 'weekly' | 'global';

export default function LeaderboardPage() {
  const { userId } = useIdentity();
  const [type, setType] = useState<LeaderboardType>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          type,
          limit: '50',
          ...(userId && { userId }),
        });
        
        const response = await fetch(`/api/leaderboard?${params}`);
        const data = await response.json();
        
        if (data.success) {
          setEntries(data.entries);
          setUserRank(data.userRank);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, [type, userId]);

  const topThree = entries.slice(0, 3);
  const remainingEntries = entries.slice(3);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header with gradient */}
      <header className="sticky top-0 z-10 bg-gradient-to-br from-yellow-500 via-orange-500 to-yellow-600 border-b border-orange-600">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href="/"
              className="text-white/90 hover:text-white transition-colors font-medium"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-black text-white">Leaderboard</h1>
            <div className="w-12" /> {/* Spacer */}
          </div>

          {/* Type tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setType('weekly')}
              className={`
                flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors
                ${type === 'weekly' 
                  ? 'bg-white text-orange-600 shadow-lg' 
                  : 'bg-white/20 text-white/80 hover:text-white hover:bg-white/30'
                }
              `}
            >
              Weekly
            </button>
            <button
              onClick={() => setType('global')}
              className={`
                flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors
                ${type === 'global' 
                  ? 'bg-white text-orange-600 shadow-lg' 
                  : 'bg-white/20 text-white/80 hover:text-white hover:bg-white/30'
                }
              `}
            >
              All Time
            </button>
          </div>

          {/* Week Timer (only for weekly) */}
          {type === 'weekly' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <WeekTimer />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Podium for top 3 */}
            {topThree.length > 0 && (
              <LeaderboardPodium topThree={topThree} type={type} />
            )}

            {/* Remaining entries (4+) */}
            {remainingEntries.length > 0 && (
              <LeaderboardList
                entries={remainingEntries}
                userRank={userRank}
                currentUserId={userId}
                type={type}
              />
            )}

            {/* Show user's rank if not in top list */}
            {userRank && userRank > entries.length && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-center text-zinc-400 text-sm mb-2">Your rank</p>
                <div className="px-4 py-3 rounded-xl bg-violet-900/20 border border-violet-700/50">
                  <span className="text-violet-400 font-bold">#{userRank}</span>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Play CTA */}
      <div className="sticky bottom-0 p-4 bg-zinc-950/90 backdrop-blur border-t border-zinc-800">
        <div className="max-w-lg mx-auto">
          <Link
            href="/"
            className="
              block w-full py-4 text-center rounded-2xl
              bg-gradient-to-br from-emerald-500 to-emerald-600
              text-white font-bold text-lg
              shadow-lg shadow-emerald-500/25
              hover:shadow-emerald-500/40 transition-shadow
            "
          >
            Play Now
          </Link>
        </div>
      </div>
    </div>
  );
}


