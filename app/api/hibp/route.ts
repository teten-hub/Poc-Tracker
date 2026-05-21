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
      // Using XposedOrNot breach-analytics API for detailed breach info
      const url = `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(query)}`;
      
      const res = await fetch(url, { next: { revalidate: 3600 } });
      
      if (res.status === 404) {
        // 404 means the account was not found in any breaches (Clean)
        return NextResponse.json({ success: true, breached: false, breaches: [], metrics: null, pastes: null });
      }
      
      if (!res.ok) {
        return NextResponse.json({ 
          success: false, 
          error: `Service responded with status: ${res.status}` 
        });
      }

      const data = await res.json();
      
      // Extract detailed breach data from ExposedBreaches
      const exposedBreaches = data.ExposedBreaches?.breaches_details || [];
      const breachMetrics = data.BreachMetrics || null;
      const pastesSummary = data.PastesSummary || null;
      const exposedPastes = data.ExposedPastes?.pastes_details || [];
      
      // Map into rich format the frontend expects
      const formattedBreaches = exposedBreaches.map((breach: any) => ({
        Name: breach.breach || breach.breachID || 'Unknown',
        Title: breach.breach || breach.breachID || 'Unknown',
        Domain: breach.domain || 'Unknown',
        BreachDate: breach.xposed_date || breach.breachDate || 'Unknown',
        Description: breach.details || breach.description || 'No description available.',
        DataClasses: breach.xposed_data ? breach.xposed_data.split(';').map((s: string) => s.trim()).filter(Boolean) : ['Unknown'],
        PwnCount: breach.xposed_records || breach.pwnCount || 0,
        Industry: breach.industry || 'Unknown',
        Logo: breach.logo || null,
        PasswordRisk: breach.password_risk || 'Unknown',
        References: breach.references || null,
        Searchable: breach.searchable === 'Yes',
        Verified: breach.verified === 'Yes',
      }));

      // Parse metrics for summary display
      let parsedMetrics = null;
      if (breachMetrics) {
        parsedMetrics = {
          industry: breachMetrics.industry || [],
          passwordStrength: breachMetrics.passwords_strength || breachMetrics.passwordStrength || [],
          risk: breachMetrics.risk || [],
          yearlyBreaches: breachMetrics.yearwise_details || breachMetrics.yearlyBreaches || [],
          xposedDataSummary: breachMetrics.xposed_data || {},
        };
      }

      return NextResponse.json({ 
        success: true, 
        breached: formattedBreaches.length > 0, 
        breaches: formattedBreaches,
        metrics: parsedMetrics,
        pastes: {
          summary: pastesSummary,
          details: exposedPastes,
        },
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
