import { NextResponse } from 'next/server';
import { 
  UserService,
  UserResponseService,
  SeasonService
} from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const seasonId = searchParams.get('seasonId');

    console.log('Stats requested for:', { userId, seasonId });

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Obtener el usuario
    const user = await UserService.findByFarcasterId(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Si no se especifica temporada, usar la actual
    let season;
    if (seasonId) {
      season = await SeasonService.findByName(seasonId);
    } else {
      season = await SeasonService.getCurrentSeason();
    }

    if (!season) {
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      );
    }

    // Obtener estadísticas
    const stats = await UserResponseService.getUserStats(user.id, season.id);
    console.log('User stats:', stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 