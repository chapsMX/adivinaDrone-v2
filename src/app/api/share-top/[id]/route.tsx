import { loadImage } from "@/lib/og-utils";
import { ImageResponse } from "next/og";
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const sql = neon(process.env.DATABASE_URL!);
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

// Force dynamic rendering
export const dynamic = "force-dynamic";

const size = {
  width: 1200,
  height: 800,
};

async function fetchUserProfile(fid: string) {
  try {
    console.log(`Fetching profile from Neynar for fid: ${fid}`);
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        'accept': 'application/json',
        'x-api-key': NEYNAR_API_KEY || ''
      }
    });
    
    const data = await response.json();
    console.log(`Neynar response for fid ${fid}:`, data);

    if (!data.users?.[0]) {
      console.log(`No user data found for fid ${fid}`);
      return null;
    }

    const user = data.users[0];
    console.log(`Profile data found for fid ${fid}:`, {
      username: user.username,
      pfp_url: user.pfp_url
    });

    return user;
  } catch (error) {
    console.error(`Error fetching profile for fid ${fid}:`, error);
    return null;
  }
}

async function getTopPlayers(seasonId: string) {
  try {
    if (!seasonId) {
      throw new Error('Season ID is required');
    }

    // Obtener el ID real de la temporada
    const seasonResult = await sql`
      SELECT id FROM seasons WHERE name = ${seasonId};
    `;

    if (seasonResult.length === 0) {
      throw new Error(`Season ${seasonId} not found`);
    }

    const realSeasonId = seasonResult[0].id;

    // Obtener top 3 jugadores
    const result = await sql`
      SELECT DISTINCT
        u.username,
        u.farcaster_id as fid,
        sp.total_points as score
      FROM season_points sp
      JOIN users u ON u.id = sp.user_id
      WHERE sp.season_id = ${realSeasonId}
        AND sp.total_points > 0
        AND u.username IS NOT NULL
      ORDER BY sp.total_points DESC
      LIMIT 3;
    `;

    console.log('Database result:', result);

    // Obtener los perfiles de usuario de Neynar
    const profiles = await Promise.all(
      result.map(async player => {
        console.log(`Fetching profile for fid: ${player.fid}`);
        const profile = await fetchUserProfile(player.fid);
        console.log(`Profile data for ${player.fid}:`, profile);
        return profile;
      })
    );

    return result.map((player, index) => {
      const profile = profiles[index];
      console.log(`Mapping data for player ${player.username}:`, {
        originalUsername: player.username,
        profileData: profile,
        finalUsername: player.username || profile?.username || 'Anónimo',
        pfpUrl: profile?.pfp_url
      });

      return {
        username: player.username || profile?.username || 'Anónimo',
        score: player.score,
        pfp_url: profile?.pfp_url || null
      };
    });
  } catch (error) {
    console.error('Error fetching top players:', error);
    throw error;
  }
}

/**
 * GET handler for generating dynamic OpenGraph images
 * @param request - The incoming HTTP request
 * @param params - Route parameters containing the ID
 * @returns ImageResponse - A dynamically generated image for OpenGraph
 */
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await params;
    console.log('Processing request for ID:', id);
    const parts = id.split('-');
    const timestamp = parts.pop(); // Remove timestamp
    const season = parts.shift(); // Remove and store season

    if (!season) {
      throw new Error('Season is required in the URL');
    }

    // Get top players from database
    const playerData = await getTopPlayers(season);
    if (!playerData.length) {
      throw new Error(`No players found for season ${season}`);
    }

    // Load assets
    const fontPath = path.join(process.cwd(), 'public/fonts/ProtoMono-Regular.otf');
    const fontData = fs.readFileSync(fontPath);
    const backgroundMap = await loadImage('https://adivinadrone.c13studio.mx/mapaTrans.png');
    const logoImage = await loadImage('https://adivinadrone.c13studio.mx/splashC.png');

    // No need to pre-load avatars, we'll use them directly in the img src
    console.log('Player data for image generation:', playerData);

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px",
            backgroundImage: `url(data:image/png;base64,${Buffer.from(backgroundMap).toString('base64')})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: "#2d283a",
          }}
        >
          {/* Title and Season */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            marginTop: "40px",
          }}>
            <div style={{
              fontSize: "72px",
              fontFamily: "ProtoMono",
              color: "#ffffff",
              textAlign: "center",
            }}>
              Top 3 Players
            </div>
            <div style={{
              fontSize: "64px",
              fontFamily: "ProtoMono",
              color: "#ff8800",
              textAlign: "center",
            }}>
              {season}
            </div>
          </div>

          {/* Players */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: "140px",
            marginTop: "20px",
          }}>
            {/* Second Place */}
            {playerData[1] && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}>
                <div style={{
                  width: "200px",
                  height: "200px",
                  borderRadius: "200px",
                  overflow: "hidden",
                  border: "4px solid #C0C0C0",
                  display: "flex",
                }}>
                  <img
                    src={playerData[1].pfp_url || 'https://adivinadrone.c13studio.mx/default-avatar.jpg'}
                    alt={playerData[1].username}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div style={{
                  fontSize: "36px",
                  fontFamily: "ProtoMono",
                  color: "#C0C0C0",
                  display: "flex",
                }}>
                  🥈
                </div>
                <div style={{
                  fontSize: "36px",
                  fontFamily: "ProtoMono",
                  color: "#ffffff",
                  textAlign: "center",
                  display: "flex",
                }}>
                  {playerData[1].username}
                </div>
                <div style={{
                  fontSize: "36px",
                  fontFamily: "ProtoMono",
                  color: "#C0C0C0",
                  display: "flex",
                }}>
                  {playerData[1].score.toLocaleString()}
                </div>
              </div>
            )}

            {/* First Place */}
            {playerData[0] && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                marginBottom: "40px",
              }}>
                <div style={{
                  width: "240px",
                  height: "240px",
                  borderRadius: "240px",
                  overflow: "hidden",
                  border: "4px solid #FFD700",
                  display: "flex",
                }}>
                  <img
                    src={playerData[0].pfp_url || 'https://adivinadrone.c13studio.mx/default-avatar.jpg'}
                    alt={playerData[0].username}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div style={{
                  fontSize: "48px",
                  fontFamily: "ProtoMono",
                  color: "#FFD700",
                  display: "flex",
                }}>
                  🥇
                </div>
                <div style={{
                  fontSize: "48px",
                  fontFamily: "ProtoMono",
                  color: "#ffffff",
                  textAlign: "center",
                  display: "flex",
                }}>
                  {playerData[0].username}
                </div>
                <div style={{
                  fontSize: "48px",
                  fontFamily: "ProtoMono",
                  color: "#FFD700",
                  display: "flex",
                }}>
                  {playerData[0].score.toLocaleString()}
                </div>
              </div>
            )}

            {/* Third Place */}
            {playerData[2] && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}>
                <div style={{
                  width: "200px",
                  height: "200px",
                  borderRadius: "200px",
                  overflow: "hidden",
                  border: "4px solid #CD7F32",
                  display: "flex",
                }}>
                  <img
                    src={playerData[2].pfp_url || 'https://adivinadrone.c13studio.mx/default-avatar.jpg'}
                    alt={playerData[2].username}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div style={{
                  fontSize: "36px",
                  fontFamily: "ProtoMono",
                  color: "#CD7F32",
                  display: "flex",
                }}>
                  🥉
                </div>
                <div style={{
                  fontSize: "36px",
                  fontFamily: "ProtoMono",
                  color: "#ffffff",
                  textAlign: "center",
                  display: "flex",
                }}>
                  {playerData[2].username}
                </div>
                <div style={{
                  fontSize: "36px",
                  fontFamily: "ProtoMono",
                  color: "#CD7F32",
                  display: "flex",
                }}>
                  {playerData[2].score.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Logo and Season */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            marginTop: "auto",
          }}>
            <div style={{
              width: "200px",
              height: "auto",
              display: "flex",
            }}>
              <img
                src={`data:image/png;base64,${Buffer.from(logoImage).toString('base64')}`}
                alt="Logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: "ProtoMono",
            data: fontData,
            weight: 400,
            style: "normal",
          },
        ],
      }
    );
  } catch (error: unknown) {
    console.error(`Failed to generate image:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(`Failed to generate image: ${errorMessage}`, {
      status: 500,
    });
  }
}