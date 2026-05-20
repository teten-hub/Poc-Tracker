import HibpClient from '@/components/HibpClient';

export const metadata = {
  title: 'Have I Been Pwned - SOC-Core Platform',
  description: 'Check if your email, phone number, or password has been compromised in a data breach.',
};

export default function HibpPage() {
  return <HibpClient />;
}
