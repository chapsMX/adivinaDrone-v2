export async function GET() {
    const appUrl = process.env.NEXT_PUBLIC_URL;
  
    const config = {
      accountAssociation:  {
        "header": "eyJmaWQiOjIwNzAxLCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4ZDQwNDg2MjIwNDMzOWJCNDJDNWMzNTVjMzcxMWViYzE2MTM1ZjllZSJ9",
        "payload": "eyJkb21haW4iOiJhZGl2aW5hZHJvbmUuYzEzc3R1ZGlvLm14In0",
        "signature": "MHgxYzMzMjc2OTdlZGJkOGY3YmU2Mzk1M2ExNDljZTg4ZGU2ODczMTdiNzgyNjk1MDdhN2VlNWRhN2JkYzI1YTg5NmUzMmU4OWUwYmI0M2M3ZTUwYzNmYTM1NWEyNTUxYTZlZWFiNmI1MWZmMGZlMzcyNWExMGNmYTI3ZjViMTgxNDFi"
      },    
      frame: {
        version: '1',
        name: 'adivinaDrone',
        // icono en frame
        iconUrl: `${appUrl}/favicon.png`,
        homeUrl: appUrl,
        // imagenLoader en cast 1200x800 px
        imageUrl: `${appUrl}/castLoader.png`,
        buttonTitle: '🎮 Play adivinaDrone 🎮',
        // imagen en splash
        splashImageUrl: `${appUrl}/splash_200.png`,
        splashBackgroundColor: '#2d283a',
        webhookUrl: `https://api.neynar.com/f/app/da4edccf-fe2a-451d-b7d2-aacef4f759c4/event`,
      },
    };
  
    return Response.json(config);
  }