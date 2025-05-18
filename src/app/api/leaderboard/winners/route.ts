import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

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

async function fetchUserProfiles(fids: string[]): Promise<NeynarUser[]> {
  try {
    const BATCH_SIZE = 100;
    const allProfiles: NeynarUser[] = [];
    
    // Procesar los fids en lotes de 100
    for (let i = 0; i < fids.length; i += BATCH_SIZE) {
      const batch = fids.slice(i, i + BATCH_SIZE);
      const response = await fetch(
        `https://api.neynar.com/v2/farcaster/user/bulk?fids=${batch.join(',')}`,
        {
          headers: {
            'accept': 'application/json',
            'api_key': NEYNAR_API_KEY || '',
          }
        }
      );
      
      if (!response.ok) {
        console.error('Neynar API error:', response.status, response.statusText);
        continue; // Continuar con el siguiente lote en lugar de fallar completamente
      }
      
      const data = await response.json() as NeynarResponse;
      allProfiles.push(...data.users);
      
      // Esperar un poco entre llamadas para no sobrecargar la API
      if (i + BATCH_SIZE < fids.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return allProfiles;
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    return [];
  }
}

export async function GET() {
  try {
    // Get winners using the working query
    const winners = await sql`
      SELECT 
        u.id as user_id,
        u.farcaster_id,
        u.username,
        SUM(ur.points_earned) as total_points
      FROM users u
      JOIN user_responses ur ON ur.user_id = u.id
      WHERE ur.id BETWEEN 1824 AND 8336
      GROUP BY u.id, u.farcaster_id, u.username
      HAVING SUM(ur.points_earned) > 0
      ORDER BY total_points DESC;
    `;

    if (!winners.length) {
      return NextResponse.json([]);
    }

    // Get Neynar profiles for additional info
    const fids = winners.map(w => w.farcaster_id);
    const userProfiles = await fetchUserProfiles(fids);

    const results = winners.map(winner => {
      const profile = userProfiles.find(p => String(p.fid) === winner.farcaster_id);
      return {
        username: profile?.display_name || profile?.username || winner.username || 'Anónimo',
        score: winner.total_points,
        pfp_url: profile?.pfp_url || null
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching winners:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 