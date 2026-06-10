import { NextRequest, NextResponse } from 'next/server';

const TWEETFEED_API = 'https://api.tweetfeed.live/v1';

const VALID_TYPES = ['url', 'domain', 'ip', 'sha256', 'md5'] as const;
type IOCType = typeof VALID_TYPES[number];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Get date range parameters (format: YYYY-MM-DD)
  // Default 'from' to today if not provided
  const defaultFrom = new Date().toISOString().split('T')[0];
  const from = searchParams.get('from') || defaultFrom;
  const to = searchParams.get('to');
  const iocType = searchParams.get('type') as IOCType | null;

  // Validate ISO date format basic regex (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(from) || (to && !dateRegex.test(to))) {
    return NextResponse.json(
      { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' },
      { status: 400 }
    );
  }

  if (iocType && !VALID_TYPES.includes(iocType)) {
    return NextResponse.json(
      { success: false, error: 'Invalid type. Use: url, domain, ip, sha256, or md5.' },
      { status: 400 }
    );
  }

  try {
    // Build the API URL using the /since/ endpoint
    const apiUrl = iocType
      ? `${TWEETFEED_API}/since/${from}T00:00:00Z/${iocType}`
      : `${TWEETFEED_API}/since/${from}T00:00:00Z`;

    const response = await fetch(apiUrl, {
      cache: 'no-store', // Disable internal Next.js cache to avoid 2MB limit on 'month' data
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TweetFeed API returned ${response.status}`);
    }

    let data = await response.json();

    // Filter by 'to' date if provided
    if (to) {
      const toDate = new Date(`${to}T23:59:59Z`).getTime();
      data = data.filter((item: any) => {
        let d = new Date(item.date);
        if (isNaN(d.getTime())) {
          d = new Date(item.date.replace(' ', 'T') + 'Z');
        }
        return !isNaN(d.getTime()) && d.getTime() <= toDate;
      });
    }

    return NextResponse.json({
      success: true,
      range: { from, to },
      type: iocType || 'all',
      count: data.length,
      data,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    });
  } catch (error: any) {
    console.error('TweetFeed API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch TweetFeed data' },
      { status: 502 }
    );
  }
}
