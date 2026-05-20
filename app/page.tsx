import DashboardClient from '@/components/DashboardClient';
import { PocData } from '@/types';

export const revalidate = 300; // Cache the response for 5 minutes

async function fetchCvssScores(cveIds: string[]) {
  const scores: Record<string, { cvss_score: number | null, severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' }> = {};
  
  // To prevent rate limiting for large number of distinct CVEs, process them in smaller batches
  // The circl.lu API allows single CVE queries. NVD API gives more at once but is stricter.
  const batchSize = 10;
  for (let i = 0; i < cveIds.length; i += batchSize) {
    const batch = cveIds.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (cve) => {
      try {
        const response = await fetch(`https://cve.circl.lu/api/cve/${cve}`, { next: { revalidate: 3600 } });
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        
        let cvss = null;
        if (data?.containers) {
          const adpMetrics = data.containers.adp?.flatMap((adp: any) => adp.metrics || []) || [];
          const cnaMetrics = data.containers.cna?.metrics || [];
          const allMetrics = [...adpMetrics, ...cnaMetrics];
          
          for (const m of allMetrics) {
            if (m.cvssV3_1) { cvss = m.cvssV3_1.baseScore; break; }
            else if (m.cvssV3_0) { cvss = m.cvssV3_0.baseScore; break; }
            else if (m.cvssV3) { cvss = m.cvssV3.baseScore; break; }
            else if (m.cvssV2_0) { cvss = m.cvssV2_0.baseScore; break; }
          }
        }
        
        // Fallback for older API format
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
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between batches to avoid rate limits
    }
  }
  
  return scores;
}

export default async function Page() {
  let initialData: PocData[] = [];
  let errorMsgContent = null;

  try {
    const res = await fetch('https://poc-in-github.motikan2010.net/api/v1/', { next: { revalidate: 300 } });
    if (!res.ok) {
        throw new Error('Failed to fetch data');
    }
    const data = await res.json();
    let pocs: PocData[] = data.pocs || data || [];

    // Extract unique cvs_ids (maximum up to 50 items to avoid taking too much time on page load in this example)
    const uniqueCves = Array.from(new Set(pocs.map((p) => p.cve_id).filter(Boolean))).slice(0, 50);
    
    const cvssData = await fetchCvssScores(uniqueCves);
    
    initialData = pocs.map(poc => ({
      ...poc,
      cvss_score: cvssData[poc.cve_id]?.cvss_score ?? null,
      severity: cvssData[poc.cve_id]?.severity ?? 'UNKNOWN',
    }));
  } catch (error) {
    console.error('Error fetching data:', error);
    errorMsgContent = 'Upstream API is unavailable. Please try again later.';
  }

  return (
    <main>
      {errorMsgContent ? (
        <div className="flex h-screen items-center justify-center bg-base">
          <div className="bg-surface p-6 rounded-lg border border-[#4d4d4d] text-center max-w-lg">
            <h2 className="text-xl font-bold text-red-700 mb-2">Connection Error</h2>
            <p className="text-red-600">{errorMsgContent}</p>
          </div>
        </div>
      ) : (
        <DashboardClient initialData={initialData} />
      )}
    </main>
  );
}
