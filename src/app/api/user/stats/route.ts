import { NextResponse } from 'next/server';
import { 
  UserService,
  UserResponseService,
  SeasonService
} from '@/lib/database';
import { validateFarcasterId } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const seasonId = searchParams.get('seasonId');

    console.log('Stats requested for:', { userId, seasonId });

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
      console.log('Usuario no encontrado, retornando estadísticas vacías');
      return NextResponse.json({
        gamesPlayed: 0,
        totalScore: 0,
        averageResponseTime: 0
      });
    }

    // Obtener estadísticas
    const stats = await UserResponseService.getUserStats(user.id, season.id);
    console.log('Estadísticas obtenidas:', stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 