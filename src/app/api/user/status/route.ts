import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');

    console.log('Status check requested for:', { userId, username });

    if (!userId || !username) {
      console.log('Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Primero limpiamos cualquier registro existente con ese farcaster_id
    await sql`
      UPDATE users 
      SET farcaster_id = NULL
      WHERE farcaster_id = ${userId};
    `;

    // Ahora actualizamos el usuario correcto
    const result = await sql`
      UPDATE users 
      SET farcaster_id = ${userId}
      WHERE username = ${username}
      RETURNING *;
    `;

    console.log('Database query result:', result);

    // Siempre retornar acceso permitido ya que la temporada está abierta para todos
    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 