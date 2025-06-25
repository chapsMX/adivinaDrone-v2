import React from 'react';
import { createPortal } from 'react-dom';
import { protoMono } from '@/styles/fonts';
import Image from 'next/image';
import { Context } from '@farcaster/frame-sdk';
import sdk from "@farcaster/frame-sdk";

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  context: Context.FrameContext;
}

interface TopPlayer {
  username: string;
  score: number;
  pfp_url: string;
  rank: number;
  total_players: number;
  percentile: number;
}

interface Season {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export default function Dashboard({ isOpen, onClose, userId, username, context }: DashboardProps) {
  const [stats, setStats] = React.useState({
    gamesPlayed: 0,
    totalScore: 0,
    averageResponseTime: 0
  });
  const [topPlayers, setTopPlayers] = React.useState<TopPlayer[]>([]);
  const [seasons, setSeasons] = React.useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = React.useState<string>('Season 08');
  const [error, setError] = React.useState<string | null>(null);

  // Cargar temporadas y establecer la actual
  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/seasons/list')
        .then(res => res.json())
        .then(data => {
          setSeasons(data);
          const currentSeason = data.find((s: Season) => s.is_current);
          if (currentSeason) {
            setSelectedSeason(currentSeason.name);
          }
        })
        .catch(err => {
          console.error('Error fetching seasons:', err);
          setError('Error loading seasons');
        });
    }
  }, [isOpen]);

  // Cargar estadísticas y top players cuando cambia la temporada
  React.useEffect(() => {
    if (isOpen && selectedSeason) {
      setError(null);
      // Obtener estadísticas del usuario
      fetch(`/api/user/stats?username=${encodeURIComponent(username)}&seasonId=${selectedSeason}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load user stats');
          return res.json();
        })
        .then(data => setStats(data))
        .catch(err => {
          console.error('Error fetching user stats:', err);
          setError('Error loading user statistics');
        });

      // Obtener top jugadores
      fetch(`/api/leaderboard/top?seasonId=${selectedSeason}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load leaderboard');
          return res.json();
        })
        .then(data => {
          console.log('Leaderboard data received:', data);
          const players = Array.isArray(data) ? data : [];
          setTopPlayers(players);
        })
        .catch(err => {
          console.error('Error fetching leaderboard:', err);
          setTopPlayers([]);
        });
    }
  }, [isOpen, username, selectedSeason]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div className="bg-[#3d3849] border border-[#ff8800] rounded-2xl p-6 max-w-xl w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-[#ff8800] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex justify-between items-center mb-3">
          <h2 className={`text-3xl font-bold text-white ${protoMono.className}`}>{selectedSeason}</h2>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className={`bg-[#2d283a] border border-[#ff8800] text-white text-sm px-4 py-2 rounded-lg ${protoMono.className}`}
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.name}>
                {season.name} {season.is_current ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="p-3 border border-red-500 rounded-xl bg-red-500/20 text-white">
              {error}
            </div>
          )}
          <div className="p-3 border border-[#ff8800] rounded-xl bg-black/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-12 h-12">
                <Image
                  src={context?.user?.pfpUrl || 'https://adivinadrone.c13studio.mx/default-avatar.jpg'}
                  alt="Profile"
                  fill
                  className="rounded-full border-2 border-[#ff8800] object-cover"
                  unoptimized
                />
              </div>
              <p className={`text-xl text-white ${protoMono.className}`}>{username}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-0">
                <span className={`text-white ${protoMono.className}`}>Games played:</span>
                <span className={`text-white ${protoMono.className}`}>{stats.gamesPlayed}</span>
              </div>
              <div className="flex justify-between items-center mb-0">
                <span className={`text-white ${protoMono.className}`}>Global Score:</span>
                <span className={`text-white ${protoMono.className}`}>{stats.totalScore.toLocaleString('en-US')}</span>
              </div>
              <div className="flex justify-between items-center mb-0">
                <span className={`text-white ${protoMono.className}`}>Average response:</span>
                <span className={`text-white ${protoMono.className}`}>{stats.averageResponseTime}s</span>
              </div>
              <button
                onClick={async () => {
                  try {
                    const text = `My /adivinadrone stats:\nGames Played: ${stats.gamesPlayed}\nGlobal Score: ${stats.totalScore.toLocaleString('en-US')}\nAverage Response: ${stats.averageResponseTime}s\nCan you beat my score? 🚀`;
                    const url = "https://adivinadrone.c13studio.mx";
                    
                    await sdk.actions.composeCast({
                      text: text,
                      embeds: [url]
                    });
                  } catch (error) {
                    console.error('Error sharing stats:', error);
                    if (error instanceof Error) {
                      alert('Error sharing: ' + error.message);
                    } else {
                      alert('Error sharing. Please try again.');
                    }
                  }
                }}
                className={`w-full mt-4 border-2 border-[#ff8800] text-white px-6 py-2 rounded-lg hover:bg-white/5 transition-colors ${protoMono.className}`}
              >
                Share Stats
              </button>
            </div>
          </div>

          <div className="p-0 border border-[#ff8800] rounded-xl bg-black/20">
            <h3 className={`text-lg p-2 font-bold text-white mb-0 ${protoMono.className}`}>Top 25 Players</h3>
            <div className="space-y-0 max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#ff8800] scrollbar-track-black/20">
              {Array.isArray(topPlayers) && topPlayers.map((player, index) => (
                <div 
                  key={`player-${index}`} 
                  className={`flex items-center gap-2 p-2 ${index % 2 === 0 ? 'bg-black/20' : 'bg-black/10'}`}
                >
                  <span className={`text-base font-bold text-white ${protoMono.className}`}>#{index + 1}</span>
                  <div className="relative w-6 h-6">
                    <Image
                      src={player.pfp_url || 'https://adivinadrone.c13studio.mx/default-avatar.jpg'}
                      alt={player.username || 'Anónimo'}
                      fill
                      className="rounded-full border border-[#ff8800] object-cover"
                      unoptimized
                    />
                  </div>
                  <span className={`flex-1 text-sm text-white ${protoMono.className}`}>{player.username || 'Anónimo'}</span>
                  <span className={`font-bold text-sm text-white ${protoMono.className}`}>
                    {player.score.toLocaleString('en-US')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
} 