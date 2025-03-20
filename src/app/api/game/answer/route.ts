import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, imageId, seasonId, answer } = body;

    if (!userId || !imageId || !seasonId || !answer) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    console.log('Procesando respuesta:', { userId, imageId, seasonId, answer });

    // Obtener el ID real de la temporada
    const seasonResult = await sql`
      SELECT id FROM seasons WHERE name = 'Season 00';
    `;

    if (seasonResult.length === 0) {
      return NextResponse.json(
        { error: 'Temporada no encontrada' },
        { status: 404 }
      );
    }

    const realSeasonId = seasonResult[0].id;

    // Verificar si el usuario existe y crearlo si no existe
    const userResult = await sql`
      INSERT INTO users (farcaster_id)
      VALUES (${userId})
      ON CONFLICT (farcaster_id) DO UPDATE
      SET farcaster_id = EXCLUDED.farcaster_id
      RETURNING id;
    `;

    const realUserId = userResult[0].id;
    console.log('ID real del usuario:', realUserId);

    // Obtener la respuesta correcta
    const imageResult = await sql`
      SELECT correct_answer
      FROM images
      WHERE id = ${imageId}
      AND season_id = ${realSeasonId};
    `;

    if (imageResult.length === 0) {
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      );
    }

    const isCorrect = imageResult[0].correct_answer === answer;
    console.log('Resultado:', { isCorrect, correctAnswer: imageResult[0].correct_answer });

    // Marcar la imagen como vista solo cuando el usuario responde
    await sql`
      INSERT INTO user_seen_images (user_id, image_id, season_id)
      VALUES (${realUserId}, ${imageId}, ${realSeasonId})
      ON CONFLICT (user_id, image_id) DO NOTHING;
    `;

    return NextResponse.json({
      isCorrect,
      correctAnswer: imageResult[0].correct_answer,
      userAnswer: answer
    });
  } catch (error) {
    console.error('Error procesando respuesta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 