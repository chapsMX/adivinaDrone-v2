import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      console.log('Falta userId en la petición');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Obteniendo score para usuario:', userId);

    // Obtener el ID real de la temporada
    const seasonResult = await sql`
      SELECT id FROM seasons WHERE name = 'Season 00';
    `;

    if (seasonResult.length === 0) {
      console.log('No se encontró la temporada Season 00');
      return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    }

    const realSeasonId = seasonResult[0].id;
    console.log('ID real de la temporada:', realSeasonId);

    // Obtener el ID real del usuario
    const userResult = await sql`
      SELECT id FROM users WHERE farcaster_id = ${userId};
    `;

    if (userResult.length === 0) {
      console.log('Usuario no encontrado:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const realUserId = userResult[0].id;
    console.log('ID real del usuario:', realUserId);

    // Obtener el score global del usuario para la temporada
    const scoreResult = await sql`
      SELECT COALESCE(SUM(total_points), 0) as total_score
      FROM season_points
      WHERE user_id = ${realUserId}
      AND season_id = ${realSeasonId};
    `;

    console.log('Score encontrado:', scoreResult[0].total_score);

    return NextResponse.json({ 
      globalScore: parseInt(scoreResult[0].total_score) || 0 
    });
  } catch (error) {
    console.error('Error detallado al obtener score:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 