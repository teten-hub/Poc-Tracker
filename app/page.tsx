import DashboardClient from '@/components/DashboardClient';
import { PocData } from '@/types';

export const revalidate = 300; // Cache the response for 5 minutes

export default async function Page() {
  let initialData: PocData[] = [];
  let errorMsgContent = null;

  try {
    const res = await fetch('https://poc-in-github.motikan2010.net/api/v1/', { next: { revalidate: 300 } });
    if (!res.ok) {
        throw new Error('Failed to fetch data');
    }
    const data = await res.json();
    initialData = data.pocs || data || [];
  } catch (error) {
    console.error('Error fetching data:', error);
    errorMsgContent = 'Upstream API is unavailable. Please try again later.';
  }

  return (
    <main>
      {errorMsgContent ? (
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-center max-w-lg">
            <h2 className="text-xl font-bold text-red-700 mb-2">Connection Error</h2>
            <p className="text-red-600">{errorMsgContent}</p>
          </div>
        </div>
      ) : (
        <DashboardClient initialData={initialData} />
      )}
    </main>
  );
}
