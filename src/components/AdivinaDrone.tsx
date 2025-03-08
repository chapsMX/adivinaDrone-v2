"use client";
import { useEffect, useState } from "react";
import { type Context } from "@farcaster/frame-sdk";
import { protoMono } from '@/styles/fonts';
import Image from 'next/image';
import sdk from "@farcaster/frame-sdk";
import { ShareIcon, AddFrameIcon, RemoveFrameIcon, InstagramIcon, TikTokIcon } from '@/styles/svg';

// dependencias eliminadas, considerar al momento de agregar transacciones
//import { signIn, signOut,} from "next-auth/react";
//import sdk, {AddFrame, FrameNotificationDetails, SignIn as SignInCore, type Context} from "@farcaster/frame-sdk";
// wagmi para transacciones
// import { useAccount, useSendTransaction, useSignMessage, useSignTypedData, useWaitForTransactionReceipt,useDisconnect,useConnect,useSwitchChain, useChainId } from "wagmi";import { useSession } from "next-auth/react";
//import { createStore } from "mipd";

export default function AdivinaDrone() {
    const [isSDKLoaded, setIsSDKLoaded] = useState(false);
    const [context, setContext] = useState<Context.FrameContext>();
    const [addingFrame, setAddingFrame] = useState(false);
  
    useEffect(() => {
      const load = async () => {
        setContext(await sdk.context);
        sdk.actions.ready();
      };
      if (sdk && !isSDKLoaded) {
        setIsSDKLoaded(true);
        load();
      }
    }, [isSDKLoaded]);
  
    if (!isSDKLoaded) {
      return <div>Loading...</div>;
    }
  
    const handleAddFrame = async () => {
      if (addingFrame) return;
      
      try {
        setAddingFrame(true);
        const result = await sdk.actions.addFrame();
        
        if (result && 'added' in result && result.added) {
          // Frame agregado exitosamente
          console.log('Frame added successfully', result.notificationDetails);
          alert('Frame added successfully!');
        } else {
          // Frame no agregado
          console.log('Frame not added');
          alert('Failed to add frame. Please try again.');
        }
      } catch (error) {
        console.error('Error adding frame:', error);
        alert('Error adding frame. Please try again.');
      } finally {
        setAddingFrame(false);
      }
    };
  
    return (
      <div className="min-h-screen bg-[#2d283a] text-white font-mono flex flex-col">
        {/* encabezado, logo y usuario
        se agregará el botón de conectar farcaster */}
        <header className={`w-full p-4 flex justify-between items-center ${protoMono.className}`}>
          <div className="flex items-center">
            <Image
              src="/favicon.png"
              alt="AdivinaDrone Logo"
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

        {/* contenido principal */}
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-6">
            <div className="border-2 border-[#ff8800] bg-[#3d3849] rounded-2xl p-6 max-w-2xl w-full">
              <div className={`text-center space-y-3 ${protoMono.className}`}>
                <div className="flex flex-col gap-1">
                  <h1 className="text-4xl font-bold">adivinaDrone</h1>
                  <h2 className="text-3xl font-semibold opacity-90">Season 07</h2>
                </div>
                
                <p className="text-lg leading-relaxed mt-3">
                  Think you know the world? <br /> Take the ultimate guess in our photo challenge!
                </p>
              </div>
            </div>

            <div className={`flex flex-col items-center gap-3 w-full max-w-2xl ${protoMono.className}`}>
              <p className="text-2xl font-bold text-[#ff8800] animate-pulse tracking-widest">
                Coming Soon!
              </p>
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => {
                    const frameUrl = process.env.NEXT_PUBLIC_SITE_URL;
                    const castUrl = `https://warpcast.com/~/compose?text=🎯 adivinaDrone: The ultimate photo challenge! %0A%0AOne image a day, four options, and a juicy $DEGEN prize. Can you pinpoint the location? %0A%0AJoin the game at ${frameUrl}`;
                    window.open(castUrl, '_blank');
                  }}
                  className="flex-1 bg-transparent border-2 border-[#ff8800] text-[#ff8800] hover:bg-[#ff8800] hover:text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <ShareIcon />
                  Share
                </button>

                <button
                  onClick={handleAddFrame}
                  disabled={addingFrame}
                  className="flex-1 bg-transparent border-2 border-[#ff8800] text-[#ff8800] hover:bg-[#ff8800] hover:text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingFrame ? <RemoveFrameIcon /> : <AddFrameIcon />}
                  {addingFrame ? 'Adding...' : 'Add Frame'}
                </button>
              </div>
            </div>

            <div className={`flex flex-col items-center gap-2 w-full max-w-2xl ${protoMono.className}`}>
              <p className="text-2xl font-bold text-[#ff8800] animate-pulse tracking-widest">
                Follow Us
              </p>
              <div className="flex gap-4 w-full">
                <a
                  href="https://www.instagram.com/c13studio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-transparent border-2 border-[#ff8800] text-[#ff8800] hover:bg-[#ff8800] hover:text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <InstagramIcon />
                  Instagram
                </a>

                <a
                  href="https://www.tiktok.com/@c13studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-transparent border-2 border-[#ff8800] text-[#ff8800] hover:bg-[#ff8800] hover:text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <TikTokIcon />
                  TikTok
                </a>
              </div>
            </div>
          </div>
        </main>

        {/* Footer con textos animados */}
        <footer className="w-full overflow-hidden py-2 mb-4">
          <div className="relative flex flex-col gap-0.5">
            <div className="flex animate-scroll-left whitespace-nowrap -translate-x-8">
              <span className={`inline-block text-white text-xl ${protoMono.className}`}>
                c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio •
              </span>
              <span className={`inline-block text-white text-xl ${protoMono.className}`}>
                c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio •
              </span>
            </div>
            <div className="flex animate-scroll-right whitespace-nowrap">
              <span className={`inline-block text-white text-xl ${protoMono.className}`}>
                adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone •
              </span>
              <span className={`inline-block text-white text-xl ${protoMono.className}`}>
                adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone •
              </span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Agrega los estilos de animación en el archivo globals.css
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes scroll-left {
      0% { transform: translateX(100%); }
      100% { transform: translateX(-100%); }
    }
    @keyframes scroll-right {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .animate-scroll-left {
      animation: scroll-left 20s linear infinite;
    }
    .animate-scroll-right {
      animation: scroll-right 20s linear infinite;
    }
  `;
  document.head.appendChild(styleSheet);