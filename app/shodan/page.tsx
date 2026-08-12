import { Suspense } from 'react';
import ShodanClient from '@/components/ShodanClient';

export const metadata = {
  title: 'Threat Exposure Intelligence',
  description: 'Threat exposure monitoring for internet-facing assets and services'
};

export default function ShodanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    }>
      <ShodanClient />
    </Suspense>
  );
}
