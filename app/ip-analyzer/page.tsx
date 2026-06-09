import { Suspense } from 'react';
import IpAnalyzerClient from '@/components/IpAnalyzerClient';

export const metadata = {
  title: 'IP Analyzer - SOC-Core Platform',
  description: 'Analyze IP addresses across multiple Threat Intelligence sources',
};

export default function IpAnalyzerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    }>
      <IpAnalyzerClient />
    </Suspense>
  );
}
