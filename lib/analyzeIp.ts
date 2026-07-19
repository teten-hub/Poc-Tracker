import net from 'net';

export async function analyzeIp(ip: string) {
  try {
    if (!ip) return { success: false, error: 'IP address parameter is required' };
    if (!net.isIP(ip)) return { success: false, error: 'Invalid IP address format' };

    const ipType = net.isIPv6(ip) ? 'IPv6' : 'IPv4';

    const vtApiKey = process.env.VIRUSTOTAL_API_KEY;
    const otxApiKey = process.env.OTX_API_KEY;
    const abuseApiKey = process.env.ABUSEIPDB_API_KEY;

    const [vtResult, otxResult, abuseResult, geoResult] = await Promise.allSettled([
      // VirusTotal
      (async () => {
        if (!vtApiKey || vtApiKey === 'your_virustotal_api_key_here') {
          return { configured: false, error: 'API key not configured' };
        }
        const url = `https://www.virustotal.com/api/v3/ip_addresses/${ip}`;
        const res = await fetch(url, { headers: { 'x-apikey': vtApiKey }, next: { revalidate: 300 } });
        if (!res.ok) throw new Error(`VirusTotal responded with status: ${res.status}`);
        const data = await res.json();
        const attrs = data?.data?.attributes || {};
        const stats = attrs.last_analysis_stats || {};
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
          engineCount: engineCount || 86,
          country: attrs.country || null,
          as_owner: attrs.as_owner || null,
          asn: attrs.asn || null,
          network: attrs.network || null,
          regional_internet_registry: attrs.regional_internet_registry || null,
          reputation: attrs.reputation || 0,
          last_analysis_date: attrs.last_analysis_date || null
        };
      })(),

      // AlienVault OTX
      (async () => {
        const url = `https://otx.alienvault.com/api/v1/indicators/${ipType}/${ip}/general`;
        const headers: Record<string, string> = {};
        if (otxApiKey && otxApiKey !== 'your_otx_api_key_here') headers['X-OTX-API-KEY'] = otxApiKey;
        const res = await fetch(url, { headers, next: { revalidate: 300 } });
        if (!res.ok) throw new Error(`AlienVault OTX responded with status: ${res.status}`);
        const data = await res.json();
        const pulses = data?.pulse_info?.pulses || [];
        const count = data?.pulse_info?.count || 0;
        const malwareFamilies = new Set<string>();
        pulses.forEach((pulse: any) => {
          if (pulse.malware_families) {
            pulse.malware_families.forEach((fam: any) => {
              if (typeof fam === 'string') malwareFamilies.add(fam);
              else if (fam && typeof fam === 'object' && fam.name) malwareFamilies.add(fam.name);
            });
          }
        });
        const pulsesDetails = pulses.slice(0, 5).map((p: any) => ({
          id: p.id,
          name: p.name || 'Unnamed Pulse',
          description: p.description || 'No description provided.',
          created: p.created || null,
          adversary: p.adversary || null,
          tags: p.tags || []
        }));

        return {
          configured: true,
          success: true,
          pulses: count,
          pulses_details: pulsesDetails,
          malware_family: Array.from(malwareFamilies).slice(0, 5)
        };
      })(),

      // AbuseIPDB
      (async () => {
        if (!abuseApiKey || abuseApiKey === 'your_abuseipdb_api_key_here') {
          return { configured: false, error: 'API key not configured' };
        }
        const url = `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=30&verbose`;
        const res = await fetch(url, { headers: { Key: abuseApiKey, Accept: 'application/json' }, next: { revalidate: 300 } });
        if (!res.ok) throw new Error(`AbuseIPDB responded with status: ${res.status}`);
        const data = await res.json();
        const info = data?.data || {};
        const reports = Array.isArray(info.reports) ? info.reports : [];

        return {
          configured: true,
          success: true,
          reported_times: info.totalReports || 0,
          confidence_score: `${info.abuseConfidenceScore || 0}%`,
          isp: info.isp || null,
          country: info.countryCode || null,
          country_name: info.countryName || null,
          city: info.city || null,
          domain: info.domain || null,
          usage_type: info.usageType || 'Unknown',
          num_distinct_users: info.numDistinctUsers || 0,
          ip_version: info.ipVersion || null,
          is_public: info.isPublic ?? null,
          is_whitelisted: info.isWhitelisted ?? null,
          is_tor: info.isTor ?? null,
          hostnames: info.hostnames || [],
          last_reported_at: info.lastReportedAt || null,
          reports_details: reports.slice(0, 5).map((report: any) => ({
            reported_at: report.reportedAt || null,
            comment: report.comment || 'No comment provided.',
            categories: Array.isArray(report.categories) ? report.categories : [],
            reporter_id: report.reporterId || null,
            reporter_country_code: report.reporterCountryCode || null,
            reporter_country_name: report.reporterCountryName || null
          }))
        };
      })(),

      // GeoIP (ip-api.com)
      (async () => {
        const res = await fetch(`http://ip-api.com/json/${ip}`, { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        return res.json();
      })()
    ]);

    const vt = vtResult.status === 'fulfilled' ? vtResult.value : { success: false, configured: true, error: vtResult.reason?.message || 'Failed to fetch' };
    const otx = otxResult.status === 'fulfilled' ? otxResult.value : { success: false, configured: true, error: otxResult.reason?.message || 'Failed to fetch' };
    const abuseipdb = abuseResult.status === 'fulfilled' ? abuseResult.value : { success: false, configured: true, error: abuseResult.reason?.message || 'Failed to fetch' };
    const geo = geoResult.status === 'fulfilled' ? geoResult.value : null;

    const getFullCountryName = (code: string | null) => {
      if (!code || code === 'N/A') return 'N/A';
      if (code.length === 2) {
        try {
          const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
          return regionNames.of(code.toUpperCase()) || code;
        } catch {
          return code;
        }
      }
      return code;
    };

    let rawCountry = (abuseipdb as any)?.country || (vt as any)?.country || geo?.countryCode || 'N/A';
    let fullCountry = rawCountry;
    if (geo?.country && rawCountry === geo?.countryCode) {
      fullCountry = geo.country;
    } else {
      fullCountry = getFullCountryName(rawCountry);
    }

    const location = {
      country: fullCountry,
      city: (abuseipdb as any)?.city || geo?.city || 'N/A',
      isp: (abuseipdb as any)?.isp || (vt as any)?.as_owner || geo?.isp || 'Unknown ISP'
    };

    return {
      success: true,
      ip,
      vt,
      otx,
      abuseipdb,
      location
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Internal Error' };
  }
}
