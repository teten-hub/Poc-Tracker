import { NextResponse } from 'next/server';
import { analyzeShodanTarget } from '@/lib/shodan';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target') || searchParams.get('ip') || '';
    const mode = (searchParams.get('mode') || 'overview') as 'overview' | 'host' | 'search';

    if (!target) {
      return NextResponse.json({ success: false, error: 'Target parameter is required' }, { status: 400 });
    }

    const result = await analyzeShodanTarget(target, mode);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Shodan analysis failed' }, { status: 500 });
  }
}
