import { NextResponse } from 'next/server';
import { getNewTorIps, searchAllTorIps } from '@/lib/torIps';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (query) {
      // Search across ALL IPs in the repo
      const { matched, totalTracked } = await searchAllTorIps(query);
      const limitedResults = matched.slice(0, 100);

      return NextResponse.json({
        success: true,
        total: totalTracked,
        matched: matched.length,
        limit: 100,
        query,
        ips: limitedResults
      });
    } else {
      // Default view: show the latest new IPs from the last commit
      const { newIps, totalTracked } = await getNewTorIps();
      const limitedResults = newIps.slice(0, 100);

      return NextResponse.json({
        success: true,
        total: totalTracked,
        matched: newIps.length,
        limit: 100,
        query: null,
        ips: limitedResults
      });
    }

  } catch (error) {
    console.error('Tor IPs API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}


