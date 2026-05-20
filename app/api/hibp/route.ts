import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const query = searchParams.get('query');

    if (!type || !query) {
      return NextResponse.json(
        { success: false, error: 'Type and query parameters are required' },
        { status: 400 }
      );
    }

    if (type === 'account') {
      // Using XposedOrNot free API for email breach checks
      const url = `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(query)}`;
      
      const res = await fetch(url, { next: { revalidate: 3600 } });
      
      if (res.status === 404) {
        // 404 means the account was not found in any breaches (Clean)
        return NextResponse.json({ success: true, breached: false, breaches: [] });
      }
      
      if (!res.ok) {
        return NextResponse.json({ 
          success: false, 
          error: `Service responded with status: ${res.status}` 
        });
      }

      const data = await res.json();
      const breachNames = data.breaches && data.breaches[0] ? data.breaches[0] : [];
      
      // Map names into a format the frontend expects
      const formattedBreaches = breachNames.map((name: string) => ({
        Name: name,
        Title: name,
        Domain: 'Unknown',
        BreachDate: 'Unknown',
        Description: 'Details available on xposedornot.com',
        DataClasses: ['Exposed Data'],
        PwnCount: 'Unknown'
      }));

      // In a more complex app, we could fetch /v1/breaches to map full details,
      // but providing the names gives immediate value!
      return NextResponse.json({ 
        success: true, 
        breached: formattedBreaches.length > 0, 
        breaches: formattedBreaches 
      });
      
    } else if (type === 'password') {
      // k-Anonymity model for password: SHA-1 hash, send only first 5 chars
      const shasum = crypto.createHash('sha1');
      shasum.update(query);
      const hash = shasum.digest('hex').toUpperCase();
      
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);

      const url = `https://api.pwnedpasswords.com/range/${prefix}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });

      if (!res.ok) {
         return NextResponse.json({ success: false, error: `Password API responded with status: ${res.status}` });
      }

      const text = await res.text();
      // Response format is a list of: SUFFIX:COUNT\r\n
      const lines = text.split('\n');
      
      let pwnedCount = 0;
      for (const line of lines) {
        const [lineSuffix, count] = line.trim().split(':');
        if (lineSuffix === suffix) {
          pwnedCount = parseInt(count, 10);
          break;
        }
      }

      return NextResponse.json({
        success: true,
        breached: pwnedCount > 0,
        count: pwnedCount
      });
      
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Use "account" or "password"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
