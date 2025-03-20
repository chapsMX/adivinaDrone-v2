import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Verificar que tenemos la URL de la base de datos
console.log('DATABASE_URL configurada:', !!process.env.DATABASE_URL);

const sql = neon(process.env.DATABASE_URL!);

interface Season {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Image {
  id: number;
  season_id: number;
  image_number: number;
  correct_answer: string;
  option_1: string;
  option_2: string;
  option_3: string;
}

export async function GET() {
  try {
    // Verificar si existe la temporada
    const seasonResult = await sql`
      SELECT id, name FROM seasons WHERE name = 'Season 00';
    `;
    console.log('Temporada:', seasonResult);

    // Verificar imágenes en la temporada
    const imagesResult = await sql`
      SELECT COUNT(*) as count, MIN(image_number) as min_number, MAX(image_number) as max_number
      FROM images
      WHERE season_id = ${seasonResult[0]?.id || 0};
    `;
    console.log('Imágenes:', imagesResult);

    // Verificar usuarios
    const usersResult = await sql`
      SELECT COUNT(*) as count FROM users;
    `;
    console.log('Usuarios:', usersResult);

    // Verificar imágenes vistas
    const seenImagesResult = await sql`
      SELECT COUNT(*) as count FROM user_seen_images;
    `;
    console.log('Imágenes vistas:', seenImagesResult);

    return NextResponse.json({
      season: seasonResult,
      images: imagesResult,
      users: usersResult,
      seenImages: seenImagesResult
    });
  } catch (error) {
    console.error('Error en test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 