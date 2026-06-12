import { NextResponse } from 'next/server';

async function fetchCvssScores(cveIds: string[]) {
  const scores: Record<string, { cvss_score: number | null, severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' }> = {};
  
  const batchSize = 10;
  for (let i = 0; i < cveIds.length; i += batchSize) {
    const batch = cveIds.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (cve) => {
      try {
        const response = await fetch(`https://cveawg.mitre.org/api/cve/${cve}`, { 
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(4000)
        });
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        
        let cvss = null;
        if (data?.containers) {
          const adpMetrics = data.containers.adp?.flatMap((adp: any) => adp.metrics || []) || [];
          const cnaMetrics = data.containers.cna?.metrics || [];
          const allMetrics = [...adpMetrics, ...cnaMetrics];
          
          for (const m of allMetrics) {
            if (m.cvssV4_0) { cvss = m.cvssV4_0.baseScore; break; }
            else if (m.cvssV3_1) { cvss = m.cvssV3_1.baseScore; break; }
            else if (m.cvssV3_0) { cvss = m.cvssV3_0.baseScore; break; }
            else if (m.cvssV3) { cvss = m.cvssV3.baseScore; break; }
            else if (m.cvssV2_0) { cvss = m.cvssV2_0.baseScore; break; }
          }
        }
        
        if (cvss === null) {
          cvss = data?.cvss3 || data?.cvss || null;
        }

        if (typeof cvss === 'string') cvss = parseFloat(cvss);
        
        let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' = 'UNKNOWN';
        if (cvss !== null) {
          if (cvss >= 9.0) severity = 'CRITICAL';
          else if (cvss >= 7.0) severity = 'HIGH';
          else if (cvss >= 4.0) severity = 'MEDIUM';
          else severity = 'LOW';
        }
        
        scores[cve] = { cvss_score: cvss, severity };
      } catch (error) {
        scores[cve] = { cvss_score: null, severity: 'UNKNOWN' };
      }
    }));
    
    if (i + batchSize < cveIds.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return scores;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cves = body.cves || [];
    
    if (!Array.isArray(cves)) {
      return NextResponse.json({ error: 'Invalid cves array' }, { status: 400 });
    }
    
    const uniqueCves = Array.from(new Set(cves.filter(Boolean))).slice(0, 50);
    const scores = await fetchCvssScores(uniqueCves);
    
    return NextResponse.json({ success: true, data: scores });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
