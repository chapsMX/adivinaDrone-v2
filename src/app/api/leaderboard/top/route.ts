import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

interface LeaderboardRow {
  farcaster_id: string;
  score: number;
}

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

interface NeynarResponse {
  users: NeynarUser[];
  next: {
    cursor: string | null;
  };
}

interface CombinedResult {
  username: string;
  score: number;
  pfp_url: string | null;
}

async function fetchUserProfiles(fids: string[]): Promise<NeynarUser[]> {
  try {
    console.log('Fetching profiles for FIDs:', fids);
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
      console.error('Neynar API error:', response.status, response.statusText);
      throw new Error('Error fetching user profiles');
    }
    
    const data = await response.json() as NeynarResponse;
    console.log('Neynar API response:', data);

    return data.users;
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId') || 'Season 01';

    // Obtener el ID real de la temporada
    const seasonResult = await sql`
      SELECT id FROM seasons WHERE name = ${seasonId};
    `;

    if (seasonResult.length === 0) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    }

    const realSeasonId = seasonResult[0].id;

    // Obtener top 10 jugadores directamente de season_points
    const result = await sql`
      SELECT DISTINCT
        u.farcaster_id,
        sp.total_points as score
      FROM season_points sp
      JOIN users u ON u.id = sp.user_id
      WHERE sp.season_id = ${realSeasonId}
      ORDER BY sp.total_points DESC
      LIMIT 5;
    `;

    console.log('Database result:', result);

    // Obtener los perfiles de usuario de Neynar
    const fids = (result as LeaderboardRow[]).map(row => row.farcaster_id);
    const userProfiles = await fetchUserProfiles(fids);

    console.log('User profiles from Neynar:', userProfiles);

    // Combinar los resultados
    const combinedResults = (result as LeaderboardRow[]).map((row): CombinedResult => {
      const userProfile = userProfiles.find(
        profile => String(profile.fid) === row.farcaster_id
      );
      
      console.log('Matching profile for farcaster_id:', row.farcaster_id, userProfile);
      
      return {
        username: userProfile?.display_name || userProfile?.username || 'Anónimo',
        score: row.score,
        pfp_url: userProfile?.pfp_url || null
      };
    });

    console.log('Final combined results:', combinedResults);
    return NextResponse.json(combinedResults);
  } catch (error) {
    console.error('Error fetching top players:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 