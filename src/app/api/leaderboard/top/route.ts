import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

interface LeaderboardRow {
  farcaster_id: string;
  username: string;
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

async function fetchUserProfiles(usernames: string[]): Promise<NeynarUser[]> {
  try {
    // Si no hay usernames válidos, retornar array vacío
    if (!usernames.length || usernames.every(username => !username)) {
      console.log('No valid usernames to fetch');
      return [];
    }

    // Filtrar usernames nulos
    const validUsernames = usernames.filter(username => username !== null);
    if (!validUsernames.length) {
      console.log('No valid usernames after filtering');
      return [];
    }

    console.log('Fetching profiles for usernames:', validUsernames);

    // Hacer las peticiones en paralelo para cada username
    const userPromises = validUsernames.map(username => 
      fetch(
        `https://api.neynar.com/v2/farcaster/user/by_username/?username=${username}`,
        {
          headers: {
            'accept': 'application/json',
            'x-api-key': NEYNAR_API_KEY || '',
            'x-neynar-experimental': 'false'
          }
        }
      ).then(res => res.json())
    );

    const responses = await Promise.all(userPromises);
    const users = responses.map(response => response.user).filter(user => user);
    
    console.log('Neynar API responses:', users);
    return users;
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

    // Obtener top 25 jugadores con sus datos completos
    const result = await sql`
      SELECT DISTINCT
        u.username,
        sp.total_points as score
      FROM season_points sp
      JOIN users u ON u.id = sp.user_id
      WHERE sp.season_id = ${realSeasonId}
        AND sp.total_points > 0
        AND u.username IS NOT NULL
      ORDER BY sp.total_points DESC
      LIMIT 25;
    `;

    console.log('Database result:', result);

    // Obtener los perfiles de usuario de Neynar
    const usernames = (result as LeaderboardRow[]).map(row => row.username);
    const userProfiles = await fetchUserProfiles(usernames);

    console.log('User profiles from Neynar:', userProfiles);

    // Combinar los resultados
    const combinedResults = (result as LeaderboardRow[]).map((row): CombinedResult => {
      const userProfile = userProfiles.find(
        profile => profile.username === row.username
      );
      
      console.log('Matching profile for username:', row.username, userProfile);
      
      return {
        username: userProfile?.username || row.username || 'Anónimo',
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