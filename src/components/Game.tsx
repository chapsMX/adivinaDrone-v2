'use client';

import React, { useEffect, useState } from 'react';
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
  username: string;
}

export default function Game({ userId, username }: GameProps) {
  const [images, setImages] = useState<GameImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreloading, setIsPreloading] = useState(true);
  const [showingResults, setShowingResults] = useState(false);
  const [globalScore, setGlobalScore] = useState(0);
  const [showShareButtons, setShowShareButtons] = useState(false);
  const [hasSharedStats, setHasSharedStats] = useState(false);
  const [hasSharedBonus, setHasSharedBonus] = useState(false);
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

  const currentImage = images[currentImageIndex];
  const options = currentImage
    ? [currentImage.correct_answer, currentImage.option_1, currentImage.option_2, currentImage.option_3]
    : [];

  // Función para precargar una imagen
  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  };

  // Cargar imágenes al inicio
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        setIsPreloading(true);
        console.log('Fetching images for user:', userId);
        const response = await fetch(`/api/game?userId=${userId}&seasonId=Season 08`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch images');
        }

        if (data.images && data.images.length > 0) {
          // Precargar todas las imágenes antes de mostrarlas
          await Promise.all(data.images.map((img: GameImage) => preloadImage(img.image_path)));

          setImages(data.images);
          setCurrentImageIndex(0);
          
          // Preparar las opciones para la primera imagen
          const firstImage = data.images[0];
          const allOptions = [
            firstImage.correct_answer,
            firstImage.option_1,
            firstImage.option_2,
            firstImage.option_3
          ];
          
          // Mezclar las opciones
          for (let i = allOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
          }
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        // Pequeño delay para asegurar que las imágenes estén cargadas
        setTimeout(() => {
          setIsLoading(false);
          setIsPreloading(false);
        }, 500);
      }
    };

    fetchImages();
  }, [userId]);

  // Temporizador
  useEffect(() => {
    if (!isLoading && !showingResults && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLoading, showingResults, timeLeft]);

  // Manejar la selección de respuesta
  const handleAnswerSelect = async (answer: string) => {
    if (selectedAnswer !== null || !currentImage) return;
    
    setSelectedAnswer(answer);
    const isCorrect = answer === currentImage.correct_answer;
    setIsAnswerCorrect(isCorrect);

    try {
      // Enviar respuesta al servidor
      const response = await fetch("/api/game/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          imageId: currentImage.id,
          answer,
          timeLeft
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }
      
      // Si hay más imágenes, preparar la siguiente
      if (currentImageIndex < images.length - 1) {
        setTimeout(() => {
          setCurrentImageIndex(prev => prev + 1);
          setSelectedAnswer(null);
          setIsAnswerCorrect(null);
        }, 2000);
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
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleShare = async () => {
    try {
      // Primero registrar el share
      console.log('Registrando share desde Game:', { userId });
      const shareResponse = await fetch("/api/game/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId
        }),
      });

      if (!shareResponse.ok) {
        throw new Error('Failed to register share');
      }

      setHasSharedStats(true);
      window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(`Just played adivinaDrone and scored ${globalScore} points!\n🎮 Daily drone photo challenge\n🏆 Win prizes\n\nhttps://adivinadrone.c13studio.mx`));
    } catch (error) {
      console.error('Error sharing stats:', error);
    }
  };

  const handleShareBonus = async () => {
    try {
      const response = await fetch("/api/game/share-bonus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register bonus share');
      }

      setHasSharedBonus(true);
      window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(`Join me in Season 08 of adivinaDrone!\n🎮 Daily drone photo challenge\n🏆 Win prizes\n\nhttps://adivinadrone.c13studio.mx`));
    } catch (error) {
      console.error('Error sharing bonus:', error);
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
    }
  };

  if (isLoading || isPreloading) {
    return (
      <div className="fixed inset-0 bg-[#2d283a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (showingResults) {
    return (
      <div className="fixed inset-0 bg-[#2d283a] flex items-center justify-center p-4">
        <div className="bg-[#3d3849] border-2 border-[#ff8800] rounded-xl p-6 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Game Over!</h2>
            <p className="text-white mb-2">Your score: {globalScore}</p>
            
            {!hasSharedStats && (
              <button
                onClick={handleShare}
                className="w-full bg-[#ff8800] text-white py-2 rounded-lg mb-4 hover:bg-[#e67a00] transition-colors"
              >
                Share Score
              </button>
            )}

            {!hasSharedBonus && (
              <button
                onClick={handleShareBonus}
                className="w-full bg-transparent border-2 border-[#ff8800] text-white py-2 rounded-lg hover:bg-[#3d3849] transition-colors mb-4"
              >
                Share Game
              </button>
            )}

            <div className="text-white text-sm">
              <p>Come back tomorrow for 3 new photos!</p>
              <p className="text-sm mt-2 opacity-70">3 new images daily at 18.00 CST!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#2d283a]">
      {/* Temporizador */}
      <div className={`absolute top-4 right-4 z-10 ${protoMono.className}`}>
        <div className="text-white text-xl font-bold">
          {timeLeft}s
        </div>
      </div>

      {/* Imagen */}
      <div className="relative h-[60vh] w-full">
        <Image
          src={currentImage.image_path}
          alt="Location"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      </div>

      {/* Opciones */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#2d283a] to-transparent">
        <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={selectedAnswer !== null}
              className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all transform ${
                selectedAnswer === null
                  ? 'bg-[#3d3849] border-2 border-[#ff8800] hover:bg-[#4d4859]'
                  : selectedAnswer === option
                  ? isAnswerCorrect
                    ? 'bg-green-500 border-2 border-green-500'
                    : 'bg-red-500 border-2 border-red-500'
                  : option === currentImage.correct_answer && selectedAnswer !== null
                  ? 'bg-green-500 border-2 border-green-500'
                  : 'bg-[#3d3849] border-2 border-[#3d3849] opacity-50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 