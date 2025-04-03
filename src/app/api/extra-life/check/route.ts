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

    // Verificar si el usuario tiene una vida extra válida
    const existingExtraLife = await sql`
      WITH current_reset AS (
        SELECT 
          CASE 
            WHEN CURRENT_TIME >= TIME '18:00' THEN CURRENT_DATE
            ELSE CURRENT_DATE - INTERVAL '1 day'
          END as last_reset
      )
      SELECT el.id, el.is_used 
      FROM extra_lives el, current_reset
      WHERE el.user_id IN (
        SELECT id FROM users WHERE farcaster_id = ${userId}
      )
      AND el.season_id = (
        SELECT id FROM seasons WHERE name = 'Season 07'
      )
      AND el.created_at > (
        SELECT last_reset + TIME '18:00' FROM current_reset
      )
      AND el.created_at <= (
        SELECT last_reset + INTERVAL '1 day' + TIME '18:00' FROM current_reset
      );
    `;

    return NextResponse.json({
      hasExtraLife: existingExtraLife.length > 0,
      isUsed: existingExtraLife.length > 0 ? existingExtraLife[0].is_used : false
    });
  } catch (error) {
    console.error('Error al verificar vida extra:', error);
    return NextResponse.json(
      { error: 'Error al verificar vida extra' },
      { status: 500 }
    );
  }
} 