import { loadImage } from "@/lib/og-utils";
import { ImageResponse } from "next/og";
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const sql = neon(process.env.DATABASE_URL!);

// Force dynamic rendering
export const dynamic = "force-dynamic";

const size = {
  width: 1200,
  height: 800,
};

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
    const [score, fid] = id.split('-');
    
    // Get user data and total players count for percentile
    const [userResult, totalPlayersResult] = await Promise.all([
      sql`
        SELECT username
        FROM users
        WHERE farcaster_id = ${fid}
      `,
      sql`
        WITH user_scores AS (
          SELECT user_id, SUM(points_earned) as total_points,
                 RANK() OVER (ORDER BY SUM(points_earned) DESC) as rank_position
          FROM user_responses
          GROUP BY user_id
        )
        SELECT 
          COUNT(DISTINCT user_id) as total,
          COUNT(DISTINCT CASE WHEN total_points <= ${score}::int THEN user_id END) as below,
          MIN(CASE WHEN total_points = ${score}::int THEN rank_position END) as user_rank
        FROM user_scores
      `
    ]);

    if (!userResult.length) {
      throw new Error('User not found');
    }

    const user = userResult[0];
    const { total, below, user_rank } = totalPlayersResult[0];
    const percentile = Math.round(((total - user_rank) / total) * 100);
    
    const rank = user_rank === 1 ? '🥇' : 
                user_rank === 2 ? '🥈' : 
                user_rank === 3 ? '🥉' : '';

    // Get profile picture from Neynar
    const neynarResponse = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        'x-api-key': process.env.NEYNAR_API_KEY || ''
      }
    });
    
    if (!neynarResponse.ok) {
      console.error('Failed to fetch from Neynar:', await neynarResponse.text());
      throw new Error(`Neynar API error: ${neynarResponse.statusText}`);
    }

    const neynarData = await neynarResponse.json();
    
    if (!neynarData.users?.[0]) {
      console.error('No user data returned from Neynar');
      throw new Error('User not found in Neynar');
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://adivinadrone.c13studio.mx';
    const defaultAvatarUrl = `${baseUrl}/default-avatar.jpg`;
    const pfpUrl = neynarData.users[0].pfp_url || defaultAvatarUrl;

    // Load assets
    const fontPath = path.join(process.cwd(), 'src/styles/fonts/ProtoMono-Regular.otf');
    const fontData = fs.readFileSync(fontPath);
    const profileImage = await loadImage(pfpUrl);
    const logoImage = await loadImage(`${baseUrl}/splashC.png`);
    const backgroundMap = await loadImage(`${baseUrl}/mapaTrans.png`);

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
            padding: "40px",
            backgroundImage: `url(data:image/png;base64,${Buffer.from(backgroundMap).toString('base64')})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: "#2d283a",
          }}
        >
          {/* Profile Picture */}
          <div style={{
            width: "400px",
            height: "400px",
            borderRadius: "100px",
            border: "4px solid #ff8800",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "10px",
          }}>
            <img
              src={`data:image/png;base64,${Buffer.from(profileImage).toString('base64')}`}
              alt="Profile"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          {/* Username */}
          <div style={{
            color: "white",
            fontSize: "64px",
            fontFamily: "ProtoMono",
            fontWeight: "400",
            textAlign: "center",
            marginBottom: "10px",
            letterSpacing: "-0.02em",
          }}>
            {user.username}
          </div>

          {/* Score */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            marginBottom: "10px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}>
              <span style={{
                color: "#ff8800",
                fontSize: "48px",
                fontFamily: "ProtoMono",
                fontWeight: "400",
                letterSpacing: "-0.02em",
              }}>
                season score:
              </span>
              <span style={{
                color: "white",
                fontSize: "48px",
                fontFamily: "ProtoMono",
                fontWeight: "400",
                letterSpacing: "-0.02em",
              }}>
                {score} {rank}
              </span>
            </div>
          </div>

          {/* Top Percentage */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            marginBottom: "10px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}>
              <span style={{
                color: "#ff8800",
                fontSize: "48px",
                fontFamily: "ProtoMono",
                fontWeight: "400",
                letterSpacing: "-0.02em",
              }}>
                top:
              </span>
              <span style={{
                color: "white",
                fontSize: "48px",
                fontFamily: "ProtoMono",
                fontWeight: "400",
                letterSpacing: "-0.02em",
              }}>
                {percentile}%
              </span>
            </div>
          </div>

          {/* Logo */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "auto",
          }}>
            <img
              src={`data:image/png;base64,${Buffer.from(logoImage).toString('base64')}`}
              alt="Logo"
              style={{
                width: "200px",
                height: "auto",
                marginBottom: "10px",
              }}
            />
          </div>

          {/* Season Text */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            color: "#ff8800",
            fontSize: "24px",
            fontFamily: "ProtoMono",
            fontWeight: "400",
            textAlign: "center",
            marginTop: "10px",
          }}>
            <div>adivinaDrone</div>
            <div style={{
              width: "300px",
              height: "2px",
              backgroundColor: "#ffffff"
            }}/>
            <div>Season 07</div>
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
  } catch (e) {
    console.log(`Failed to generate image`, e);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}