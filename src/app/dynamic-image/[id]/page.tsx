import App from "@/app/app";
import { Metadata } from "next";

const appUrl = process.env.NEXT_PUBLIC_URL;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  /* const imageUrl = new URL(`${appUrl}/api/og/${id}`); */
  const imageUrl = new URL(`https://adivinadrone.c13studio.mx/api/og/${id}`);

  const frame = {
    version: "next",
    imageUrl: imageUrl.toString(),
    button: {
      title: "Check your's & mint an NFT",
      action: {
        type: "launch_frame",
        name: "Launch adivinaDrone",
        url: appUrl,
        splashImageUrl: `${appUrl}/images/splash.png`,
        splashBackgroundColor: "#ff8800",
      },
    },
  };

  return {
    title: "adivinaDrone",
    openGraph: {
      title: "adivinaDrone",
      description: "Think you know the world? Take the ultimate guess in our photo challenge!",
      images: [{ url: imageUrl.toString() }],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default async function StreakFlex() {
  return <App />;
}