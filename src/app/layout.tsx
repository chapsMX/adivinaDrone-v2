import clsx from 'clsx';
import type { Metadata } from 'next';
// providers para transacciones
// import { Providers } from '@/app/providers';
import { protoMono } from '@/styles/fonts';
import './globals.css';

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
        <div className="font-mono dark">
          {/* <Providers>{children}</Providers> */}
          {children}
        </div>
      </body>
    </html>
  );
}