import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const result = await sql`SELECT * FROM seasons ORDER BY id;`;
    console.log('Todas las temporadas:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error obteniendo temporadas:', error);
    return NextResponse.json(
      { error: 'Error al obtener temporadas' },
      { status: 500 }
    );
  }
} 