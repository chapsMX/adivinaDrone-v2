"use client";

import { useEffect, useState } from "react";
import sdk, {
       AddFrame,
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

export default function AdivinaDrone() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [isGameActive, setIsGameActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  // const { address } = useAccount();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isEarlyAccessRequested, setIsEarlyAccessRequested] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [dailyLimitMessage, setDailyLimitMessage] = useState<string | null>(null);
  const [hasPerfectScore, setHasPerfectScore] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

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
      // Solo intentar sign in si no hay usuario en el contexto
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
  }, [isSDKLoaded, isSigningIn, context?.user]);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (context?.user) {
        try {
          const response = await fetch(`/api/user/status?userId=${context.user.fid}`);
          const data = await response.json();
          setIsEarlyAccessRequested(data.early_access_requested);
          setIsWhitelisted(data.is_whitelisted);
        } catch (error) {
          console.error('Error checking user status:', error);
        }
      }
    };

    checkUserStatus();
  }, [context?.user]);

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

    // Verificar si el usuario puede jugar
    try {
      const response = await fetch(`/api/game?userId=${context.user.fid}&seasonId=Season 00&extraLife=false&username=${context.user.username}`);
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
      alert('Error al verificar disponibilidad del juego. Por favor, intenta de nuevo.');
    }
  };

  const handleJoinEarlyAccess = async () => {
    if (!context?.user) {
      console.log('No hay usuario en el contexto');
      return;
    }
    
    try {
      const userData = {
        userId: context.user.fid,
        username: context.user.username
      };
      console.log('Iniciando proceso de early access para:', userData);
      
      // 1. Actualizar la base de datos
      const response = await fetch('/api/user/early-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      console.log('Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error en la respuesta del servidor:', {
          status: response.status,
          data: errorData
        });
        return;
      }

      console.log('Usuario agregado a early access correctamente');
      setIsEarlyAccessRequested(true);
      
      // 2. Agregar el frame
      console.log('Intentando agregar el frame...');
      const result = await sdk.actions.addFrame();
      console.log('Resultado de addFrame:', result);
      
      if (result.notificationDetails) {
        console.log('Frame agregado correctamente, procediendo a compartir');
        // 3. Compartir en Warpcast
        const text = "I just joined /adivinadrone \nA fun game by @chaps which you can join too 👇 👇 ";
        const url = window.location.href;
        
        try {
          await sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`);
          console.log('Ventana de compartir abierta correctamente');
        } catch (shareError) {
          console.error('Error al abrir ventana de compartir:', shareError);
        }
      }
    } catch (error) {
      console.error('Error en el flujo de early access:', error);
      if (error instanceof AddFrame.RejectedByUser) {
        console.log('Usuario rechazó agregar el frame:', error.message);
      } else if (error instanceof AddFrame.InvalidDomainManifest) {
        console.log('Error de manifiesto del dominio:', error.message);
      } else {
        console.log('Error desconocido:', error);
      }
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
    isEarlyAccessRequested,
    isWhitelisted,
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
              {isConnecting ? 'Connecting...' : 'Connect our wallet to start playing'}
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
              seasonId="Season 00"
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
                {context?.user ? (
                  isWhitelisted ? (
                    dailyLimitMessage ? (
                      <div className="text-center">
                        {!hasPerfectScore && (
                          <Button
                            onClick={() => setIsGameActive(true)}
                            className="w-full bg-[#3d3849] border-2 border-[#ff8800] hover:bg-[#4d4859] text-white font-bold py-3 px-6 rounded-xl transition-colors"
                          >
                            Use Extra Life
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        onClick={handleStartGame}
                        disabled={isConnecting}
                        className="w-full bg-[#3d3849] border-2 border-[#ff8800] hover:bg-[#4d4859] text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {isConnecting ? 'Connecting...' : 'Start Game'}
                      </Button>
                    )
                  ) : isEarlyAccessRequested ? (
                    <div className="text-center">
                      <p className="text-lg mb-4">Thanks for your interest in adivinaDrone! We will notify you when you get access to the game.</p>
                    </div>
                  ) : (
                    <Button
                      onClick={handleJoinEarlyAccess}
                      className="w-full bg-[#3d3849] border-2 border-[#ff8800] hover:bg-[#4d4859] text-white font-bold py-3 px-6 rounded-xl transition-colors"
                    >
                      Join Early Access
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={handleStartGame}
                    disabled={isConnecting}
                    className="w-full bg-[#3d3849] border-2 border-[#ff8800] hover:bg-[#4d4859] text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect your wallet to start playing'}
                  </Button>
                )}
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
                  <h2 className={`text-2xl font-semibold opacity-90 ${protoMono.className}`}>Ready to play?</h2>
                  </div>
                  <div className="mt-6">
                    <p className="text-lg leading-relaxed">
                      200 photos per season<br />
                      3 daily random photos<br />
                      Time based score<br />
                      Fast answers = more points<br />
                      $DRONE token rewards
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
        message={dailyLimitMessage || ''}
        onClose={() => setIsPopupOpen(false)}
      />
    </div>
  );
}