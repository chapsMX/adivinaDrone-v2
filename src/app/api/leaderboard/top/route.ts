import { NextResponse } from 'next/server';
import { 
  SeasonService,
  SeasonPointsService
} from '@/lib/database';
import { validatePagination } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('Leaderboard requested for:', { seasonId, limit });

    // Validar paginación
    const paginationValidation = validatePagination(limit, 0);
    if (!paginationValidation.isValid) {
      console.log('Validación de paginación fallida:', paginationValidation.errors);
      return NextResponse.json(
        { error: paginationValidation.errors[0].message },
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

    // Obtener estado de la temporada
    const seasonStatus = await SeasonService.getSeasonStatus(season.id);

    // Obtener leaderboard
    const leaderboard = await SeasonPointsService.getLeaderboard(season.id, limit);
    console.log('Leaderboard obtenido:', leaderboard.length, 'entradas');

    return NextResponse.json({ 
      season: season.name,
      status: seasonStatus.status,
      message: seasonStatus.message,
      leaderboard,
      nextSeason: seasonStatus.status === 'ended' ? {
        name: `Season ${String(parseInt(season.name.split(' ')[1]) + 1).padStart(2, '0')}`,
        startDate: new Date('2024-07-01').toISOString()
      } : undefined
    });
  } catch (error) {
    console.error('Error obteniendo leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 