import { NextResponse } from 'next/server';
import sql from '../../../../lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verificar si el usuario tiene una vida extra para hoy
    const existingExtraLife = await sql`
      SELECT id FROM extra_lives
      WHERE user_id IN (
        SELECT id FROM users WHERE farcaster_id = ${userId}
      )
      AND DATE(created_at) = CURRENT_DATE;
    `;

    return NextResponse.json({
      hasExtraLife: existingExtraLife.length > 0
    });
  } catch (error) {
    console.error('Error al verificar vida extra:', error);
    return NextResponse.json(
      { error: 'Error al verificar vida extra' },
      { status: 500 }
    );
  }
} 