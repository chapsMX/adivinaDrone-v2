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
    console.log('Processing request for ID:', id);
    const [gamesPlayed, score, avgResponse] = id.split('-');
    console.log('Parsed stats:', { gamesPlayed, score, avgResponse });

    // Load assets
    const fontPath = path.join(process.cwd(), 'public/fonts/ProtoMono-Regular.otf');
    const fontData = fs.readFileSync(fontPath);
    const backgroundMap = await loadImage('https://adivinadrone.c13studio.mx/mapaTrans.png');
    const logoImage = await loadImage('https://adivinadrone.c13studio.mx/splashC.png');

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
          {/* Stats */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            marginTop: "210px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}>
              <span style={{
                color: "#ff8800",
                fontSize: "60px",
                fontFamily: "ProtoMono",
                fontWeight: "400",
                letterSpacing: "-0.02em",
              }}>
                Games played:
              </span>
              <span style={{
                color: "white",
                fontSize: "56px",
                fontFamily: "ProtoMono",
                fontWeight: "400",
                letterSpacing: "-0.02em",
              }}>
                {gamesPlayed}
              </span>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}>
              <span style={{
                color: "#ff8800",
                fontSize: "56px",
                fontFamily: "ProtoMono",
                fontWeight: "400",
                letterSpacing: "-0.02em",
              }}>
                Global score:
              </span>
              <span style={{
                color: "white",
                fontSize: "56px",
                fontFamily: "ProtoMono",
                fontWeight: "400",
                letterSpacing: "-0.02em",
              }}>
                {parseInt(score).toLocaleString('en-US')}
              </span>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}>
              <span style={{
                color: "#ff8800",
                fontSize: "56px",
                fontFamily: "ProtoMono",
                fontWeight: "400",
                letterSpacing: "-0.02em",
              }}>
                Avg response time:
              </span>
              <span style={{
                color: "white",
                fontSize: "56px",
                fontFamily: "ProtoMono",
                fontWeight: "400",
                letterSpacing: "-0.02em",
              }}>
                {avgResponse}s
              </span>
            </div>
          </div>

          {/* Logo and Season */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            marginTop: "auto",
          }}>
            <img
              src={`data:image/png;base64,${Buffer.from(logoImage).toString('base64')}`}
              alt="Logo"
              style={{
                width: "200px",
                height: "auto",
              }}
            />
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              color: "#ff8800",
              fontSize: "52px",
              fontFamily: "ProtoMono",
              fontWeight: "400",
              textAlign: "center",
            }}>
              <div>adivinaDrone</div>
              <div style={{
                width: "400px",
                height: "2px",
                backgroundColor: "#ffffff"
              }}/>
              <div>Season 08</div>
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