import { NextResponse } from 'next/server';
import { 
  UserService,
  SeasonPointsService,
  SeasonService
} from '@/lib/database';
import { validateFarcasterId } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const seasonId = searchParams.get('seasonId');

    console.log('Score requested for:', { userId, seasonId });

    // Validar userId
    const validation = validateFarcasterId(userId || '');
    if (!validation.isValid) {
      console.log('Validación fallida:', validation.errors);
      return NextResponse.json(
        { error: validation.errors[0].message },
        { status: 400 }
      );
    }

    // Si no se proporciona seasonId, usar la temporada actual
    let season;
    if (seasonId) {
      season = await SeasonService.findByName(seasonId);
    } else {
      season = await SeasonService.getCurrentSeason();
    }

    if (!season) {
      console.log('No se encontró la temporada');
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      );
    }

    // Obtener usuario
    const user = await UserService.findByFarcasterId(userId!);
    if (!user) {
      console.log('Usuario no encontrado, retornando score 0');
      return NextResponse.json({ score: 0 });
    }

    // Obtener puntuación
    const score = await SeasonPointsService.getUserScore(user.id, season.id);
    console.log('Puntuación obtenida:', score);

    return NextResponse.json({ score });
  } catch (error) {
    console.error('Error obteniendo puntuación:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 