import { NextResponse } from 'next/server';
import sql from '../../../lib/db';

export async function POST(request: Request) {
  try {
    const { userId, transactionHash } = await request.json();

    if (!userId || !transactionHash) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya tiene una vida extra para hoy
    const existingExtraLife = await sql`
      SELECT id FROM extra_lives
      WHERE user_id IN (
        SELECT id FROM users WHERE farcaster_id = ${userId}
      )
      AND DATE(created_at) = CURRENT_DATE;
    `;

    if (existingExtraLife.length > 0) {
      return NextResponse.json(
        { error: 'Ya tienes una vida extra para hoy' },
        { status: 400 }
      );
    }

    // Obtener el ID real del usuario
    const userResult = await sql`
      SELECT id FROM users WHERE farcaster_id = ${userId}
    `;

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const realUserId = userResult[0].id;

    // Obtener el ID de la temporada actual
    const seasonResult = await sql`
      SELECT id FROM seasons WHERE id = 2;
    `;

    if (seasonResult.length === 0) {
      return NextResponse.json(
        { error: 'Temporada no encontrada' },
        { status: 404 }
      );
    }

    const seasonId = seasonResult[0].id;

    // Registrar la vida extra
    await sql`
      INSERT INTO extra_lives (user_id, season_id, transaction_hash)
      VALUES (${realUserId}, ${seasonId}, ${transactionHash})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al procesar la compra de vida extra:', error);
    return NextResponse.json(
      { error: 'Error al procesar la compra' },
      { status: 500 }
    );
  }
} 