"use client";

import { useEffect, useState } from "react";
import sdk, {
       type Context,
} from "@farcaster/frame-sdk";
import { signIn, getCsrfToken } from "next-auth/react";
import { Button } from "../styles/ui/Button";
import { protoMono } from '@/styles/fonts';
import Image from 'next/image';
import { InstagramIcon, TikTokIcon } from '@/styles/svg/index';
import '@/styles/footer.css';
import { useRouter } from 'next/navigation';

interface Winner {
  username: string;
  score: number;
  pfp_url: string | null;
  fid: string;
}

interface UserStats {
  globalScore: number;
  rank: number;
}

export default function AdivinaMint() {
  const router = useRouter();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoadingWinners, setIsLoadingWinners] = useState(true);
  const [winnersError, setWinnersError] = useState('');
  const [context, setContext] = useState<Context.FrameContext>();
  const [userStats, setUserStats] = useState<UserStats>({ globalScore: 0, rank: 0 });
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  // Frame context setup
  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      
      // If we have a user, fetch their stats
      if (context?.user?.fid) {
        try {
          const scoreResponse = await fetch(`/api/user/score?userId=${context.user.fid}`);
          const scoreData = await scoreResponse.json();
          
          // Calculate rank by comparing with winners
          const winnersResponse = await fetch('/api/leaderboard/winners');
          const winnersData = await winnersResponse.json();
          const rank = winnersData.findIndex((w: Winner) => 
            w.username === context.user.username
          ) + 1;
          
          setUserStats({
            globalScore: scoreData.globalScore || 0,
            rank: rank > 0 ? rank : winnersData.length + 1
          });
        } catch (error) {
          console.error('Error fetching user stats:', error);
        }
      }

      sdk.on("frameAddRejected", ({ reason }) => {
        console.log(`Frame add rejected: ${reason}`);
      });

      sdk.on("frameRemoved", () => {
        console.log("Frame removed");
      });

      console.log("Calling ready");
      sdk.actions.ready({});
    };

    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  // Sign in effect
  const [isSigningIn, setIsSigningIn] = useState(false);
  useEffect(() => {
    const signInUser = async () => {
      if (isSDKLoaded && !isSigningIn && !context?.user) {
        setIsSigningIn(true);
        try {
          const nonce = await getCsrfToken();
          if (nonce) {
            const result = await sdk.actions.signIn({ nonce });
            await signIn("credentials", {
              message: result.message,
              signature: result.signature,
              redirect: false,
            });
          }
        } catch (error) {
          console.error('Error signing in:', error);
        } finally {
          setIsSigningIn(false);
        }
      }
    };

    signInUser();
  }, [isSDKLoaded, context?.user, isSigningIn]);

  // Cargar ganadores
  useEffect(() => {
    const fetchWinners = async () => {
      setIsLoadingWinners(true);
      setWinnersError('');  // Initialize with empty string
      try {
        // Obtener los ganadores de la temporada actual
        const response = await fetch(`/api/leaderboard/winners?seasonId=Season 07`);
        if (!response.ok) {
          throw new Error('Failed to fetch winners');
        }
        const data = await response.json();
        console.log('Winners data:', data); // Para debug
        const players = Array.isArray(data) ? data : [];
        setWinners(players);
      } catch (error) {
        console.error('Error fetching winners:', error);
        setWinnersError('Error loading winners. Please try again later.');
      } finally {
        setIsLoadingWinners(false);
      }
    };

    fetchWinners();
  }, []);

  // Loading state
  if (!isSDKLoaded) {
    return (
      <div className="min-h-screen bg-[#2d283a] text-white font-mono flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="min-h-screen bg-[#2d283a] text-white font-mono flex flex-col">
      {/* Header */}
      <header className={`w-full p-3 flex justify-center mb-0 items-center ${protoMono.className}`}>
        <div className="flex flex-col items-center">
          <h1 className={`text-2xl font-bold ${protoMono.className}`}>
           Season 07
            <hr className="my-2" />
           <center>Winners</center>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-w-screen flex-1 flex items-start justify-center p-0">
        <div className="flex flex-col items-center gap-2 w-[95%]">


          {/* Podium section */}
          {winners.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-0 w-full max-w-2xl min-h-[200px] items-center">
              {/* Second Place */}
              {winners[1] && (
                <div className="flex flex-col items-center justify-center h-full">
                  <a href="https://warpcast.com/ozengk.eth" target="_blank" rel="noopener noreferrer" className="block">
                    <div className="relative w-16 h-16 mb-4">
                      <Image
                        src={winners[1].pfp_url || '/default-avatar.png'}
                        alt={winners[1].username || 'Anónimo'}
                        fill
                        className="rounded-full border-2 border-[#C0C0C0] object-cover"
                        unoptimized
                      />
                    </div>
                  </a>
                  <span className={`text-sm text-[#C0C0C0] mb-2 ${protoMono.className}`}>🥈</span>
              
                  <span className={`text-sm font-bold text-[#C0C0C0] ${protoMono.className}`}>{winners[1].score}</span>
                </div>
              )}

              {/* First Place */}
              {winners[0] && (
                <div className="flex flex-col items-center justify-center h-full">
                  <a href="https://warpcast.com/rudy09" target="_blank" rel="noopener noreferrer" className="block">
                    <div className="relative w-32 h-32 mb-4">
                      <Image
                        src={winners[0].pfp_url || '/default-avatar.png'}
                        alt={winners[0].username || 'Anónimo'}
                        fill
                        className="rounded-full border-2 border-[#FFD700] object-cover"
                        unoptimized
                      />
                    </div>
                  </a>
                  <span className={`text-sm text-[#FFD700] mb-2 ${protoMono.className}`}>🥇</span>
                  
                  <span className={`text-sm font-bold text-[#FFD700] ${protoMono.className}`}>{winners[0].score}</span>
                </div>
              )}

              {/* Third Place */}
              {winners[2] && (
                <div className="flex flex-col items-center justify-center h-full">
                  <a href="https://warpcast.com/h2-10" target="_blank" rel="noopener noreferrer" className="block">
                    <div className="relative w-16 h-16 mb-4">
                      <Image
                        src={winners[2].pfp_url || '/default-avatar.png'}
                        alt={winners[2].username || 'Anónimo'}
                        fill
                        className="rounded-full border-2 border-[#CD7F32] object-cover"
                        unoptimized
                      />
                    </div>
                  </a>
                  <span className={`text-sm text-[#CD7F32] mb-2 ${protoMono.className}`}>🥉</span>
                 
                  <span className={`text-sm font-bold text-[#CD7F32] ${protoMono.className}`}>{winners[2].score}</span>
                </div>
              )}
            </div>
          )}
                    {/* Mint and Share section */}
                   <div className={`flex flex-col items-center gap-2 w-full max-w-2xl ${protoMono.className}`}>
            <div className="grid grid-cols-2 gap-4 w-full">
              <button 
                onClick={async () => {
                  if (!context?.user) {
                    await sdk.actions.openUrl('https://warpcast.com/~/connect');
                    return;
                  }
                  const imageId = `${userStats.globalScore}-${context.user.fid}`;
                  const text = `My final score & rank in /adivinadrone Season 07:\n🎯 Score: ${userStats.globalScore}\n👑 Rank: #${userStats.rank}\n\nSeason 08 is coming soon! 🚀`;
                  const url = `https://adivinadrone.c13studio.mx/dynamic-image/${imageId}`;
                  await sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`);
                }}
                className="bg-[#ff8800] hover:bg-[#ff8800]/80 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Share Score
              </button>
              <button 
                onClick={() => router.push('/fcmint')}
                className="bg-[#ff8800] hover:bg-[#ff8800]/80 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Mint Your NFT
              </button>
            </div>
          </div>
          {/* Winners section */}
          <div className="p-2 border border-[#ff8800] rounded-xl bg-black/20 w-full max-w-2xl mt-0">
            <div className="space-y-0 max-h-[230px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#ff8800] scrollbar-track-black/20">
              {isLoadingWinners ? (
                <div className="text-center py-4">
                  <p className={`text-white ${protoMono.className}`}>Loading winners...</p>
                </div>
              ) : winnersError ? (
                <div className="text-center py-4">
                  <p className={`text-red-400 ${protoMono.className}`}>{winnersError}</p>
                </div>
              ) : winners.length === 0 ? (
                <div className="text-center py-4">
                  <p className={`text-white ${protoMono.className}`}>No winners found for this period.</p>
                </div>
              ) : (
                // Mostrar ganadores a partir del 4to lugar
                winners.slice(3).map((winner, index) => (
                  <div 
                    key={`winner-${index + 4}`} 
                    className={`flex items-center gap-2 p-2 ${(index + 4) % 2 === 0 ? 'bg-black/20' : 'bg-black/10'}`}
                  >
                    <span className={`text-base font-bold text-white ${protoMono.className}`}>#{index + 4}</span>
                    <div className="relative w-6 h-6">
                      <Image
                        src={winner.pfp_url || '/default-avatar.png'}
                        alt={winner.username || 'Anónimo'}
                        fill
                        className="rounded-full border border-[#ff8800] object-cover"
                        unoptimized
                      />
                    </div>
                    <span className={`flex-1 text-sm text-white ${protoMono.className}`}>{winner.username || 'Anónimo'}</span>
                    <span className={`font-bold text-sm text-white ${protoMono.className}`}>{winner.score}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Social Buttons */}
          <div className={`flex flex-col items-center gap-1 w-full max-w-2xl ${protoMono.className}`}>
            <div className="flex gap-2 w-full">
              <Button
                onClick={() => window.open('https://www.instagram.com/c13studio/', '_blank')}
                className="flex-1"
              >
                <InstagramIcon />
              </Button>

              <Button
                onClick={() => window.open('https://www.tiktok.com/@c13studio', '_blank')}
                className="flex-1"
              >
                <TikTokIcon />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full overflow-hidden py-2 mb-2">
        <div className="relative flex flex-col gap-0.5">
          <div className="marquee">
            <div className="track">
              <span className={`text-white text-xl ${protoMono.className}`}>
                c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio •&nbsp;
              </span>
              <span className={`text-white text-xl ${protoMono.className}`}>
                c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio •&nbsp;
              </span>
            </div>
          </div>
          <div className="marquee">
            <div className="track-reverse">
              <span className={`text-white text-xl ${protoMono.className}`}>
                adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone •&nbsp;
              </span>
              <span className={`text-white text-xl ${protoMono.className}`}>
                adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone •&nbsp;
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
