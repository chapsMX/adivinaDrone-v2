import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

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

    // Obtener el ID de la temporada
    const seasonResult = await sql`
      SELECT id FROM seasons WHERE name = 'Season 07';
    `;

    if (seasonResult.length === 0) {
      console.log('No se encontró la temporada Season 07');
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

    // Registrar el share en la base de datos
    const shareResult = await sql`
      INSERT INTO shares (user_id, season_id)
      VALUES (${realUserId}, ${realSeasonId})
      RETURNING *;
    `;

    console.log('Share registrado:', shareResult);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al registrar share:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 