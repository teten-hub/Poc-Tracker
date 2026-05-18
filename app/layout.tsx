import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PoC Tracker',
  description: 'Threat Intelligence PoC Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
