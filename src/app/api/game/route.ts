import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface Image {
  id: number;
  image_number: number;
  correct_answer: string;
  option_1: string;
  option_2: string;
  option_3: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const seasonId = searchParams.get('seasonId');
    const username = searchParams.get('username');
    const extraLife = searchParams.get('extraLife') === 'true';

    if (!userId || !seasonId || !username) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('Buscando imágenes para:', { userId, seasonId });

    // Verificar el límite diario de respuestas
    const dailyAnswers = await sql`
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count
      FROM user_responses
      WHERE user_id IN (
        SELECT id FROM users WHERE farcaster_id = ${userId}
      )
      AND DATE(created_at) = CURRENT_DATE;
    `;

    console.log('Respuestas hoy:', {
      total: dailyAnswers[0].total_count,
      correctas: dailyAnswers[0].correct_count
    });

    const totalResponses = parseInt(dailyAnswers[0].total_count) || 0;
    const correctResponses = parseInt(dailyAnswers[0].correct_count) || 0;

    if (!extraLife && totalResponses >= 3) {
      // Si todas las respuestas son correctas, no ofrecer vida extra
      if (correctResponses === 3) {
        return NextResponse.json({
          error: "Congratulations! You've completed today's challenge perfectly.<br />Come back tomorrow for new images!",
          dailyLimit: true,
          perfectScore: true
        }, { status: 403 });
      }
      
      return NextResponse.json({
        error: "Daily limit reached.<br />You can buy an extra life!",
        dailyLimit: true,
        perfectScore: false
      }, { status: 403 });
    }

    if (extraLife && totalResponses >= 4) {
      return NextResponse.json({
        error: "You've used all your attempts today, including extra life.<br />Come back tomorrow!",
        dailyLimit: true,
        extraLifeUsed: true
      }, { status: 403 });
    }

    // Primero, obtener el ID real de la temporada
    const seasonResult = await sql`
      SELECT id FROM seasons WHERE id = 2;
    `;

    if (seasonResult.length === 0) {
      console.log('No se encontró la temporada con ID 2');
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      );
    }

    const realSeasonId = seasonResult[0].id;
    console.log('ID real de la temporada:', realSeasonId);

    // Verificar si el usuario existe y crearlo si no existe
    const userResult = await sql`
      INSERT INTO users (farcaster_id, username)
      VALUES (${userId}, ${username})
      ON CONFLICT (farcaster_id) DO UPDATE 
      SET username = COALESCE(EXCLUDED.username, users.username)
      RETURNING id;
    `;

    const realUserId = userResult[0].id;
    console.log('ID real del usuario:', realUserId);

    // Verificar si hay imágenes en la temporada
    const totalImages = await sql`
      SELECT COUNT(*) as count
      FROM images
      WHERE season_id = ${realSeasonId};
    `;
    console.log('Total de imágenes en la temporada:', totalImages[0].count);

    if (totalImages[0].count === 0) {
      console.log('No hay imágenes en la temporada');
      return NextResponse.json(
        { error: 'No images available in this season' },
        { status: 404 }
      );
    }

    // Obtener imágenes aleatorias (3 para juego normal, 1 para vida extra)
    const limit = extraLife ? 1 : 3;
    const result = await sql`
      SELECT 
        i.id,
        i.image_number,
        i.correct_answer,
        i.option_1,
        i.option_2,
        i.option_3
      FROM images i
      WHERE i.season_id = ${realSeasonId}
      AND i.id NOT IN (
        SELECT image_id 
        FROM user_seen_images 
        WHERE user_id = ${realUserId}
        AND season_id = ${realSeasonId}
      )
      ORDER BY RANDOM()
      LIMIT ${limit};
    ` as unknown as Image[];

    console.log('Imágenes encontradas:', result.length);

    if (result.length === 0) {
      console.log('No se encontraron imágenes aleatorias');
      return NextResponse.json(
        { 
          error: 'No images available in this season',
          debug: {
            totalImages: totalImages[0].count,
            realSeasonId
          }
        },
        { status: 404 }
      );
    }

    // Formatear la respuesta con las rutas de las imágenes
    const formattedResult = result.map(row => ({
      ...row,
      image_path: `/images/seasons/2/adivinadrone_${String(row.image_number).padStart(3, '0')}.jpg`
    }));

    return NextResponse.json({ images: formattedResult });
  } catch (error) {
    console.error('Error detallado:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 