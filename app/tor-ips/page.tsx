import TorIpsClient from '@/components/TorIpsClient';
import { getNewTorIps } from '@/lib/torIps';

export const revalidate = 3600; // Cache the response for 1 hour

export default async function Page() {
  let initialData = { total: 0, ips: [] as string[] };
  let errorMsgContent = null;

  try {
    const { newIps, totalTracked } = await getNewTorIps();
    
    initialData = {
      total: totalTracked,
      ips: newIps.slice(0, 100)
    };

  } catch (error) {
    console.error('Error fetching Tor IPs:', error);
    errorMsgContent = 'Upstream GitHub repo is unavailable. Please try again later.';
  }

  return (
    <main>
      {errorMsgContent ? (
        <div className="flex h-screen items-center justify-center bg-base">
          <div className="bg-surface p-6 rounded-lg border border-gray-200 text-center max-w-lg">
            <h2 className="text-xl font-bold text-red-700 mb-2">Connection Error</h2>
            <p className="text-red-600">{errorMsgContent}</p>
          </div>
        </div>
      ) : (
        <TorIpsClient initialData={initialData} />
      )}
    </main>
  );
}
