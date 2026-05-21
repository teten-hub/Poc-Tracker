import { Metadata } from 'next';
import RansomwareClient from '@/components/RansomwareClient';

export const metadata: Metadata = {
  title: 'Ransomware Tracker | SOC-Core',
  description: 'Global ransomware activity intelligence, tracking victims and threat groups in real-time.',
};

export default function RansomwarePage() {
  return <RansomwareClient />;
}
