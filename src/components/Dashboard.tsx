"use client";

import { useEffect, useState } from "react";
import sdk, { type Context } from "@farcaster/frame-sdk";
import { Button } from "../styles/ui/Button";
import { protoMono } from '@/styles/fonts';
import Image from 'next/image';
import { InstagramIcon, TikTokIcon } from '@/styles/svg/index';
import '@/styles/footer.css';
import Game from './Game';
import DashboardWinners from './DashboardWinners';
import Popup from './Popup';

export default function AdivinaDrone() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [isGameActive, setIsGameActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [dailyLimitMessage, setDailyLimitMessage] = useState<string | null>(null);
  const [hasPerfectScore, setHasPerfectScore] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Cargar contexto de Farcaster
  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      
      // Si tenemos un usuario, verificar/registrar en la base de datos
      if (context?.user?.username) {
        try {
          const response = await fetch(`/api/user/status?username=${encodeURIComponent(context.user.username)}`);
          if (!response.ok) {
            throw new Error('Failed to check user status');
          }
        } catch (error) {
          console.error('Error checking user status:', error);
        }
      }

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

  const handleStartGame = async () => {
    if (!context?.user) {
      setIsConnecting(true);
      try {
        await sdk.actions.openUrl('https://farcaster.xyz/~/connect');
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Error connecting wallet. Please try again.');
      } finally {
        setIsConnecting(false);
      }
      return;
    }

    try {
      // Verificar si el usuario puede jugar
      const response = await fetch(`/api/game?userId=${context.user.fid}&seasonId=Season 08`);
      const data = await response.json();
      
      if (response.status === 403) {
        setDailyLimitMessage(data.error);
        setHasPerfectScore(data.perfectScore || false);
        setIsPopupOpen(true);
        return;
      }
      
      setIsGameActive(true);
    } catch (error) {
      console.error('Error checking game availability:', error);
      alert('Error checking game availability. Please try again.');
    }
  };

  const handleShareStats = async () => {
    try {
      const text = `Im ready to play season 08 of /adivinadrone by @chaps
      ♻️ Leaderboard updated daily
      🏆 3 winners per season
      💸 Up to 350 USDC in prizes
      ➕ Add the Mini App & turn notis on 🔔`;
      const url = "https://adivinadrone.c13studio.mx";
      await sdk.actions.composeCast({
        text: text,
        embeds: [url]
      });
    } catch (error) {
      console.error('Error sharing stats:', error);
    }
  };

  if (!isSDKLoaded) {
    return (
      <div className="min-h-screen bg-[#2d283a] text-white font-mono flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (isGameActive && context?.user) {
    return <Game userId={context.user.fid.toString()} username={context.user.username || 'Anónimo'} />;
  }

  // Si no hay contexto de usuario, mostrar la pantalla de conexión
  if (!context?.user) {
    return (
      <div className="min-h-screen bg-[#2d283a] text-white font-mono flex flex-col">
        <header className={`w-full p-3 flex justify-between items-center ${protoMono.className}`}>
          <div className="flex items-center">
            <Image
              src="/favicon.png"
              alt="adivinaDrone Logo"
              width={48}
              height={48}
              priority
            />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-0">
          <div className="flex flex-col items-center gap-4 w-[95%] max-w-2xl">
            <h1 className={`text-4xl font-bold ${protoMono.className}`}>
              adivinaDrone
              <hr />
              <center>Season 08</center>
            </h1>
            <Button
              onClick={handleStartGame}
              disabled={isConnecting}
              className="w-full bg-[#3d3849] border-2 border-[#ff8800] hover:bg-[#4d4859] text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect with Farcaster'}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Si hay contexto de usuario, mostrar el dashboard
  return (
    <div className="min-h-screen bg-[#2d283a] text-white font-mono flex flex-col">
      <header className={`w-full p-2 flex mt-2 justify-between items-center ${protoMono.className}`}>
        <div className="flex items-center mb-0">
          <Image
            src="/favicon.png"
            alt="adivinaDrone Logo"
            width={48}
            height={48}
            priority
          />
        </div>
        {context?.user && (
          <button
            type="button"
            onClick={() => {
              console.log('Click en el botón de menú');
              setIsDashboardOpen(true);
            }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <div className="flex flex-col gap-1.5">
              <div className="w-5 h-0.5 bg-orange-500"></div>
              <div className="w-5 h-0.5 bg-orange-500"></div>
              <div className="w-5 h-0.5 bg-orange-500"></div>
            </div>
          </button>
        )}
      </header>

      {isDashboardOpen && context?.user && (
        <DashboardWinners
          isOpen={isDashboardOpen}
          onClose={() => {
            console.log('Cerrando dashboard');
            setIsDashboardOpen(false);
          }}
          userId={context.user.fid.toString()}
          username={context.user.username || 'Anónimo'}
          context={context}
        />
      )}

      <main className="flex-1 flex items-start justify-center p-0 mt-0">
        <div className="flex flex-col items-center gap-2 w-[95%] max-w-2xl">
          <h1 className={`text-4xl font-bold ${protoMono.className}`}>
            adivinaDrone
            <hr />
            <center>Season 08</center>
          </h1>

          <Button
            onClick={handleShareStats}
            className={`w-full bg-[#3d3849] border-2 border-[#ff8800] ${protoMono.className} hover:bg-[#4d4859] text-white font-bold py-1 px-1 rounded-xl transition-colors`}
          >
            Share Mini App for a chance to win 10M $DRONE
          </Button>

          <div className="relative border-2 border-[#ff8800] bg-[#3d3849] rounded-2xl p-3 max-w-2xl w-full overflow-hidden">
            <div className="absolute inset-0 z-0">
              <Image
                src="/mapaTrans.png"
                alt="Background Map"
                fill
                priority
                sizes="100vw"
                style={{ objectFit: 'fill' }}
                className="opacity-80"
              />
            </div>
            <div className={`relative z-10 text-center space-y-3 ${protoMono.className}`}>
              <div className="flex flex-col mb-0">
                <h2 className={`text-3xl font-semibold opacity-90 ${protoMono.className}`}>
                  Hello {context.user.username || 'Anónimo'}
                </h2>
                <h2 className={`text-2xl font-semibold opacity-90 ${protoMono.className}`}>
                  How to play:
                </h2>
              </div>
              <div className="mt-2 mb-0">
                <p className="text-sm leading-relaxed text-left mb-0">
                  * Guess the location of 3 photos a day<br />
                  * Select location as fast as possible<br />
                  * Faster answers = more points<br />
                  * Leaderboard updated daily<br />
                  * 3 winners per season<br />
                  * Up to 150 USDC in prizes<br />
                  * Updated daily at 18.00 CST<br />
                  * Add the Mini App and turn notis on<br />
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 w-full">
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
      </main>

      <footer className={`w-full overflow-hidden py-2 mb-3`}>
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

      {isPopupOpen && (
        <Popup
          message={dailyLimitMessage || ''}
          onClose={() => setIsPopupOpen(false)}
          hasPerfectScore={hasPerfectScore}
        />
      )}
    </div>
  );
}