import { NextResponse } from 'next/server';
import { 
  SeasonService,
  SeasonPointsService
} from '@/lib/database';
import { validatePagination } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('Winners leaderboard requested:', { limit, offset });

    // Validar paginación
    const paginationValidation = validatePagination(limit, offset);
    if (!paginationValidation.isValid) {
      console.log('Validación de paginación fallida:', paginationValidation.errors);
      return NextResponse.json(
        { error: paginationValidation.errors[0].message },
        { status: 400 }
      );
    }

    // Obtener temporadas completadas
    const completedSeasons = await SeasonService.getAll({
      limit: 100,
      offset: 0
    });

    // Filtrar temporadas completadas manualmente
    const now = new Date();
    const finishedSeasons = completedSeasons.filter(season => 
      !season.is_active && season.end_date < now
    ).sort((a, b) => b.end_date.getTime() - a.end_date.getTime());

    if (finishedSeasons.length === 0) {
      console.log('No hay temporadas completadas');
      return NextResponse.json({ 
        winners: [],
        message: 'Aún no hay temporadas finalizadas',
        nextSeason: {
          name: 'Season 07',
          startDate: new Date('2024-07-01').toISOString(),
          message: 'La próxima temporada comienza el 1 de Julio'
        }
      });
    }

    // Obtener ganadores de cada temporada
    const winners = await Promise.all(
      finishedSeasons.map(async (season) => {
        const leaderboard = await SeasonPointsService.getLeaderboard(season.id, 1);
        const status = await SeasonService.getSeasonStatus(season.id);
        return {
          season: season.name,
          winner: leaderboard[0] || null,
          status: status.status,
          message: status.message,
          startDate: season.start_date,
          endDate: season.end_date
        };
      })
    );

    // Filtrar temporadas sin ganadores y aplicar paginación
    const validWinners = winners
      .filter(w => w.winner !== null)
      .slice(offset, offset + limit);

    console.log('Winners obtenidos:', validWinners.length);

    // Obtener información de la próxima temporada
    const nextSeasonNumber = String(
      Math.max(...finishedSeasons.map(s => 
        parseInt(s.name.split(' ')[1])
      )) + 1
    ).padStart(2, '0');

    return NextResponse.json({ 
      winners: validWinners,
      nextSeason: {
        name: `Season ${nextSeasonNumber}`,
        startDate: new Date('2024-07-01').toISOString(),
        message: 'La próxima temporada comienza el 1 de Julio'
      }
    });
  } catch (error) {
    console.error('Error obteniendo winners:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 