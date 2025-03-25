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
  pfp_url: string | null;
}

export default function Dashboard({ isOpen, onClose, userId, username, context }: DashboardProps) {
  const [stats, setStats] = React.useState({
    gamesPlayed: 0,
    totalScore: 0,
    averageResponseTime: 0
  });
  const [topPlayers, setTopPlayers] = React.useState<TopPlayer[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      // Obtener estadísticas del usuario
      fetch(`/api/user/stats?userId=${userId}`)
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(err => console.error('Error fetching user stats:', err));

      // Obtener top 3 jugadores
      fetch('/api/leaderboard/top')
        .then(res => res.json())
        .then(data => {
          // Asegurarnos de que data sea un array
          const players = Array.isArray(data) ? data : [];
          setTopPlayers(players);
        })
        .catch(err => {
          console.error('Error fetching leaderboard:', err);
          setTopPlayers([]);
        });
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div className="bg-[#3d3849] border border-[#ff8800] rounded-2xl p-6 max-w-2xl w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-[#ff8800] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className={`text-3xl font-bold text-white text-center mb-6 ${protoMono.className}`}>Season 7</h2>

        <div className="space-y-6">
          <div className="p-4 border border-[#ff8800] rounded-xl bg-black/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-12 h-12">
                <Image
                  src={context.user.pfpUrl || '/default-avatar.png'}
                  alt="Profile"
                  fill
                  className="rounded-full border-2 border-[#ff8800] object-cover"
                  unoptimized
                />
              </div>
              <p className={`text-xl text-white ${protoMono.className}`}>{username}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-white ${protoMono.className}`}>Games played:</span>
                <span className={`text-white ${protoMono.className}`}>{stats.gamesPlayed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-white ${protoMono.className}`}>Global Score:</span>
                <span className={`text-white ${protoMono.className}`}>{stats.totalScore}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-white ${protoMono.className}`}>Average response:</span>
                <span className={`text-white ${protoMono.className}`}>{stats.averageResponseTime}s</span>
              </div>
              <button
                onClick={async () => {
                  try {
                    const text = `My /adivinadrone stats:\nGames Played: ${stats.gamesPlayed}\nGlobal Score: ${stats.totalScore}\nAverage Response: ${stats.averageResponseTime}s\nCan you beat my score? 🚀`;
                    const url = "https://adivinadrone.c13studio.mx";
                    
                    await sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`);
                  } catch (error) {
                    console.error('Error sharing stats:', error);
                  }
                }}
                className={`w-full mt-4 border-2 border-[#ff8800] text-white px-6 py-2 rounded-lg hover:bg-white/5 transition-colors ${protoMono.className}`}
              >
                Share Stats
              </button>
            </div>
          </div>

          <div className="p-4 border border-[#ff8800] rounded-xl bg-black/20">
            <h3 className={`text-xl font-bold text-white mb-4 ${protoMono.className}`}>Top Players</h3>
            <div className="space-y-0">
              {Array.isArray(topPlayers) && topPlayers.map((player, index) => (
                <div 
                  key={`player-${index}`} 
                  className={`flex items-center gap-3 p-3 ${index % 2 === 0 ? 'bg-black/20' : 'bg-black/10'}`}
                >
                  <span className={`text-lg font-bold text-white ${protoMono.className}`}>#{index + 1}</span>
                  <div className="relative w-8 h-8">
                    <Image
                      src={player.pfp_url || `/images/seasons/0/adivinadrone_${String(index + 1).padStart(3, '0')}.jpg`}
                      alt={player.username}
                      fill
                      className="rounded-full border border-[#ff8800] object-cover"
                      unoptimized
                    />
                  </div>
                  <span className={`flex-1 text-white ${protoMono.className}`}>{player.username}</span>
                  <span className={`font-bold text-white ${protoMono.className}`}>{player.score}</span>
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