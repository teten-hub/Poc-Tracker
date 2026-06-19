import { unstable_cache } from 'next/cache';

// Helper: fetch commit SHAs (small JSON, safe to cache)
const getCommitShas = unstable_cache(async (): Promise<{ headSha: string; baseSha: string | null; latestUpdate: string }> => {
  const commitsRes = await fetch('https://api.github.com/repos/teten-hub/ip_list/commits?path=tor_ips.txt&per_page=2', {
    next: { revalidate: 3600 }
  });

  if (!commitsRes.ok) {
    throw new Error(`Failed to fetch commit history: ${commitsRes.status}`);
  }

  const commits = await commitsRes.json();
  return {
    headSha: commits[0].sha,
    baseSha: commits.length >= 2 ? commits[1].sha : null,
    latestUpdate: commits[0].commit.author.date
  };
}, ['tor-commit-shas'], { revalidate: 3600 });

// Helper: fetch the raw IP file for a given SHA (cached)
const fetchIpFile = unstable_cache(async (sha: string): Promise<string[]> => {
  const res = await fetch(`https://raw.githubusercontent.com/teten-hub/ip_list/${sha}/tor_ips.txt`, {
    next: { revalidate: 3600 }
  });
  if (!res.ok) throw new Error(`Failed to fetch IP file for ${sha}`);
  const text = await res.text();
  return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}, ['tor-ip-file'], { revalidate: 3600 });

/**
 * Get the latest new IPs (diff between last two commits).
 * Cached via unstable_cache — result is small (~700 IPs + total count).
 */
export const getNewTorIps = unstable_cache(
  async () => {
    const { headSha, baseSha, latestUpdate } = await getCommitShas();
    const headLines = await fetchIpFile(headSha);
    const totalTracked = headLines.length;

    if (baseSha) {
      const baseLines = await fetchIpFile(baseSha);
      const baseSet = new Set(baseLines);
      const newIps = headLines.filter(ip => !baseSet.has(ip));
      return {
        newIps: newIps.length > 0 ? newIps : headLines.slice(-100),
        totalTracked,
        latestUpdate
      };
    }

    return { newIps: headLines.slice(-100), totalTracked, latestUpdate };
  },
  ['tor-new-ips'],
  { revalidate: 3600 }
);

/**
 * Search across ALL IPs in the repo (on-demand, not cached via unstable_cache).
 * Fetches the full file and filters server-side, returns max 100 results.
 */
export async function searchAllTorIps(query: string): Promise<{ matched: string[]; totalTracked: number; latestUpdate: string }> {
  const { headSha, latestUpdate } = await getCommitShas();
  const allIps = await fetchIpFile(headSha);
  const lowerQuery = query.toLowerCase();
  const matched = allIps.filter(ip => ip.includes(lowerQuery));
  return { matched, totalTracked: allIps.length, latestUpdate };
}


