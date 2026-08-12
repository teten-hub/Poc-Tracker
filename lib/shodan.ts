import net from 'net';

const RISKY_PORTS = new Set([
  '21', '22', '23', '25', '53', '80', '110', '143', '443', '445', '465', '587', '993', '995',
  '1080', '1433', '1521', '2375', '3306', '3389', '5432', '5900', '6379', '8080', '8443',
  '9200', '11211', '27017', '50070', '5900'
]);

const SERVICE_WEIGHTS: Record<string, number> = {
  redis: 18,
  mongodb: 18,
  elasticsearch: 16,
  postgres: 15,
  mysql: 15,
  rdp: 17,
  ssh: 14,
  smb: 17,
  ftp: 10,
  http: 8,
  https: 8,
  nginx: 8,
  apache: 8,
  tomcat: 10
};

function getRiskLevel(score: number) {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 35) return 'Moderate';
  return 'Low';
}

function normalizeProductName(product: string | null | undefined) {
  if (!product) return 'Unknown';
  return String(product).trim().toLowerCase();
}

function getUniqueServices(data: any[] = []) {
  const seen = new Set<string>();
  data.forEach((item) => {
    const product = normalizeProductName(item?.product || item?.os || item?.transport || 'Unknown');
    if (product && product !== 'unknown') seen.add(product);
  });
  return Array.from(seen).slice(0, 10);
}

function getUniquePorts(data: any[] = []) {
  const ports = new Set<string>();
  data.forEach((item) => {
    if (item?.port) ports.add(String(item.port));
  });
  return Array.from(ports).sort((a, b) => Number(a) - Number(b));
}

async function fetchShodanHost(ip: string, apiKey: string) {
  const url = `https://api.shodan.io/shodan/host/${encodeURIComponent(ip)}?key=${apiKey}`;
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shodan host API returned ${res.status}: ${text || 'Unknown error'}`);
  }

  return res.json();
}

async function fetchShodanSearch(query: string, apiKey: string) {
  const url = `https://api.shodan.io/shodan/host/search?key=${apiKey}&query=${encodeURIComponent(query)}&minify=false`;
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shodan search API returned ${res.status}: ${text || 'Unknown error'}`);
  }

  return res.json();
}

export async function analyzeShodanTarget(target: string, mode: 'overview' | 'host' | 'search' = 'overview') {
  const cleanTarget = target?.trim();

  if (!cleanTarget) {
    return { success: false, error: 'Target is required' };
  }

  const apiKey = process.env.SHODAN_API_KEY;
  const isPlaceholderKey = !apiKey || ['your_shodan_api_key_here', 'your_api_key_here', 'replace_me', 'changeme'].includes(apiKey.trim().toLowerCase());

  if (isPlaceholderKey) {
    return {
      success: false,
      configured: false,
      mode,
      message: 'SHODAN_API_KEY is not configured. Add your real Shodan API key to .env.local to enable live analysis.',
      summary: {
        riskLevel: 'Low',
        riskScore: 0,
        openPorts: 0,
        riskyPorts: 0,
        uniqueServices: 0,
        lastSeen: 'N/A'
      },
      risk: {
        score: 0,
        level: 'Low',
        reasons: ['API key missing or placeholder value']
      }
    };
  }

  const isIpTarget = net.isIP(cleanTarget);
  let hostData: any = null;
  let searchData: any = null;

  try {
    if (isIpTarget) {
      hostData = await fetchShodanHost(cleanTarget, apiKey);
    }

    if (!isIpTarget || mode === 'search' || mode === 'overview') {
      const query = isIpTarget ? `ip:${cleanTarget}` : cleanTarget;
      searchData = await fetchShodanSearch(query, apiKey);
    }
  } catch (error: any) {
    return {
      success: false,
      configured: true,
      mode,
      error: error?.message || 'Shodan lookup failed',
      summary: {
        riskLevel: 'Low',
        riskScore: 0,
        openPorts: 0,
        riskyPorts: 0,
        uniqueServices: 0,
        lastSeen: 'N/A'
      }
    };
  }

  const payload = hostData || searchData?.matches?.[0] || {};
  const portList = getUniquePorts(hostData?.data || searchData?.matches || []);
  const serviceList = getUniqueServices(hostData?.data || searchData?.matches || []);

  const riskyPorts = portList.filter((port) => RISKY_PORTS.has(port));

  const serviceWeighted = (hostData?.data || searchData?.matches || []).reduce((score: number, item: any) => {
    const product = normalizeProductName(item?.product || item?.os || item?.data || 'Unknown');
    return score + (SERVICE_WEIGHTS[product] || 0);
  }, 0);

  const openPortsScore = portList.length * 4;
  const riskyPortScore = riskyPorts.length * 12;
  const serviceScore = Math.min(serviceWeighted, 30);
  const exposureScore = isIpTarget && hostData?.vulns ? Object.keys(hostData.vulns).length * 12 : 0;

  const riskScore = Math.min(openPortsScore + riskyPortScore + serviceScore + exposureScore, 100);
  const riskLevel = getRiskLevel(riskScore);

  const hostSummary = {
    ip: hostData?.ip_str || cleanTarget,
    city: hostData?.city || searchData?.matches?.[0]?.location?.city || 'Unknown',
    country: hostData?.country_name || searchData?.matches?.[0]?.location?.country_name || 'Unknown',
    org: hostData?.org || searchData?.matches?.[0]?.org || 'Unknown',
    lastSeen: hostData?.last_update || searchData?.matches?.[0]?.timestamp || 'N/A',
    openPorts: portList,
    riskyPorts,
    serviceNames: serviceList,
    vulns: hostData?.vulns ? Object.keys(hostData.vulns) : []
  };

  const exposureMonitor = {
    observedAssets: searchData?.total || (hostData ? 1 : 0),
    exposedPortCount: portList.length,
    riskyPortCount: riskyPorts.length,
    uniqueServices: serviceList.length,
    status: riskLevel === 'Low' ? 'stable' : riskLevel === 'Moderate' ? 'watch' : 'elevated',
    topPorts: portList.slice(0, 10)
  };

  const continuousWatch = {
    trend: riskLevel === 'Low' ? 'low-change' : riskLevel === 'Moderate' ? 'monitoring' : 'alerting',
    lastSeen: hostSummary.lastSeen,
    changeRisk: riskScore >= 60 ? 'new exposure' : 'steady state',
    recommendation: riskScore >= 60 ? 'Escalate incident review and close exposed services.' : 'Continue routine monitoring and verify service baselines.'
  };

  const recommendations = [
    riskScore >= 60 ? 'Restrict or filter exposed services immediately.' : 'Keep an eye on new open ports and service banners.',
    riskyPorts.length > 0 ? 'Review access controls for risky ports: ' + riskyPorts.slice(0, 5).join(', ') : 'No high-risk ports observed in the current scan.',
    serviceList.length > 0 ? 'Validate whether services are expected in production or require patching.' : 'No service banner activity detected at the moment.'
  ];

  return {
    success: true,
    configured: true,
    mode,
    target: cleanTarget,
    summary: {
      riskLevel,
      riskScore,
      openPorts: portList.length,
      riskyPorts: riskyPorts.length,
      uniqueServices: serviceList.length,
      lastSeen: hostSummary.lastSeen
    },
    host: hostSummary,
    exposureMonitor,
    continuousWatch,
    risk: {
      score: riskScore,
      level: riskLevel,
      reasons: [
        portList.length > 0 ? `Open ports detected: ${portList.length}` : 'No open ports detected',
        riskyPorts.length > 0 ? `Risky ports exposed: ${riskyPorts.join(', ')}` : 'No known risky ports exposed',
        serviceList.length > 0 ? `Services seen: ${serviceList.join(', ')}` : 'No service fingerprints observed'
      ]
    },
    recommendations,
    raw: {
      hostData,
      searchData
    }
  };
}
