import clsx from 'clsx';
import type { Metadata } from 'next';
import { protoMono } from '@/styles/fonts';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { WagmiProviderClient } from '@/components/providers/WagmiProvider';

export const metadata: Metadata = {
  title: 'adivinaDrone',
  description: 'Think you know the world? Take the ultimate guess in our photo challenge!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={clsx('antialiased bg-slate-900', protoMono.variable)}>
        <WagmiProviderClient>
          <div className="font-mono dark">
            {children}
            <Analytics />
          </div>
        </WagmiProviderClient>
      </body>
    </html>
  );
}