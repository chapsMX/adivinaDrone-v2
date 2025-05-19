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
        iconUrl: `${appUrl}/favicon.png`,
        homeUrl: appUrl,
        imageUrl: `${appUrl}/castLoader.png`,
        buttonTitle: '🎮 📸 Play adivinaDrone 📸 🎮',
        splashImageUrl: `${appUrl}/splash_200.png`,
        splashBackgroundColor: '#2d283a',
        webhookUrl: `https://api.neynar.com/f/app/da4edccf-fe2a-451d-b7d2-aacef4f759c4/event`,
        // nueva metadata para coinbase wallet
        subtitle: `Can you guess the location?`,
      description: `A 30 day challenge where players guess real world locations from drone photos.`,
      primaryCategory: `games`,
      tags: [`games`, `photography`, `drone`, `aerial`, `challenges`],
      heroImageUrl: `${appUrl}/hero.png`,
      tagline: `Can you guess the location?`,   
      ogTitle: `AdivinaDrone`,
      ogDescription: "A 30 day challenge where players guess real world locations from drone photos.",
      ogImageUrl: `${appUrl}/hero.png`,
      screenshotUrls: [`${appUrl}/ss_01.jpg`, `${appUrl}/ss_02.jpg`, `${appUrl}/ss_03.jpg`],
      noindex: true,
      requiredChains: ['eip155:8453'],
      },
    };
  
    return Response.json(config);
  }