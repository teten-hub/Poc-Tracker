import React from 'react';
import HomeDashboardClient from '@/components/HomeDashboardClient';
import { PocData } from '@/types';

export const revalidate = 300;

export const metadata = {
  title: 'SOC-Core | Main Dashboard',
  description: 'Threat Intelligence & Security Operations Center Platform',
};

export default async function Page() {
  let latestPocs: PocData[] = [];

  try {
    const res = await fetch('https://poc-in-github.motikan2010.net/api/v1/', { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      let pocs: PocData[] = data.pocs || data || [];
      
      // Sort by date created desc
      pocs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      latestPocs = pocs.slice(0, 3);
    }
  } catch (error) {
    console.error('Error fetching latest pocs:', error);
  }

  return <HomeDashboardClient latestPocs={latestPocs} />;
}

