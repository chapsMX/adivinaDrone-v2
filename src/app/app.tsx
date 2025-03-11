'use client';
import dynamic from 'next/dynamic';

const AdivinaDrone = dynamic(() => import('@/components/AdivinaDrone'), {
  ssr: false,
});

export default function App() {
  return <AdivinaDrone />;
}