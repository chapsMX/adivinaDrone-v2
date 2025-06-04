'use client';
import dynamic from 'next/dynamic';

const AdivinaDrone = dynamic(() => import('@/components/Dashboard'), {
  ssr: false,
});

export default function App() {
  return <AdivinaDrone />;
}