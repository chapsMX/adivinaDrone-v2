import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Por ahora, retornamos un score global fijo de 0
    // En el futuro, esto debería consultar una base de datos
    return NextResponse.json({ globalScore: 0 });
  } catch (error) {
    console.error('Error fetching user score:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 