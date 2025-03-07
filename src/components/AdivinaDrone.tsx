"use client";
import {useEffect, useState, useCallback, useMemo} from "react";
import { signIn, signOut,} from "next-auth/react";
import sdk, {AddFrame, FrameNotificationDetails, SignIn as SignInCore, type Context} from "@farcaster/frame-sdk";
// wagmi para transacciones
import { useAccount, useSendTransaction, useSignMessage, useSignTypedData, useWaitForTransactionReceipt,useDisconnect,useConnect,useSwitchChain, useChainId } from "wagmi";import { useSession } from "next-auth/react";
import { createStore } from "mipd";
import { protoMono } from '@/styles/fonts';

export default function AdivinaDrone() {
    const [isSDKLoaded, setIsSDKLoaded] = useState(false);
    const [context, setContext] = useState<Context.FrameContext>();
  
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
  
    return (
      <div className="min-h-screen bg-[#2d283a] text-white font-mono flex flex-col">
        {/* encabezado, logo y usuario
        se agregará el botón de conectar farcaster */}
        <header className={`w-full p-4 flex justify-between items-center ${protoMono.className}`}>
          <div className="flex items-center">
            <img
              src="/favicon.png"
              alt="AdivinaDrone Logo"
              className="w-16 h-16"
            />
          </div>
          {context?.user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-[#ff8800] rounded-full text-white min-w-[150px]">
                <img
                  src={context.user.pfpUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-white"
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
                    const castUrl = `https://warpcast.com/~/compose?text=🎯 adivinaDrone: The ultimate photo challenge! %0A%0AOne image a day, four options, and a juicy $DEGEN prize. Can you pinpoint the location? %0A%0AJoin the game at https://warpcast.com/~/channel/adivinadrone`;
                    window.open(castUrl, '_blank');
                  }}
                  className="flex-1 bg-transparent border-2 border-[#ff8800] text-[#ff8800] hover:bg-[#ff8800] hover:text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                  </svg>
                  Share
                </button>

                <button
                  onClick={() => {
                    // Aquí irá la lógica para Add Frame
                  }}
                  className="flex-1 bg-transparent border-2 border-[#ff8800] text-[#ff8800] hover:bg-[#ff8800] hover:text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add Frame
                </button>
              </div>
            </div>

            <div className={`flex flex-col items-center gap-2 w-full max-w-2xl ${protoMono.className}`}>
              <p className="text-white font-semibold">Follow Us</p>
              <div className="flex gap-4 w-full">
                <a
                  href="https://www.instagram.com/c13studio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-transparent border-2 border-[#ff8800] text-[#ff8800] hover:bg-[#ff8800] hover:text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </a>

                <a
                  href="https://www.tiktok.com/@c13studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-transparent border-2 border-[#ff8800] text-[#ff8800] hover:bg-[#ff8800] hover:text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 015.43 5C3.55 5 2.03 3.7 2 2h3.09c.05.23.13.45.24.66.36.65.87 1.2 1.48 1.59.69.43 1.49.67 2.31.67 1.07 0 2.09-.37 2.91-1.04.82-.67 1.34-1.58 1.45-2.56h3.02c-.1 1.54-.82 2.98-2.03 4.03-.96.84-2.1 1.4-3.31 1.61V17c0 2.76-2.24 5-5 5s-5-2.24-5-5v-2h3v2c0 1.13.61 2.12 1.52 2.65.7.41 1.52.52 2.29.32.88-.23 1.62-.83 2.01-1.64.31-.65.47-1.37.47-2.1V6.63c-.84.27-1.72.39-2.59.39-.15 0-.3-.01-.45-.02v3.37c.28.02.56.05.84.05 2.21 0 4-1.79 4-4h3.13c.05.39.08.79.08 1.19v.04z"/>
                  </svg>
                  TikTok
                </a>
              </div>
            </div>
          </div>
        </main>

        {/* Footer con textos animados */}
        <footer className="w-full overflow-hidden py-2 mb-4">
          <div className="relative flex flex-col gap-0.5">
            <div className="flex animate-scroll-left whitespace-nowrap">
              <span className={`inline-block text-white text-xl ${protoMono.className}`}>
                c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • 
              </span>
              <span className={`inline-block text-white text-xl ${protoMono.className}`}>
                c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • c13studio • 
              </span>
            </div>
            <div className="flex animate-scroll-right whitespace-nowrap">
              <span className={`inline-block text-white text-xl ${protoMono.className}`}>
                adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • 
              </span>
              <span className={`inline-block text-white text-xl ${protoMono.className}`}>
                adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • adivinaDrone • 
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