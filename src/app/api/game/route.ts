import { NextResponse } from 'next/server';
import { 
  UserService,
  SeasonService,
  ImageService,
  GameService
} from '@/lib/database';
import { 
  validateGameRequest,
  sanitizeUsername,
  sanitizeString
} from '@/lib/validations';
import type { CreateUserData } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const seasonId = searchParams.get('seasonId');
    const username = searchParams.get('username');
    const extraLife = searchParams.get('extraLife') === 'true';

    // Validar y sanitizar inputs
    const sanitizedUsername = username ? sanitizeUsername(username) : undefined;
    const sanitizedSeasonId = seasonId ? sanitizeString(seasonId) : undefined;

    const validation = validateGameRequest(
      userId || '', 
      sanitizedUsername, 
      sanitizedSeasonId, 
      extraLife
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

    console.log('Buscando imágenes para:', { userId, seasonId });

    // Crear o actualizar usuario primero
    const userData: CreateUserData = {
      farcaster_id: userId,
      username: sanitizedUsername,
      early_access_requested: false,
      is_whitelisted: false
    };
    const user = await UserService.createOrUpdate(userData);

    // Verificar si el usuario puede jugar
    const gameStatus = await GameService.canPlayGame(user.id, extraLife);
    if (!gameStatus.canPlay) {
      const response = {
        error: gameStatus.reason,
        dailyLimit: gameStatus.dailyLimit,
        extraLifeUsed: gameStatus.extraLifeUsed,
        seasonStatus: gameStatus.seasonStatus
      };
      return NextResponse.json(response, { status: 403 });
    }

    // Obtener la temporada
    const season = await SeasonService.findByName(seasonId!);
    if (!season) {
      console.log('No se encontró la temporada:', seasonId);
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      );
    }

    // Verificar si hay imágenes disponibles
    const imageCount = await ImageService.getCountBySeason(season.id);
    if (imageCount === 0) {
      console.log('No hay imágenes en la temporada');
      return NextResponse.json(
        { error: 'No images available in this season' },
        { status: 404 }
      );
    }

    // Obtener imágenes aleatorias
    const limit = extraLife ? 1 : 3;
    const images = await ImageService.getRandomForUser(user.id, season.id, limit);

    console.log('Imágenes encontradas:', images.length);

    if (images.length === 0) {
      console.log('No se encontraron imágenes aleatorias');
      return NextResponse.json(
        { 
          error: 'No images available in this season',
          debug: {
            totalImages: imageCount,
            seasonId: season.id
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error detallado:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 