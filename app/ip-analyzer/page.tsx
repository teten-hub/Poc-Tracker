import IpAnalyzerClient from '@/components/IpAnalyzerClient';

export const metadata = {
  title: 'IP Analyzer - SOC-Core Platform',
  description: 'Analyze IP addresses across multiple Threat Intelligence sources',
};

export default function IpAnalyzerPage() {
  return <IpAnalyzerClient />;
}