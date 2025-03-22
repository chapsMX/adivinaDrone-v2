import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

async function fetchUserProfiles(fids: string[]) {
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids.join(',')}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY || '',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Error fetching user profiles');
    }
    
    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    return [];
  }
}

export async function GET() {
  try {
    // Obtener el ID real de la temporada
    const seasonResult = await sql`
      SELECT id FROM seasons WHERE name = 'Season 00';
    `;

    if (seasonResult.length === 0) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    }

    const realSeasonId = seasonResult[0].id;

    // Obtener top 10 jugadores directamente de season_points
    const result = await sql`
      SELECT DISTINCT
        sp.user_id,
        sp.total_points as score
      FROM season_points sp
      WHERE sp.season_id = ${realSeasonId}
      ORDER BY sp.total_points DESC
      LIMIT 10;
    `;

    // Obtener los perfiles de usuario de Neynar
    const fids = result.map((row: any) => row.user_id);
    const userProfiles = await fetchUserProfiles(fids);

    // Combinar los resultados
    const combinedResults = result.map((row: any) => {
      const userProfile = userProfiles.find((profile: any) => profile.fid === row.user_id);
      return {
        username: userProfile?.username || 'Anónimo',
        score: row.score,
        pfp_url: userProfile?.pfp_url || null
      };
    });

    return NextResponse.json(combinedResults);
  } catch (error) {
    console.error('Error fetching top players:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 