'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { protoMono } from '@/styles/fonts';
import sdk from "@farcaster/frame-sdk";
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useConnect } from 'wagmi';
import { tokenContract, TOKEN_ADDRESS, LIFE_COST } from '@/lib/contracts';
import { formatUnits } from 'viem';

interface GameImage {
  id: number;
  image_number: number;
  correct_answer: string;
  option_1: string;
  option_2: string;
  option_3: string;
  image_path: string;
}

interface AnswerResult {
  imageId: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeLeft: number;
}

interface GameProps {
  userId: string;
  seasonId: string;
  username: string;
  hasExtraLife?: boolean;
  extraLife?: boolean;
  onBack?: () => void;
}

export default function Game({ userId, seasonId, username, extraLife = false, onBack }: GameProps) {
  const [images, setImages] = useState<GameImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);
  const [answers, setAnswers] = useState<AnswerResult[]>([]);
  const [showingResults, setShowingResults] = useState(false);
  const [globalScore, setGlobalScore] = useState(0);
  const [isApproving, setIsApproving] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string>();

  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: tokenBalance } = useBalance({
    address,
    token: TOKEN_ADDRESS,
  });

  const { writeContractAsync: transfer } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft((prev) => prev - 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    const registerExtraLife = async () => {
      if (isConfirmed && transactionHash && userId) {
        try {
          const response = await fetch('/api/extra-life', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              transactionHash,
            }),
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to register extra life');
          }

          setError(null);
        } catch (error) {
          console.error('Error registering extra life:', error);
          if (error instanceof Error) {
            if (error.message.includes('already have')) {
              setError('You already have an extra life for today');
            } else {
              setError('Failed to register extra life: ' + error.message);
            }
          } else {
            setError('Failed to register extra life. Please try again');
          }
        }
      }
    };

    registerExtraLife();
  }, [isConfirmed, transactionHash, userId]);

  // Función para precargar una imagen
  const preloadImage = async (src: string): Promise<void> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.src = src;
      img.onload = () => resolve();
    });
  };

  const fetchImages = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsPreloading(true);
      console.log('Fetching images with extraLife:', extraLife);
      const response = await fetch(`/api/game?userId=${userId}&seasonId=${seasonId}&extraLife=${extraLife}&username=${username}`);
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error fetching images:', data.error);
        return;
      }

      if (data.images && data.images.length > 0) {
        // Si es vida extra, usamos solo la primera imagen
        const imagesToUse = extraLife ? [data.images[0]] : data.images;
        
        // Precargar todas las imágenes antes de mostrarlas
        await Promise.all(imagesToUse.map((img: GameImage) => preloadImage(img.image_path)));

        setImages(imagesToUse);
        setCurrentImageIndex(0);
        
        // Preparar las opciones para la primera imagen
        const firstImage = imagesToUse[0];
        const allOptions = [
          firstImage.correct_answer,
          firstImage.option_1,
          firstImage.option_2,
          firstImage.option_3
        ];
        setOptions([...allOptions].sort(() => Math.random() - 0.5));
        setTimeLeft(90);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsPreloading(false);
      }, 500);
    }
  }, [userId, seasonId, extraLife, username]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const prepareNextImage = async (nextIndex: number) => {
    setIsTransitioning(true);
    const nextImage = images[nextIndex];
    
    // Precargar la siguiente imagen
    await preloadImage(nextImage.image_path);
    
    // Preparar las nuevas opciones
    const nextOptions = [
      nextImage.correct_answer,
      nextImage.option_1,
      nextImage.option_2,
      nextImage.option_3
    ];
    
    // Actualizar todo junto
    setOptions([...nextOptions].sort(() => Math.random() - 0.5));
    setCurrentImageIndex(nextIndex);
    setTimeLeft(90);
    setIsTransitioning(false);
  };

  const handleAnswer = async (answer: string) => {
    if (currentImageIndex >= images.length || isTransitioning) return;
    
    const currentImage = images[currentImageIndex];
    
    try {
      const response = await fetch("/api/game/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          imageId: currentImage.id,
          seasonId,
          answer,
          timeLeft
        }),
      });

      await response.json();
      console.log("Answer submitted successfully");

      // Guardar el resultado de la respuesta
      setAnswers(prev => [...prev, {
        imageId: currentImage.id,
        userAnswer: answer,
        correctAnswer: currentImage.correct_answer,
        isCorrect: answer === currentImage.correct_answer,
        timeLeft: timeLeft
      }]);
      
      // Si es vida extra, marcarla como usada
      if (extraLife) {
        try {
          await fetch("/api/extra-life/use", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId,
              seasonId
            }),
          });
        } catch (error) {
          console.error("Error marking extra life as used:", error);
        }

        try {
          const scoreResponse = await fetch(`/api/user/score?userId=${userId}`);
          if (!scoreResponse.ok) {
            console.error('Error en la respuesta del score:', scoreResponse.status);
            setGlobalScore(0);
          } else {
            const scoreData = await scoreResponse.json();
            setGlobalScore(scoreData.globalScore || 0);
          }
        } catch (error) {
          console.error("Error fetching global score:", error);
          setGlobalScore(0);
        }
        setShowingResults(true);
        setImages([]);
        return;
      }
      
      // Si hay más imágenes, preparar la siguiente
      if (currentImageIndex < images.length - 1) {
        await prepareNextImage(currentImageIndex + 1);
      } else {
        // No hay más imágenes, obtener score global y mostrar resultados
        try {
          const scoreResponse = await fetch(`/api/user/score?userId=${userId}`);
          if (!scoreResponse.ok) {
            console.error('Error en la respuesta del score:', scoreResponse.status);
            setGlobalScore(0);
          } else {
            const scoreData = await scoreResponse.json();
            setGlobalScore(scoreData.globalScore || 0);
          }
        } catch (error) {
          console.error("Error fetching global score:", error);
          setGlobalScore(0);
        }
        setShowingResults(true);
        setImages([]);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  const handleShare = async () => {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const normalAnswers = answers.slice(0, 3);
    const normalScore = normalAnswers.reduce((score, answer) => {
      return score + (answer.isCorrect ? (answer.timeLeft * 50) : 0);
    }, 0);
    
    try {
      // Primero registrar el share
      console.log('Registrando share desde Game:', { userId, seasonId });
      const shareResponse = await fetch("/api/game/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          seasonId
        }),
      });

      const shareData = await shareResponse.json();
      console.log('Respuesta del share:', shareData);

      if (!shareResponse.ok) {
        throw new Error(shareData.error || 'Failed to register share');
      }

      // Si el share se registró correctamente, agregar los puntos bonus
      const bonusResponse = await fetch("/api/game/share-bonus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          seasonId
        }),
      });

      if (bonusResponse.ok) {
        setGlobalScore(prev => prev + 1000); // Actualizar el score global en UI
        setHasShared(true); // Ocultar el botón después de compartir
      }

      // Una vez registrado el share y los puntos, abrir el composer
      const text = `I played my daily round of /adivinadrone and got ${correctAnswers}/3 correct answers! 🎯\nDaily Score: ${normalScore} points\nGlobal Score: ${globalScore} points\nCan you do it better? 🚀`;
      const url = "https://adivinadrone.c13studio.mx";
      
      // Pequeño delay para asegurar que el share se registre
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`);
    } catch (error) {
      console.error('Error al compartir:', error);
      if (error instanceof Error) {
        alert('Error al compartir: ' + error.message);
      } else {
        alert('Error al compartir. Por favor, intenta de nuevo.');
      }
    }
  };

  const handleBuyLife = async () => {
    if (!address) {
      setError('Please connect your wallet to purchase an extra life');
      return;
    }

    if (!tokenBalance) {
      setError('Unable to fetch your token balance. Please try again');
      return;
    }

    // Verificar si el usuario tiene suficiente balance
    if (tokenBalance.value < LIFE_COST) {
      const required = formatUnits(LIFE_COST, tokenBalance.decimals);
      const current = formatUnits(tokenBalance.value, tokenBalance.decimals);
      setError(`Insufficient balance. You need ${required} DRONE, but you have ${current} DRONE`);
      return;
    }

    try {
      console.log('Starting extra life purchase...');
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
      console.error('Error purchasing life:', error);
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          setError('Transaction failed: Insufficient funds for gas fee');
        } else if (error.message.includes('user rejected')) {
          setError('Transaction cancelled by user');
        } else if (error.message.includes('nonce')) {
          setError('Transaction failed: Please try again');
        } else {
          setError('Transaction failed: ' + error.message);
        }
      } else {
        setError('Failed to process transaction. Please try again');
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handlePlayExtraLife = () => {
    setShowingResults(false);
    fetchImages(); // Recargar el juego con una sola imagen
  };

  if (isLoading || isPreloading) {
    return (
      <div className="fixed inset-0 bg-[#2d283a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#ff8800] border-t-transparent rounded-full animate-spin"></div>
          <div className={`text-white text-xl ${protoMono.className}`}>Loading...</div>
        </div>
      </div>
    );
  }

  if (showingResults) {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const hasIncorrectAnswers = answers.some(a => !a.isCorrect);
    
    // Separar las respuestas en juego normal y vida extra
    const normalAnswers = answers.slice(0, 3);
    const extraLifeAnswer = answers.slice(3)[0];
    
    // Calcular scores separados
    const normalScore = normalAnswers.reduce((score, answer) => {
      return score + (answer.isCorrect ? (answer.timeLeft * 50) : 0);
    }, 0);
    
    const extraLifeScore = extraLifeAnswer 
      ? (extraLifeAnswer.isCorrect ? (extraLifeAnswer.timeLeft * 25) : 0) 
      : 0;

    return (
      <div className="fixed inset-0 bg-[#2d283a] flex items-center justify-center">
        <div className="max-w-2xl w-full mx-4 p-6 bg-[#3d3849] border-2 border-[#ff8800] rounded-2xl">
          <div className={`space-y-4 text-center ${protoMono.className}`}>
            <h2 className="text-3xl font-bold text-white mb-2">Game Summary</h2>
            <p className="text-xl text-white mb-6">
              Correct Answers: <span className="text-[#ff8800]">{correctAnswers}</span> / {answers.length}
            </p>
            
            <div className="space-y-4">
              {!extraLifeAnswer ? (
                // Vista normal (2 columnas: Today y Global)
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border-2 border-[#ff8800] rounded-xl bg-black/20">
                    <p className="text-sm text-white mb-2">Today&apos;s Score</p>
                    <p className="text-xl text-[#ff8800]">{normalScore}</p>
                  </div>
                  <div className="p-4 border-2 border-[#ff8800] rounded-xl bg-black/20">
                    <p className="text-sm text-white mb-2">Global Score</p>
                    <p className="text-xl text-[#ff8800]">{globalScore}</p>
                  </div>
                </div>
              ) : (
                // Vista con vida extra (Today y Extra Life en 2 columnas, Global abajo)
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border-2 border-[#ff8800] rounded-xl bg-black/20">
                      <p className="text-sm text-white mb-2">Today&apos;s Score</p>
                      <p className="text-xl text-[#ff8800]">{normalScore}</p>
                    </div>
                    <div className="p-4 border-2 border-[#ff8800] rounded-xl bg-black/20">
                      <p className="text-sm text-white mb-2">Extra Life Score</p>
                      <p className="text-xl text-[#ff8800]">{extraLifeScore}</p>

                    </div>
                  </div>
                  <div className="p-4 border-2 border-[#ff8800] rounded-xl bg-black/20">
                    <p className="text-sm text-white mb-2">Global Score</p>
                    <p className="text-xl text-[#ff8800]">{globalScore}</p>
                  </div>
                </>
              )}
            </div>

            {hasIncorrectAnswers && !extraLifeAnswer && !hasShared && (
              <div className="mt-6 p-4 border-2 border-[#ff8800] rounded-xl bg-black/20">
                {!isConfirmed && (
                  <>
                    <p className="text-lg text-white mb-3">
                      Want another chance?
                    </p>
                    {error && (
                      <div className="text-red-500 text-sm">
                        {error}
                      </div>
                    )}
                    {tokenBalance && (
                      <p className="text-sm text-white">
                        Balance: {formatUnits(tokenBalance.value, tokenBalance.decimals)} {tokenBalance.symbol}
                      </p>
                    )}
                  </>
                )}
                <div className="space-y-3">
                  <button
                    className="border-2 border-[#ff8800] text-white px-6 py-2 rounded-lg hover:bg-white/5 transition-colors w-full disabled:opacity-50"
                    onClick={() => !isConnected ? connect({ connector: connectors[0] }) : handleBuyLife()}
                    disabled={Boolean(isApproving || isConfirming || (!isConnected && address) || isConfirmed)}
                  >
                    {isApproving ? 'Processing...' : 
                     isConfirming ? 'Confirming...' : 
                     !isConnected ? 'Connect Wallet' : 
                     isConfirmed ? 'Life Purchased Successfully' :
                     'Buy Extra Life'}
                  </button>
                  {isConfirmed && (
                    <p className="text-sm text-white text-center">
                      You can play your life any time until 90 seconds before the daily reset.
                    </p>
                  )}
                </div>
              </div>
            )}

            {extraLife && !extraLifeAnswer && !showingResults && (
              <div className="mt-6">
                <button
                  className="border-2 border-[#ff8800] text-white px-6 py-2 rounded-lg hover:bg-white/5 transition-colors w-full"
                  onClick={handlePlayExtraLife}
                >
                  Play Extra Life
                </button>
              </div>
            )}

            {!hasShared && (
              <div className="mt-6">
                <button 
                  onClick={handleShare}
                  className="border-2 border-[#ff8800] text-white px-6 py-2 rounded-lg hover:bg-white/5 transition-colors w-full"
                >
                  Share Score (+1,000 points)
                </button>
              </div>
            )}

            <div className="mt-6">
              <div className="text-white text-lg">
                <p>Come back tomorrow.</p>
                <p className="text-sm mt-2 opacity-70">3 new images daily at 18.00 CST!</p>
              </div>

              <button
                onClick={onBack}
                className="mt-6 border-2 border-[#ff8800] text-white px-6 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (images.length === 0 || currentImageIndex >= images.length) {
    return null; // No mostrar nada mientras se preparan los resultados
  }

  const currentImage = images[currentImageIndex];

  return (
    <div className="fixed inset-0 bg-[#2d283a]">
      {/* Botón de retroceso */}
      <button
        onClick={onBack}
        className={`absolute top-4 left-4 z-10 border-2 border-[#ff8800] text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors ${protoMono.className} drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}
      >
        ← Back
      </button>

      {/* Temporizador */}
      <div className={`absolute top-4 right-4 z-10 ${protoMono.className}`}>
        <div className={`text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${
          timeLeft <= 10 ? 'text-red-500' : ''
        }`}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Contador de imágenes */}
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 ${protoMono.className}`}>
        <div className="text-white text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          {currentImageIndex + 1} / {images.length}
        </div>
      </div>

      {/* Imagen principal con overlay durante la transición */}
      <div className="relative w-full h-full">
        <div className={`absolute inset-0 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          <Image
            src={currentImage.image_path}
            alt={`Image ${currentImage.image_number}`}
            fill
            style={{ objectFit: 'cover' }}
            priority
            quality={100}
          />
        </div>
        {isTransitioning && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-[#ff8800] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Botones de respuesta */}
      <div className="absolute bottom-0 left-0 right-0 p-2 pb-8 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
        <div className="grid grid-cols-2 gap-2 max-w-full mx-1">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              disabled={isTransitioning}
              className={`border-2 border-[#ff8800] text-white px-1 py-1 rounded-lg hover:bg-white/5 transition-colors text-sm ${protoMono.className} ${
                isTransitioning ? 'opacity-50' : ''
              } drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 