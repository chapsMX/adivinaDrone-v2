'use client';

import { useEffect, useState } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { tokenContract, TOKEN_ADDRESS, LIFE_COST } from '@/lib/contracts';
import { formatUnits } from 'viem';
import { protoMono } from '@/styles/fonts';
import Image from 'next/image';
import { Button } from '@/styles/ui/Button';
import { useRouter } from 'next/navigation';
import sdk, { type Context } from "@farcaster/frame-sdk";
import Game from '@/components/Game';

export default function ExtraLifePage() {
  const router = useRouter();
  const { address } = useAccount();
  const { data: tokenBalance } = useBalance({
    address,
    token: TOKEN_ADDRESS,
  });
  const { writeContractAsync: transfer } = useWriteContract();
  const [transactionHash, setTransactionHash] = useState<string>();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<Context.FrameContext>();
  const [isGameActive, setIsGameActive] = useState(false);
  const [hasExtraLife, setHasExtraLife] = useState(false);

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  useEffect(() => {
    const loadContext = async () => {
      const context = await sdk.context;
      setContext(context);
      
      // Verificar si ya tiene una vida extra
      if (context?.user) {
        try {
          const response = await fetch(`/api/extra-life/check?userId=${context.user.fid}`);
          const data = await response.json();
          setHasExtraLife(data.hasExtraLife);
        } catch (error) {
          console.error('Error checking extra life:', error);
        }
      }
    };
    loadContext();
  }, []);

  useEffect(() => {
    const registerExtraLife = async () => {
      if (isConfirmed && transactionHash && context?.user && !hasExtraLife) {
        try {
          const response = await fetch('/api/extra-life', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: context.user.fid,
              transactionHash,
            }),
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Error al registrar la vida extra');
          }

          setHasExtraLife(true);
          setError(null); // Limpiar cualquier error previo
        } catch (error) {
          console.error('Error al registrar la vida extra:', error);
          setError(error instanceof Error ? error.message : 'Error al registrar la vida extra');
        }
      }
    };

    registerExtraLife();
  }, [isConfirmed, transactionHash, context?.user, hasExtraLife]);

  const handleBuyLife = async () => {
    if (!address) {
      setError('No hay dirección de billetera conectada');
      return;
    }

    try {
      setIsApproving(true);
      setError(null);
      
      const transferHash = await transfer({
        ...tokenContract,
        functionName: 'transfer',
        args: ['0xd5d94f926640cCDf6CC018A058a039C8D5EB045c', LIFE_COST],
      });

      if (transferHash) {
        setTransactionHash(transferHash);
      }
    } catch (error) {
      console.error('Error al comprar vida:', error);
      setError('Error al procesar la compra. Por favor, intenta de nuevo.');
    } finally {
      setIsApproving(false);
    }
  };

  if (isGameActive && context?.user) {
    return (
      <Game 
        userId={context.user.fid.toString()} 
        seasonId="Season 00"
        username={context.user.username || 'Anónimo'}
        onBack={() => {
          setIsGameActive(false);
          router.push('/');
        }}
        extraLife={true}
      />
    );
  }

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
        <button
          onClick={() => router.push('/')}
          className="border-2 border-[#ff8800] text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
        >
         Back
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 -mt-16">
        <div className="max-w-2xl w-full bg-[#3d3849] border-2 border-[#ff8800] rounded-2xl p-8">
          <div className={`space-y-6 text-center ${protoMono.className}`}>
            <h1 className="text-4xl font-bold mb-4">
              {hasExtraLife ? 'Extra Life Available!' : 'Buy an Extra Life'}
            </h1>
            
            <div className="space-y-4">
              <div className="p-4 border-2 border-[#ff8800] rounded-xl bg-black/20">
                {hasExtraLife ? (
                  <div className="space-y-2">
                    <p className="text-lg">You have an extra life ready to play!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg">Cost: {formatUnits(LIFE_COST, 18)} $DRONE</p>
                    {tokenBalance && (
                      <p className="text-sm opacity-80">
                        Your balance: {formatUnits(tokenBalance.value, tokenBalance.decimals)} {tokenBalance.symbol}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="text-red-500 text-sm">
                  {error}
                </div>
              )}

              {hasExtraLife ? (
                <Button
                  onClick={() => setIsGameActive(true)}
                  className="w-full bg-[#3d3849] border-2 border-[#ff8800] hover:bg-[#4d4859] text-white font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  Play Extra Life
                </Button>
              ) : (
                <Button
                  onClick={handleBuyLife}
                  disabled={isApproving || isConfirming || !address}
                  className="w-full bg-[#3d3849] border-2 border-[#ff8800] hover:bg-[#4d4859] text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isApproving ? 'Processing...' : 
                   isConfirming ? 'Confirming...' : 
                   !address ? 'Connect Wallet' : 
                   'Buy Extra Life'}
                </Button>
              )}

              <div className="text-sm text-left">
                <p>• 1 extra life = 1 additional photo</p>
                <p>• Max 1 extra life per day</p>  
                <p>• Extra points = 50% of normal value</p>   
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 