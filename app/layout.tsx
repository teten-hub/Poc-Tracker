import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'SOC-Core Platform',
  description: 'SOC Intelligence and Analysis Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-base text-text-base antialiased`}>
        <Sidebar />
        <div className="flex-1 w-full min-h-screen pt-16 md:pt-0 md:pl-64">
          {children}
        </div>
      </body>
    </html>
  );
}
