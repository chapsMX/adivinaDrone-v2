"use client";

import { useEffect, useState } from "react";
import sdk, {
       type Context,
} from "@farcaster/frame-sdk";
// import { useAccount } from 'wagmi';
import  {signIn, getCsrfToken} from "next-auth/react";
import { Button } from "../styles/ui/Button";
import { protoMono } from '@/styles/fonts';
import Image from 'next/image';
import { InstagramIcon, TikTokIcon } from '@/styles/svg/index';
import '@/styles/footer.css';
import Game from './Game';
import Dashboard from './Dashboard';
import Popup from './Popup';
import { useRouter } from 'next/navigation';

export default function AdivinaDrone() {
  const router = useRouter();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [isGameActive, setIsGameActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  // const { address } = useAccount();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [dailyLimitMessage, setDailyLimitMessage] = useState<string | null>(null);
  const [hasPerfectScore, setHasPerfectScore] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [canBuyExtraLife, setCanBuyExtraLife] = useState(false);
  const [hasExtraLife, setHasExtraLife] = useState(false);
  const [isExtraLifeUsed, setIsExtraLifeUsed] = useState(false);

  // contexto del frame
  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      console.log('Farcaster context:', context); // Para debug
      setContext(context);

      sdk.on("frameAddRejected", ({ reason }) => {
        console.log(`Frame add rejected: ${reason}`);
      });

      sdk.on("frameRemoved", () => {
        console.log("Frame removed");
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
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

  // Inicio de sesión después de que el frame esté cargado
  useEffect(() => {
    const signInUser = async () => {
      // Solo intentar sign in si no hay usuario en el contexto y no estamos ya en proceso de sign in
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

  useEffect(() => {
    const checkUserStatus = async () => {
      if (context?.user) {
        try {
          // Registrar al usuario en la base de datos sin restricciones
          await fetch(`/api/user/status?userId=${context.user.fid}`);
        } catch (error) {
          console.error('Error registering user:', error);
        }
      }
    };

    checkUserStatus();
  }, [context?.user]);

  // Verificar si el usuario tiene vida extra al cargar y cuando cambia isGameActive
  const checkExtraLife = async () => {
    if (context?.user) {
      try {
        const response = await fetch(`/api/extra-life/check?userId=${context.user.fid}`);
        const data = await response.json();
        
        setHasExtraLife(data.hasExtraLife);
        setIsExtraLifeUsed(data.isUsed);
        
        console.log('Extra life status:', {
          hasExtraLife: data.hasExtraLife,
          isUsed: data.isUsed
        });
      } catch (error) {
        console.error('Error checking extra life:', error);
        setHasExtraLife(false);
        setIsExtraLifeUsed(false);
      }
    }
  };

  useEffect(() => {
    checkExtraLife();
  }, [context?.user, isGameActive]);

  const handleStartGame = async () => {
    if (!context?.user) {
      setIsConnecting(true);
      try {
        await sdk.actions.openUrl('https://warpcast.com/~/connect');
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Error al conectar la billetera. Por favor, intenta de nuevo.');
      } finally {
        setIsConnecting(false);
      }
      return;
    }

    // Si tiene vida extra sin usar, redirigir a la página de vida extra
    if (hasExtraLife && !isExtraLifeUsed) {
      router.push('/extralife');
      return;
    }

    // Si puede comprar vida extra, redirigir a la página de compra
    if (canBuyExtraLife) {
      router.push('/extralife');
      return;
    }

    // Verificar si el usuario puede jugar normalmente
    try {
      const response = await fetch(`/api/game?userId=${context.user.fid}&seasonId=Season 07&extraLife=false&username=${context.user.username}`);
      const data = await response.json();
      
      if (response.status === 403) {
        setDailyLimitMessage(data.error);
        setHasPerfectScore(data.perfectScore || false);
        // Solo permitimos comprar vida extra si no tiene score perfecto y no ha usado una vida extra hoy
        setCanBuyExtraLife(!data.perfectScore && !hasExtraLife);
        setIsPopupOpen(true);
        return;
      }
      
      setIsGameActive(true);
    } catch (error) {
      console.error('Error checking game availability:', error);
      alert('Error al verificar disponibilidad del juego. Por favor, intenta de nuevo.');
    }
  };

  // carga el componente
  if (!isSDKLoaded) {
    console.log('SDK not loaded yet');
    return (
      <div className="min-h-screen bg-[#2d283a] text-white font-mono flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  console.log('Current states:', {
    isSDKLoaded,
    context: context?.user ? 'User logged in' : 'No user',
    isGameActive
  });

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
              <center>Season 07</center>
            </h1>
            <Button
              onClick={handleStartGame}
              disabled={isConnecting}
              className="w-full bg-[#3d3849] border-2 border-[#ff8800] hover:bg-[#4d4859] text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect your wallet to start playing'}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Si hay contexto de usuario, mostrar la pantalla principal
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
              <div className="w-5 h-0.5 bg-white"></div>
              <div className="w-5 h-0.5 bg-white"></div>
              <div className="w-5 h-0.5 bg-white"></div>
            </div>
          </button>
        )}
      </header>

      {isDashboardOpen && context?.user && (
        <Dashboard
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

      <main className="min-w-screen flex-1 flex items-start justify-center p-0">
        <div className="flex flex-col items-center gap-1 w-[95%]">
          {isGameActive && context?.user ? (
            <Game 
              userId={context.user.fid.toString()} 
              seasonId="Season 07"
              username={context.user.username || 'Anónimo'}
              onBack={() => {
                setIsGameActive(false);
                setDailyLimitMessage(null);
              }}
            />
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 mb-4">
                <h1 className={`text-4xl font-bold ${protoMono.className}`}>
                  adivinaDrone
                  <hr />
                  <center>Season 07</center>
                </h1>
              </div>
              <div className={`flex flex-col items-center gap-2 w-full max-w-2xl ${protoMono.className}`}>
                <Button
                  onClick={handleStartGame}
                  className="w-full bg-[#3d3849] border-2 border-[#ff8800] hover:bg-[#4d4859] text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
                >
                  {hasExtraLife && !isExtraLifeUsed ? 'Play Your Extra Life' : 
                   canBuyExtraLife ? 'Buy Extra Life' : 
                   'Play Now'}
                </Button>
              </div>
              <hr></hr>
              <hr></hr>
              <div className="relative border-2 border-[#ff8800] bg-[#3d3849] rounded-2xl p-6 max-w-2xl w-full overflow-hidden">
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
                  <div className="flex flex-col gap-3">
                  <h2 className={`text-3xl font-semibold opacity-90 ${protoMono.className}`}>Hello&nbsp;{context?.user?.username || 'adivinaDrone'}</h2> 
                  <h2 className={`text-2xl font-semibold opacity-90 ${protoMono.className}`}>How to play:</h2>
                  </div>
                  <div className="mt-6">
                    <p className="text-sm leading-relaxed text-left">
                      * 3 daily random photos<br />
                      * Guess the location of each one<br />
                      * Faster answers = more points<br />
                      * Leaderboard updated daily<br />
                      * 5 winners per season<br />
                      * Updated daily at 18.00 CST
                      <br />
                    </p>
                  </div>
                </div>
              </div>
              <hr></hr>
              <hr></hr>
               <div className={`flex flex-col items-center gap-2 w-full max-w-2xl ${protoMono.className}`}>
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
            </>
          )}
        </div>
      </main>

      <footer className={`w-full overflow-hidden py-2 mb-3 ${isGameActive ? 'hidden' : ''}`}>
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

      {/* Popup para mensajes de límite diario */}
      <Popup
        isOpen={isPopupOpen}
        message={hasPerfectScore ? "Congratulations! You got a perfect score 3/3. Come back tomorrow for 3 new photos." : (dailyLimitMessage || '')}
        onClose={() => {
          setIsPopupOpen(false);
          setHasPerfectScore(false);
        }}
      />
    </div>
  );
}