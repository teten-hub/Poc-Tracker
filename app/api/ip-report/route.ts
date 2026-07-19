import { NextResponse } from 'next/server';
import net from 'net';
import { analyzeIp } from '@/lib/analyzeIp';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');

    if (!ip) {
      return NextResponse.json({ success: false, error: 'IP address parameter is required' }, { status: 400 });
    }

    if (!net.isIP(ip)) {
      return NextResponse.json({ success: false, error: 'Invalid IP address format' }, { status: 400 });
    }

    const result = await analyzeIp(ip);
    // Integration endpoint: no HTML, pure JSON
    return NextResponse.json(result);
  } catch (error) {
    console.error('IP Report API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
