import { NextResponse } from 'next/server';
import sql from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const { userId, seasonId } = await request.json();

    if (!userId || !seasonId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Marcar la vida extra como usada
    const updateResult = await sql`
      WITH current_reset AS (
        SELECT 
          CASE 
            WHEN CURRENT_TIME >= TIME '18:00' THEN CURRENT_DATE
            ELSE CURRENT_DATE - INTERVAL '1 day'
          END as last_reset
      )
      UPDATE extra_lives
      SET is_used = true
      WHERE user_id IN (
        SELECT id FROM users WHERE farcaster_id = ${userId}
      )
      AND season_id = (
        SELECT id FROM seasons WHERE name = ${seasonId}
      )
      AND created_at > (
        SELECT last_reset + TIME '18:00' FROM current_reset
      )
      AND created_at <= (
        SELECT last_reset + INTERVAL '1 day' + TIME '18:00' FROM current_reset
      )
      AND is_used = false
      RETURNING id;
    `;

    if (updateResult.length === 0) {
      return NextResponse.json(
        { error: 'No unused extra life found for today' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking extra life as used:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 