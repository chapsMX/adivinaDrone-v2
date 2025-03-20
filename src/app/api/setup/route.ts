import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    // 1. Verificar si existe la temporada
    const seasonResult = await sql`
      SELECT id FROM seasons WHERE name = 'Season 00';
    `;

    let seasonId;
    if (seasonResult.length === 0) {
      // Crear la temporada si no existe
      const newSeason = await sql`
        INSERT INTO seasons (name, start_date, end_date, is_active)
        VALUES ('Season 00', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', true)
        RETURNING id;
      `;
      seasonId = newSeason[0].id;
    } else {
      seasonId = seasonResult[0].id;
    }

    // 2. Verificar si hay imágenes
    const imageCount = await sql`
      SELECT COUNT(*) as count FROM images WHERE season_id = ${seasonId};
    `;

    if (imageCount[0].count === 0) {
      // Insertar las imágenes
      await sql`
        INSERT INTO images (season_id, image_number, correct_answer, option_1, option_2, option_3)
        VALUES 
          (${seasonId}, 1, 'CDMX, MX', 'Florencia, IT', 'Mendoza, AR', 'Tuxtla'),    
          (${seasonId}, 2, 'CDMX, MX', 'Madrid, ES', 'Turin, IT', 'Tuxtla Gutierrez'),
          (${seasonId}, 3, 'Veracrúz, MX', 'Los Cabos', 'Florencia, IT', 'Navojoa'),
          (${seasonId}, 4, 'Buenos Aires, AR', 'Puerto Vallarta', 'Madrid, ES', 'Zapotitlan'),
          (${seasonId}, 5, 'Buenos Aires, AR', 'Zapotitlan', 'Florencia, IT', 'Guasave');
      `;
    }

    return NextResponse.json({
      success: true,
      seasonId,
      imageCount: imageCount[0].count
    });
  } catch (error) {
    console.error('Error en setup:', error);
    return NextResponse.json(
      { error: 'Error al configurar la base de datos' },
      { status: 500 }
    );
  }
} 