import { NextResponse } from 'next/server';
import { 
  UserService,
  GameService
} from '@/lib/database';
import { 
  validateAnswerRequest,
  sanitizeString
} from '@/lib/validations';
import type { CreateUserData } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, imageId, seasonId, answer, timeLeft } = body;

    // Validar y sanitizar inputs
    const sanitizedAnswer = sanitizeString(answer || '');
    const sanitizedSeasonId = sanitizeString(seasonId || '');

    const validation = validateAnswerRequest(
      userId || '',
      imageId,
      sanitizedSeasonId,
      sanitizedAnswer,
      timeLeft
    );

    if (!validation.isValid) {
      console.log('Validación fallida:', validation.errors);
      return NextResponse.json(
        { error: validation.errors[0].message },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    console.log('Procesando respuesta:', { userId, imageId, seasonId, answer, timeLeft });

    // Crear o actualizar usuario
    const userData: CreateUserData = {
      farcaster_id: userId,
      username: undefined,
      early_access_requested: false,
      is_whitelisted: false
    };
    const user = await UserService.createOrUpdate(userData);

    // Procesar la respuesta
    const result = await GameService.processAnswer(
      user.id,
      imageId,
      sanitizedAnswer,
      timeLeft,
      parseInt(seasonId)
    );

    return NextResponse.json({
      isCorrect: result.isCorrect,
      correctAnswer: result.correctAnswer,
      pointsEarned: result.pointsEarned
    });
  } catch (error) {
    console.error('Error procesando respuesta:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 