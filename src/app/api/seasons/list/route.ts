import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const seasons = await sql`
      SELECT 
        id,
        name,
        start_date,
        end_date,
        CASE 
          WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN true
          ELSE false
        END as is_current
      FROM seasons
      ORDER BY 
        CASE 
          WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 0
          ELSE 1
        END,
        start_date DESC;
    `;

    return NextResponse.json(seasons);
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 