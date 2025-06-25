import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

interface LeaderboardRow {
  username: string;
  score: number;
}

interface NeynarUser {
  username: string;
  display_name: string;
  pfp_url: string;
}

interface NeynarResponse {
  user: {
    username: string;
    display_name: string;
    pfp_url: string;
  };
}

interface NeynarSearchUser {
  fid: number;
  username: string;
}

interface NeynarSearchResponse {
  users: NeynarSearchUser[];
}

interface CombinedResult {
  username: string;
  score: number;
  pfp_url: string | null;
}

async function fetchUserProfiles(usernames: string[]): Promise<NeynarUser[]> {
  try {
    console.log('Starting to fetch profiles for usernames:', usernames);
    
    // Buscar cada usuario individualmente usando el endpoint correcto
    const profiles = await Promise.all(
      usernames.map(async (username) => {
        try {
          const url = `https://api.neynar.com/v2/farcaster/user/by_username/?username=${encodeURIComponent(username)}`;
          console.log('Fetching from URL:', url);
          
          const response = await fetch(url, {
            headers: {
              'accept': 'application/json',
              'api_key': NEYNAR_API_KEY || '',
            }
          });
          
          if (!response.ok) {
            console.error(`Error fetching profile for ${username}:`, response.status);
            return null;
          }
          
          const data = await response.json();
          console.log('Raw Neynar response for', username, ':', JSON.stringify(data));
          
          if (data.user && data.user.pfp_url) {
            const profile = {
              username: data.user.username,
              display_name: data.user.display_name,
              pfp_url: data.user.pfp_url
            };
            console.log('Extracted profile:', profile);
            return profile;
          }
          console.log('No valid profile found for', username);
          return null;
        } catch (error) {
          console.error(`Error fetching profile for ${username}:`, error);
          return null;
        }
      })
    );

    const validProfiles = profiles.filter((profile): profile is NeynarUser => profile !== null);
    console.log('All valid profiles:', JSON.stringify(validProfiles));
    return validProfiles;
  } catch (error) {
    console.error('Error in fetchUserProfiles:', error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    console.log('Fetching leaderboard for season:', seasonId);

    // Si no se proporciona seasonId, usar la temporada actual
    let season;
    if (seasonId) {
      season = await sql`
        SELECT id FROM seasons WHERE name = ${seasonId};
      `;
    } else {
      season = await sql`
        SELECT id FROM seasons 
        WHERE CURRENT_DATE BETWEEN start_date AND end_date
        AND is_active = true
        ORDER BY start_date DESC
        LIMIT 1;
      `;
    }

    if (!season || season.length === 0) {
      console.log('No se encontró la temporada');
      return NextResponse.json([]);
    }

    const realSeasonId = season[0].id;
    console.log('Using season ID:', realSeasonId);

    // Obtener top 25 jugadores con sus usernames
    const result = await sql`
      SELECT DISTINCT
        u.username,
        sp.total_points as score
      FROM season_points sp
      JOIN users u ON u.id = sp.user_id
      WHERE sp.season_id = ${realSeasonId}
      ORDER BY sp.total_points DESC
      LIMIT 25;
    `;

    console.log('Database result:', JSON.stringify(result));

    // Obtener los perfiles de usuario de Neynar
    const usernames = (result as LeaderboardRow[]).map(row => row.username).filter(Boolean);
    console.log('Usernames to fetch:', usernames);
    
    const userProfiles = await fetchUserProfiles(usernames);
    console.log('Fetched user profiles:', JSON.stringify(userProfiles));

    // Combinar los resultados
    const combinedResults = (result as LeaderboardRow[]).map((row): CombinedResult => {
      const userProfile = userProfiles.find(
        profile => profile.username === row.username
      );
      
      console.log('Matching profile for', row.username, ':', JSON.stringify(userProfile));
      
      const combined = {
        username: row.username || 'Anónimo',
        score: row.score,
        pfp_url: userProfile?.pfp_url || 'https://adivinadrone.c13studio.mx/default-avatar.jpg'
      };
      console.log('Combined result:', JSON.stringify(combined));
      return combined;
    });

    console.log('Final results:', JSON.stringify(combinedResults));
    return NextResponse.json(combinedResults);
  } catch (error) {
    console.error('Error in GET:', error);
    return NextResponse.json([]);
  }
} 