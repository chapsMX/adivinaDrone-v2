import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('Status check requested for user:', userId);

    if (!userId) {
      console.log('No userId provided');
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT early_access_requested, is_whitelisted
      FROM users
      WHERE farcaster_id = ${userId};
    `;

    console.log('Database query result:', result);

    if (result.length === 0) {
      console.log('No user found, returning default values');
      return NextResponse.json({
        early_access_requested: false,
        is_whitelisted: false
      });
    }

    console.log('Returning user status:', result[0]);
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 