import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const seasonId = searchParams.get('seasonId') || 'Season 07';

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Obtener el ID real de la temporada
    const seasonResult = await sql`
      SELECT id FROM seasons WHERE name = ${seasonId};
    `;

    if (seasonResult.length === 0) {
      // Si no existe la temporada, devolver valores por defecto
      return NextResponse.json({
        gamesPlayed: 0,
        totalScore: 0,
        averageResponseTime: 0
      });
    }

    const realSeasonId = seasonResult[0].id;

    // Obtener el ID real del usuario
    const userResult = await sql`
      SELECT id FROM users WHERE farcaster_id = ${userId};
    `;

    if (userResult.length === 0) {
      // Si no existe el usuario, devolver valores por defecto
      return NextResponse.json({
        gamesPlayed: 0,
        totalScore: 0,
        averageResponseTime: 0
      });
    }

    const realUserId = userResult[0].id;

    // Obtener estadísticas del usuario
    const statsResult = await sql`
      WITH user_stats AS (
        SELECT 
          COUNT(DISTINCT DATE(ur.created_at)) as games_played,
          COALESCE(sp.total_points, 0) as total_score,
          ROUND(AVG(ur.response_time)::numeric, 1) as avg_response_time
        FROM users u
        LEFT JOIN user_responses ur ON u.id = ur.user_id
        LEFT JOIN images i ON ur.image_id = i.id
        LEFT JOIN season_points sp ON u.id = sp.user_id AND sp.season_id = ${realSeasonId}
        WHERE u.id = ${realUserId}
        AND i.season_id = ${realSeasonId}
        GROUP BY sp.total_points
      )
      SELECT 
        COALESCE(games_played, 0) as games_played,
        COALESCE(total_score, 0) as total_score,
        COALESCE(avg_response_time, 0) as avg_response_time
      FROM user_stats;
    `;

    // Si no hay resultados, devolver valores por defecto
    if (statsResult.length === 0) {
      return NextResponse.json({
        gamesPlayed: 0,
        totalScore: 0,
        averageResponseTime: 0
      });
    }

    return NextResponse.json({
      gamesPlayed: parseInt(statsResult[0].games_played),
      totalScore: parseInt(statsResult[0].total_score),
      averageResponseTime: parseFloat(statsResult[0].avg_response_time)
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    // En caso de error, devolver valores por defecto
    return NextResponse.json({
      gamesPlayed: 0,
      totalScore: 0,
      averageResponseTime: 0
    });
  }
} 