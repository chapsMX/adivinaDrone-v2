import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Obtener el ID real de la temporada
    const seasonResult = await sql`
      SELECT id FROM seasons WHERE name = 'Season 00';
    `;

    if (seasonResult.length === 0) {
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      );
    }

    const realSeasonId = seasonResult[0].id;

    // Obtener el ID real del usuario
    const userResult = await sql`
      SELECT id FROM users WHERE farcaster_id = ${userId};
    `;

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const realUserId = userResult[0].id;

    // Obtener estadísticas del usuario
    const statsResult = await sql`
      WITH user_stats AS (
        SELECT 
          COUNT(DISTINCT DATE(ur.created_at)) as games_played,
          COALESCE(sp.total_points, 0) as total_score,
          AVG(ur.response_time) as avg_response_time
        FROM user_responses ur
        LEFT JOIN season_points sp ON ur.user_id = sp.user_id AND sp.season_id = ${realSeasonId}
        WHERE ur.user_id = ${realUserId}
        AND ur.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY sp.total_points
      )
      SELECT 
        COALESCE(games_played, 0) as games_played,
        COALESCE(total_score, 0) as total_score,
        COALESCE(ROUND(avg_response_time::numeric, 1), 0) as avg_response_time
      FROM user_stats;
    `;

    return NextResponse.json({
      gamesPlayed: parseInt(statsResult[0].games_played),
      totalScore: parseInt(statsResult[0].total_score),
      averageResponseTime: parseFloat(statsResult[0].avg_response_time)
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 