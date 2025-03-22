import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const SHARE_BONUS_POINTS = 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, seasonId } = body;

    if (!userId || !seasonId) {
      console.log('Faltan parámetros:', { userId, seasonId });
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Obtener el ID real de la temporada
    const seasonResult = await sql`
      SELECT id FROM seasons WHERE name = 'Season 00';
    `;

    if (seasonResult.length === 0) {
      console.log('No se encontró la temporada Season 00');
      return NextResponse.json(
        { error: 'Temporada no encontrada' },
        { status: 404 }
      );
    }

    const realSeasonId = seasonResult[0].id;

    // Obtener el ID real del usuario
    const userResult = await sql`
      SELECT id FROM users WHERE farcaster_id = ${userId};
    `;

    if (userResult.length === 0) {
      console.log('Usuario no encontrado:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const realUserId = userResult[0].id;

    // Actualizar los puntos en season_points
    const updateResult = await sql`
      UPDATE season_points 
      SET total_points = total_points + ${SHARE_BONUS_POINTS},
          last_updated = CURRENT_TIMESTAMP
      WHERE user_id = ${realUserId} 
      AND season_id = ${realSeasonId}
      RETURNING *;
    `;

    if (updateResult.length === 0) {
      // Si no existe el registro, crearlo
      const insertResult = await sql`
        INSERT INTO season_points (user_id, season_id, total_points)
        VALUES (${realUserId}, ${realSeasonId}, ${SHARE_BONUS_POINTS})
        RETURNING *;
      `;
      console.log('Nuevo registro de puntos por compartir:', insertResult);
      return NextResponse.json({ success: true, points: SHARE_BONUS_POINTS });
    }

    console.log('Puntos actualizados por compartir:', updateResult);
    return NextResponse.json({ success: true, points: SHARE_BONUS_POINTS });
  } catch (error) {
    console.error('Error al agregar bonus por compartir:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 