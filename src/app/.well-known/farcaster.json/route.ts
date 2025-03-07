export async function GET() {
    const appUrl = process.env.NEXT_PUBLIC_URL;
  
    const config = {
      accountAssociation: {
        header:
          'eyJmaWQiOjE1OTgzLCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4NEFlNDlGMGFBNzYyRWZlYmVCZmY0YmFDNGVBMDg0N0ViNkFmNGVjOSJ9',
        payload: 'eyJkb21haW4iOiJhcHAuZGVnZW4udGlwcyJ9',
        signature:
          'MHg2ZDM2MzAzODAzYmRhZjQ5ZjY5YjQ2YmI2ZTU1ZTRlZmM4NzM5NTQ2YTA5YTYxZDY0YzZhNTAwYTkwMzM1NGNkNDFkNmI5YmJhNTgwZjQyZGQ3NDhhYWZjNDY3OWZiMjZmYmFhOWE5Yjc4MzE0MTg3M2M2OTQxMDJjNzI0NzAzMTFj',
      },
      frame: {
        version: '0.1',
        name: 'adivinaDrone',
        // icono en frame
        iconUrl: `${appUrl}/favicon.png`,
        homeUrl: appUrl,
        // imagenLoader en cast 1200x800 px
        imageUrl: `${appUrl}/castLoader.png`,
        buttonTitle: 'Start adivinaDrone',
        // imagen en splash
        splashImageUrl: `${appUrl}/splash.png`,
        splashBackgroundColor: '#2d283a',
        webhookUrl: `https://api.neynar.com/f/app/d10b038c-f875-4dfe-9094-3569216fd4d3/event`,
      },
    };
  
    return Response.json(config);
  }