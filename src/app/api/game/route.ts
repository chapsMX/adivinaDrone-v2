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

    if (!userId || !seasonId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('Buscando imágenes para:', { userId, seasonId });

    // Primero, obtener el ID real de la temporada
    const seasonResult = await sql`
      SELECT id FROM seasons WHERE name = 'Season 00';
    `;

    if (seasonResult.length === 0) {
      console.log('No se encontró la temporada Season 00');
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      );
    }

    const realSeasonId = seasonResult[0].id;
    console.log('ID real de la temporada:', realSeasonId);

    // Verificar si el usuario existe y crearlo si no existe
    await sql`
      INSERT INTO users (id, farcaster_id)
      VALUES (${userId}, ${userId})
      ON CONFLICT (id) DO NOTHING;
    `;

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

    // Obtener 3 imágenes aleatorias
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
        WHERE user_id = ${userId} 
        AND season_id = ${realSeasonId}
      )
      ORDER BY RANDOM()
      LIMIT 3;
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
      image_path: `/images/seasons/0/adivinadrone_${String(row.image_number).padStart(3, '0')}.jpg`
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