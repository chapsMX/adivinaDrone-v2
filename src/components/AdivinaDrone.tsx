"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, {
AddFrame,
type Context,
} from "@farcaster/frame-sdk";
import { useAccount } from 'wagmi';

import { Button } from "../styles/ui/Button";// import { useSession } from "next-auth/react";
import { protoMono } from '@/styles/fonts';
import Image from 'next/image';
import { InstagramIcon, TikTokIcon, AddFrameIcon } from '@/styles/svg/index';
import '@/styles/footer.css';
import Game from './Game';

export default function AdivinaDrone(
  { title }: { title?: string } = { title: "adivinaDrone" }
) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [added, setAdded] = useState(false);
  const [addFrameResult, setAddFrameResult] = useState("");
  const [isGameActive, setIsGameActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { address } = useAccount();
  const [walletAddress, setWalletAddress] = useState<string>('');

  // contexto del frame
  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      console.log('Farcaster context:', context); // Para debug
      setContext(context);
      setAdded(context.client.added);

      // Intentamos obtener la billetera
      if (context.user) {
        try {
          const provider = await sdk.wallet.ethProvider;
          const accounts = await provider.request({ method: 'eth_requestAccounts' });
          if (accounts[0]) {
            setWalletAddress(accounts[0]);
            console.log('Connected wallet:', accounts[0]); // Para debug
          }
        } catch (error) {
          console.error('Error getting wallet:', error);
        }
      }

      sdk.on("frameAddRejected", ({ reason }) => {
        console.log(`Frame add rejected: ${reason}`);
      });

      sdk.on("frameRemoved", () => {
        setAdded(false);
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

  const addFrame = useCallback(async () => {
    try {
      const result = await sdk.actions.addFrame();

      if (result.notificationDetails) {
        setAddFrameResult(
          result.notificationDetails
            ? `Added, got notificaton token ${result.notificationDetails.token} and url ${result.notificationDetails.url}`
            : "Added, got no notification details"
        );
      }
    } catch (error) {
      if (error instanceof AddFrame.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      if (error instanceof AddFrame.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      setAddFrameResult(`Error: ${error}`);
    }
  }, []);

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
    setIsGameActive(true);
  };

  // carga el componente
  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }
  return (
    <div className="min-h-screen bg-[#2d283a] text-white font-mono flex flex-col">
      <header className={`w-full p-4 flex justify-between items-center ${protoMono.className}`}>
        <div className="flex items-center">
          <Image
            src="/favicon.png"
            alt="adivinaDrone Logo"
            width={64}
            height={64}
            priority
          />
        </div>
        {context?.user && context.user.pfpUrl && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#ff8800] rounded-full text-white min-w-[150px]">
              <Image
                src={context.user.pfpUrl}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full border-2 border-white"
                unoptimized
              />
              <span className="text-left">{context.user.username}</span>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center p-2">
        <div className="flex flex-col items-center gap-3">
          {isGameActive && context?.user ? (
            <Game 
              userId={context.user.fid.toString()} 
              seasonId="0"
              onBack={() => setIsGameActive(false)}
            />
          ) : (
            <>
              <div className="w-[300px] mx-auto">
                <h1 className="text-2xl font-bold text-center mb-1">{title}</h1>

                <div>
                </div>

              </div>
              <div className="relative border-2 border-[#ff8800] bg-[#3d3849] rounded-2xl p-6 max-w-2xl w-full overflow-hidden">
                <div className="absolute inset-0 z-0">
                  <Image
                    src="/mapaTrans.png"
                    alt="Background Map"
                    fill
                    style={{ objectFit: 'cover' }}
                    className="opacity-80"
                  />
                </div>
                <div className={`relative z-10 text-center space-y-3 ${protoMono.className}`}>
                  <div className="flex flex-col gap-1">
                    <p className="text-xl">Welcome to</p>
                    <h1 className="text-4xl font-bold">adivinaDrone</h1>
                    <h2 className="text-3xl font-semibold opacity-90">Season 0</h2>
                  </div>
                  
                  <div className="mt-6">
                    <p className="text-lg leading-relaxed">
                      Think you know the world?<br />
                      Take the ultimate guess in your photo challenge.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`flex flex-col items-center gap-3 w-full max-w-2xl ${protoMono.className}`}>
                <Button
                  onClick={handleStartGame}
                  disabled={isConnecting}
                  className="w-full bg-[#3d3849] border-2 border-[#ff8800] hover:bg-[#4d4859] text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isConnecting ? 'Conectando...' : context?.user ? 'Launch Season 0' : 'Conectar billetera para jugar'}
                </Button>

                {!context?.user && (
                  <p className="text-sm text-yellow-500">
                    Necesitas conectar tu billetera para jugar
                  </p>
                )}

                {context?.user && (
                  <div className="text-sm text-gray-300">
                    <p>Billetera conectada:</p>
                    <p className="font-mono break-all">
                      {walletAddress || 'Conectando...'}
                    </p>
                  </div>
                )}
                
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

                  <Button 
                    onClick={addFrame} 
                    disabled={added} 
                    className="flex-1"
                  >
                    <AddFrameIcon />
                  </Button>
                </div>

                <div className="w-full mt-1">
                  <div className="mb-4">
                    {addFrameResult && (
                      <div className="mb-2 text-xs text-left opacity-50">
                        Add frame result: {addFrameResult}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className={`w-full overflow-hidden py-2 mb-4 ${isGameActive ? 'hidden' : ''}`}>
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