import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, username } = body;

    console.log('Early access request received:', { userId, username });

    if (!userId) {
      console.log('No userId provided');
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Verificar si la temporada está en early access
    const seasonResult = await sql`
      SELECT is_early_access
      FROM seasons
      WHERE name = 'Season 00';
    `;

    console.log('Season check result:', seasonResult);

    if (seasonResult.length === 0 || !seasonResult[0].is_early_access) {
      console.log('Early access not available');
      return NextResponse.json(
        { error: 'Early access is not available' },
        { status: 403 }
      );
    }

    // Actualizar o insertar el usuario
    const updateResult = await sql`
      INSERT INTO users (farcaster_id, username, early_access_requested)
      VALUES (${userId}, ${username}, true)
      ON CONFLICT (farcaster_id) 
      DO UPDATE SET 
        early_access_requested = true,
        username = COALESCE(EXCLUDED.username, users.username)
      RETURNING *;
    `;

    console.log('User update result:', updateResult);

    return NextResponse.json({ 
      success: true,
      user: updateResult[0]
    });
  } catch (error) {
    console.error('Error requesting early access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 