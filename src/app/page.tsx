import { Metadata } from 'next';
import App from './app';

const appUrl = process.env.NEXT_PUBLIC_URL;

const frame = {
  version: 'next',
  imageUrl: `${appUrl}/castLoader.png`,
  button: {
    title: '🎮 📸 Play adivinaDrone 📸 🎮',
    action: {
      type: 'launch_frame',
      name: 'adivinaDrone',
      url: appUrl,
      splashImageUrl: `${appUrl}/splash_200.png`,
      splashBackgroundColor: '#2d283a',
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'adivinaDrone',
    openGraph: {
      title: 'adivinaDrone',
      description: 'Think you know the world? Take the ultimate guess in our photo challenge!',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <App />;
}