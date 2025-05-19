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
        continue;
      }
      
      const data = await response.json() as NeynarResponse;
      allProfiles.push(...data.users);
      
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
    // Get winners with rank using window function
    const winners = await sql`
      WITH ranked_winners AS (
        SELECT 
          u.id as user_id,
          u.farcaster_id,
          u.username,
          SUM(ur.points_earned) as total_points,
          ROW_NUMBER() OVER (ORDER BY SUM(ur.points_earned) DESC) as rank
        FROM users u
        JOIN user_responses ur ON ur.user_id = u.id
        WHERE ur.id BETWEEN 1824 AND 8336
        GROUP BY u.id, u.farcaster_id, u.username
        HAVING SUM(ur.points_earned) > 0
      )
      SELECT *,
        (SELECT COUNT(*) FROM ranked_winners) as total_players
      FROM ranked_winners
      ORDER BY rank ASC;
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
        rank: winner.rank,
        fid: winner.farcaster_id,
        pfp_url: profile?.pfp_url || null,
        total_players: winner.total_players,
        percentile: Math.round(((winner.total_players - winner.rank) / winner.total_players) * 100)
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching ranked winners:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 