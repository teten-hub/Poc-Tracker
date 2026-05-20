import { NextResponse } from 'next/server';

const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');

    if (!ip) {
      return NextResponse.json(
        { success: false, error: 'IP address parameter is required' },
        { status: 400 }
      );
    }

    if (!ipRegex.test(ip)) {
      return NextResponse.json(
        { success: false, error: 'Invalid IPv4 address format' },
        { status: 400 }
      );
    }

    const vtApiKey = process.env.VIRUSTOTAL_API_KEY;
    const otxApiKey = process.env.OTX_API_KEY;
    const abuseApiKey = process.env.ABUSEIPDB_API_KEY;

    // Execute queries in parallel using Promise.allSettled for maximum efficiency
    const [vtResult, otxResult, abuseResult, geoResult] = await Promise.allSettled([
      // 1. VirusTotal Lookup
      (async () => {
        if (!vtApiKey || vtApiKey === 'your_virustotal_api_key_here') {
          return { configured: false, error: 'API key not configured' };
        }
        const url = `https://www.virustotal.com/api/v3/ip_addresses/${ip}`;
        const res = await fetch(url, {
          headers: { 'x-apikey': vtApiKey },
          next: { revalidate: 300 } // Cache VT lookup for 5 mins
        });
        if (!res.ok) {
          throw new Error(`VirusTotal responded with status: ${res.status}`);
        }
        const data = await res.json();
        const stats = data?.data?.attributes?.last_analysis_stats || {};
        const malicious = stats.malicious || 0;
        const suspicious = stats.suspicious || 0;
        const undetected = stats.undetected || 0;
        const harmless = stats.harmless || 0;
        const timeout = stats.timeout || 0;
        const engineCount = malicious + suspicious + undetected + harmless + timeout;

        return {
          configured: true,
          success: true,
          malicious,
          suspicious,
          undetected,
          engineCount: engineCount || 86, // Fallback to common engine size if 0
          country: data?.data?.attributes?.country || null,
          as_owner: data?.data?.attributes?.as_owner || null
        };
      })(),

      // 2. AlienVault OTX Lookup
      (async () => {
        // AlienVault general info indicator lookup
        const url = `https://otx.alienvault.com/api/v1/indicators/IPv4/${ip}/general`;
        const headers: Record<string, string> = {};
        if (otxApiKey && otxApiKey !== 'your_otx_api_key_here') {
          headers['X-OTX-API-KEY'] = otxApiKey;
        }

        const res = await fetch(url, {
          headers,
          next: { revalidate: 300 }
        });
        if (!res.ok) {
          throw new Error(`AlienVault OTX responded with status: ${res.status}`);
        }
        const data = await res.json();
        const pulses = data?.pulse_info?.pulses || [];
        const count = data?.pulse_info?.count || 0;

        // Extract unique malware families
        const malwareFamilies = new Set<string>();
        pulses.forEach((pulse: any) => {
          if (pulse.malware_families) {
            pulse.malware_families.forEach((fam: any) => {
              if (typeof fam === 'string') {
                malwareFamilies.add(fam);
              } else if (fam && typeof fam === 'object' && fam.name) {
                malwareFamilies.add(fam.name);
              }
            });
          }
        });

        return {
          configured: true,
          success: true,
          pulses: count,
          malware_family: Array.from(malwareFamilies).slice(0, 5) // Return up to top 5 families
        };
      })(),

      // 3. AbuseIPDB Lookup
      (async () => {
        if (!abuseApiKey || abuseApiKey === 'your_abuseipdb_api_key_here') {
          return { configured: false, error: 'API key not configured' };
        }
        const url = `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`;
        const res = await fetch(url, {
          headers: {
            'Key': abuseApiKey,
            'Accept': 'application/json'
          },
          next: { revalidate: 300 }
        });
        if (!res.ok) {
          throw new Error(`AbuseIPDB responded with status: ${res.status}`);
        }
        const data = await res.json();
        const info = data?.data || {};

        return {
          configured: true,
          success: true,
          reported_times: info.totalReports || 0,
          confidence_score: `${info.abuseConfidenceScore || 0}%`,
          isp: info.isp || null,
          country: info.countryCode || null,
          city: info.city || null,
          domain: info.domain || null
        };
      })(),

      // 4. Free GeoIP Fallback Lookup (ip-api.com)
      (async () => {
        const res = await fetch(`http://ip-api.com/json/${ip}`, {
          next: { revalidate: 3600 } // Cache geo details for 1 hour
        });
        if (!res.ok) return null;
        return res.json();
      })()
    ]);

    // Gather results safely, checking fulfillments
    const vt = vtResult.status === 'fulfilled' ? vtResult.value : { success: false, configured: true, error: vtResult.reason?.message || 'Failed to fetch' };
    const otx = otxResult.status === 'fulfilled' ? otxResult.value : { success: false, configured: true, error: otxResult.reason?.message || 'Failed to fetch' };
    const abuseipdb = abuseResult.status === 'fulfilled' ? abuseResult.value : { success: false, configured: true, error: abuseResult.reason?.message || 'Failed to fetch' };
    const geo = geoResult.status === 'fulfilled' ? geoResult.value : null;

    // Aggregate geographical/ISP data from multiple sources
    const location = {
      country: (abuseipdb as any)?.country || (vt as any)?.country || geo?.countryCode || 'N/A',
      city: (abuseipdb as any)?.city || geo?.city || 'N/A',
      isp: (abuseipdb as any)?.isp || (vt as any)?.as_owner || geo?.isp || 'Unknown ISP'
    };

    return NextResponse.json({
      success: true,
      ip,
      vt,
      otx,
      abuseipdb,
      location
    });

  } catch (error) {
    console.error('IP Analyzer API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
