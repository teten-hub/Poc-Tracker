"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Radar, Search, Shield, UserX, Skull, ArrowRight, Activity, AlertTriangle, Bug, GitBranch, Lock, ChevronDown, ExternalLink, MoreVertical, Star, Moon, Sun, ChevronRight, Rss } from 'lucide-react';
import TorIcon from './TorIcon';
import { PocData } from '@/types';

interface HomeDashboardClientProps {
  latestPocs?: PocData[];
  totalPocsCount?: number;
}

export default function HomeDashboardClient({ latestPocs = [], totalPocsCount = 0 }: HomeDashboardClientProps) {
  const router = useRouter();
  const [ipAddress, setIpAddress] = useState('');
  const [tweetFeedData, setTweetFeedData] = useState<any[]>([]);
  const [enrichedPocsMap, setEnrichedPocsMap] = useState<Record<string, { cvss_score: number | null, severity: string }>>({});

  useEffect(() => {
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];
    fetch(`/api/tweetfeed?from=${from}&to=${to}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setTweetFeedData(json.data || []);
        }
      })
      .catch(err => console.error("Failed to load TweetFeed:", err));
  }, []);

  useEffect(() => {
    const cvesToFetch = Array.from(new Set(
      latestPocs
        .filter(p => p.cve_id && (p.cvss_score === null || p.cvss_score === undefined) && enrichedPocsMap[p.cve_id] === undefined)
        .map(p => p.cve_id)
    )).slice(0, 50);

    if (cvesToFetch.length > 0) {
      fetch('/api/cvss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cves: cvesToFetch })
      })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setEnrichedPocsMap(prev => ({ ...prev, ...json.data }));
        }
      })
      .catch(console.error);
    }
  }, [latestPocs, enrichedPocsMap]);

  const handleIpSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipAddress.trim()) return;
    router.push(`/ip-analyzer?ip=${encodeURIComponent(ipAddress.trim())}`);
  };

  const tools = [
    { title: 'PoC Tracker', href: '/pocs', icon: <Radar className="w-5 h-5" />, color: 'text-tertiary' },
    { title: 'Threat Intel', href: '/tweetfeed', icon: <Rss className="w-5 h-5" />, color: 'text-tertiary' },
    { title: 'IP Analyzer', href: '/ip-analyzer', icon: <Search className="w-5 h-5" />, color: 'text-tertiary' },
    { title: 'Data Breach', href: '/hibp', icon: <UserX className="w-5 h-5" />, color: 'text-tertiary' },
    { title: 'Ransomware', href: '/ransomware', icon: <Skull className="w-5 h-5" />, color: 'text-tertiary' },
    { title: 'Tor Nodes', href: '/tor-ips', icon: <TorIcon className="w-4 h-4 fill-current" />, color: 'text-tertiary' },
  ];

  const getSeverityLevel = (score: number | null) => {
    if (score === null) return 0;
    if (score >= 9.0) return 12;
    if (score >= 7.0) return 10;
    if (score >= 4.0) return 7;
    return 3;
  };

  // Stats Calculations
  const displayPocs = latestPocs.map(poc => {
    const enriched = enrichedPocsMap[poc.cve_id];
    if (enriched) return { ...poc, cvss_score: enriched.cvss_score, severity: enriched.severity };
    return poc;
  });

  const totalPocs = totalPocsCount > 0 ? totalPocsCount : displayPocs.length;
  const countCritical = displayPocs.filter(p => p.cvss_score !== null && p.cvss_score >= 9.0).length;
  const countHigh = displayPocs.filter(p => p.cvss_score !== null && p.cvss_score >= 7.0 && p.cvss_score < 9.0).length;
  const countMedium = displayPocs.filter(p => p.cvss_score !== null && p.cvss_score >= 4.0 && p.cvss_score < 7.0).length;
  const countLowOrUnknown = totalPocs - countCritical - countHigh - countMedium;

  const pctCritical = totalPocs > 0 ? (countCritical / totalPocs) * 100 : 0;
  const pctHigh = totalPocs > 0 ? (countHigh / totalPocs) * 100 : 0;
  const pctMedium = totalPocs > 0 ? (countMedium / totalPocs) * 100 : 0;

  const donutTrackBg = '#b7c6d7';
  
  const trendingPocsCount = latestPocs.filter(p => p.stargazers_count >= 10).length;

  // TweetFeed Calculations
  const totalIocs = tweetFeedData.length;
  const typeCounts: Record<string, number> = { url: 0, domain: 0, ip: 0, sha256: 0, md5: 0 };
  const tagCounts: Record<string, number> = {};

  tweetFeedData.forEach(ioc => {
    if (typeCounts[ioc.type] !== undefined) {
      typeCounts[ioc.type]++;
    }
    if (ioc.tags && Array.isArray(ioc.tags)) {
      ioc.tags.forEach((tag: string) => {
        const clean = tag.replace('#', '').toLowerCase();
        tagCounts[clean] = (tagCounts[clean] || 0) + 1;
      });
    }
  });

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const pctUrl = totalIocs > 0 ? (typeCounts.url / totalIocs) * 100 : 0;
  const pctDomain = totalIocs > 0 ? (typeCounts.domain / totalIocs) * 100 : 0;
  const pctIp = totalIocs > 0 ? (typeCounts.ip / totalIocs) * 100 : 0;
  const pctSha256 = totalIocs > 0 ? (typeCounts.sha256 / totalIocs) * 100 : 0;
  const pctMd5 = totalIocs > 0 ? (typeCounts.md5 / totalIocs) * 100 : 0;

  let iocGradients: string[] = [];
  let curPct = 0;
  if (pctUrl > 0) { iocGradients.push(`#3b82f6 ${curPct}% ${curPct + pctUrl}%`); curPct += pctUrl; }
  if (pctDomain > 0) { iocGradients.push(`#60a5fa ${curPct}% ${curPct + pctDomain}%`); curPct += pctDomain; }
  if (pctIp > 0) { iocGradients.push(`#93c5fd ${curPct}% ${curPct + pctIp}%`); curPct += pctIp; }
  if (pctSha256 > 0) { iocGradients.push(`#facc15 ${curPct}% ${curPct + pctSha256}%`); curPct += pctSha256; }
  if (pctMd5 > 0) { iocGradients.push(`#eab308 ${curPct}% ${curPct + pctMd5}%`); curPct += pctMd5; }
  const iocConicGradient = iocGradients.length > 0 ? `conic-gradient(${iocGradients.join(', ')})` : `conic-gradient(${donutTrackBg} 0% 100%)`;

  return (
    <div className="min-h-screen bg-base text-text-base font-sans pb-24">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 md:pt-16">
        
        {/* Page Header (Hero style) */}
        <div className="flex flex-col md:flex-row gap-10 items-start justify-between mb-16">
          <div className="max-w-2xl">
            <h1 className="text-headline-display text-text-base mb-4">
              Global Threat Overview
            </h1>
            <p className="text-body-lg text-text-muted">
              Real-time monitoring of active exploits, OSINT intelligence, and network threats across global sources.
            </p>
          </div>
          
          <div className="w-full md:w-[400px]">
            <form onSubmit={handleIpSearch} className="flex gap-2 w-full">
              <input
                type="text"
                className="floating-input flex-1"
                placeholder="Analyze IP Address..."
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
              <button type="submit" className="btn-primary shrink-0">
                Analyze
              </button>
            </form>
          </div>
        </div>

        {/* Main Content */}
        <div>
            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <div className="section-panel !p-8">
                <span className="text-label-md text-text-muted mb-2 block">Tracked Exploits</span>
                <span className="text-headline-display font-mono text-tertiary">{totalPocs.toLocaleString()}</span>
              </div>
              <div className="section-panel !p-8">
                <span className="text-label-md text-text-muted mb-2 block">Critical CVSS</span>
                <span className="text-headline-display font-mono text-error">{countCritical}</span>
              </div>
              <div className="section-panel !p-8">
                <span className="text-label-md text-text-muted mb-2 block">Trending (10+ ★)</span>
                <span className="text-headline-display font-mono text-success">{trendingPocsCount}</span>
              </div>
              <div className="section-panel !p-8">
                <span className="text-label-md text-text-muted mb-2 block">Total IOCs (7d)</span>
                <span className="text-headline-display font-mono text-on-surface">{totalIocs.toLocaleString()}</span>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
              
              {/* Chart 1: Severity Distribution */}
              <div className="section-panel">
                <div className="section-panel-header flex items-center justify-between">
                  <h3 className="text-headline-sm">PoC Severity Distribution</h3>
                  <Link href="/pocs" className="btn-secondary !h-auto !py-1.5 !px-3 text-xs flex items-center gap-1.5">
                    View Details <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex flex-col gap-6">
                  {/* Critical */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-label-sm text-text-muted flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#d64545]"></div> Critical (9.0+)
                      </span>
                      <span className="text-label-md font-mono">{countCritical}</span>
                    </div>
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 to-[#d64545] rounded-full transition-all duration-700" style={{ width: `${totalPocs > 0 ? Math.max((countCritical / totalPocs) * 100, 1) : 0}%` }} />
                    </div>
                  </div>
                  {/* High */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-label-sm text-text-muted flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]"></div> High (7.0 - 8.9)
                      </span>
                      <span className="text-label-md font-mono">{countHigh}</span>
                    </div>
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-[#f59e0b] rounded-full transition-all duration-700" style={{ width: `${totalPocs > 0 ? Math.max((countHigh / totalPocs) * 100, 1) : 0}%` }} />
                    </div>
                  </div>
                  {/* Medium */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-label-sm text-text-muted flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#3d82f6]"></div> Medium (4.0 - 6.9)
                      </span>
                      <span className="text-label-md font-mono">{countMedium}</span>
                    </div>
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-[#3d82f6] rounded-full transition-all duration-700" style={{ width: `${totalPocs > 0 ? Math.max((countMedium / totalPocs) * 100, 1) : 0}%` }} />
                    </div>
                  </div>
                  {/* Low / Unknown */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-label-sm text-text-muted flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: donutTrackBg }}></div> Low / Unknown
                      </span>
                      <span className="text-label-md font-mono">{countLowOrUnknown}</span>
                    </div>
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ backgroundColor: donutTrackBg, width: `${totalPocs > 0 ? Math.max((countLowOrUnknown / totalPocs) * 100, 1) : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart 2: IOC Types Donut */}
              <div className="section-panel">
                <div className="section-panel-header flex items-center justify-between">
                  <h3 className="text-headline-sm">7-Day IOC Types</h3>
                  <Link href="/tweetfeed" className="btn-secondary !h-auto !py-1.5 !px-3 text-xs flex items-center gap-1.5">
                    View Details <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex items-center justify-center gap-8 py-4">
                  <div className="relative w-36 h-36 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ background: iocConicGradient }}>
                    <div className="w-28 h-28 bg-neutral rounded-full flex items-center justify-center flex-col">
                      <span className="text-headline-md">{totalIocs}</span>
                      <span className="text-caption text-text-muted uppercase tracking-widest">Total</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-label-sm"><div className="w-3 h-3 rounded-sm bg-[#3b82f6]"></div> URL</span>
                      <span className="text-label-md">{typeCounts.url}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-label-sm"><div className="w-3 h-3 rounded-sm bg-[#60a5fa]"></div> Domain</span>
                      <span className="text-label-md">{typeCounts.domain}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-label-sm"><div className="w-3 h-3 rounded-sm bg-[#93c5fd]"></div> IP</span>
                      <span className="text-label-md">{typeCounts.ip}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-label-sm"><div className="w-3 h-3 rounded-sm bg-[#facc15]"></div> SHA256</span>
                      <span className="text-label-md">{typeCounts.sha256}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-label-sm"><div className="w-3 h-3 rounded-sm bg-[#eab308]"></div> MD5</span>
                      <span className="text-label-md">{typeCounts.md5}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart 3: Top Tags */}
              <div className="section-panel">
                <div className="section-panel-header flex items-center justify-between">
                  <h3 className="text-headline-sm">Top Threat Tags</h3>
                  <Link href="/tweetfeed" className="btn-secondary !h-auto !py-1.5 !px-3 text-xs flex items-center gap-1.5">
                    View Details <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex flex-col gap-5">
                  {topTags.map(([tag, count], i) => {
                    const maxCount = topTags.length > 0 ? topTags[0][1] : 1;
                    const barWidth = Math.max((count / maxCount) * 100, 2);
                    return (
                      <div key={tag} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-label-sm text-text-muted uppercase tracking-wider">
                            #{tag}
                          </span>
                          <span className="text-label-md font-mono">
                            {count}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-yellow-400 rounded-full transition-all duration-700" style={{ width: `${barWidth}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {topTags.length === 0 && (
                    <div className="text-center text-text-muted py-10">No tags found.</div>
                  )}
                </div>
              </div>

            </div>

            {/* Latest PoCs Table */}
            {latestPocs.length > 0 && (
              <div className="section-panel">
                <div className="section-panel-header">
                  <h3 className="text-headline-sm flex items-center gap-3">
                    <Bug className="w-6 h-6 text-tertiary" /> Latest Vulnerabilities
                  </h3>
                  <Link href="/pocs" className="btn-secondary !h-auto !py-2 !px-4 text-sm flex items-center gap-2">
                    View Directory <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <table className="clean-table w-full">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>CVE ID</th>
                        <th>Description</th>
                        <th>CVSS</th>
                        <th className="text-right">Stars</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayPocs.slice(0, 10).map((poc) => {
                        return (
                          <tr key={poc.id}>
                            <td className="whitespace-nowrap">
                              {new Date(poc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="font-bold text-text-base">
                              {poc.cve_id || '-'}
                            </td>
                            <td className="max-w-[400px] truncate" title={poc.description}>
                              {poc.description || 'No description provided.'}
                            </td>
                            <td>
                              <span className={`badge ${
                                (poc.cvss_score || 0) >= 9.0 ? 'badge-critical' :
                                (poc.cvss_score || 0) >= 7.0 ? 'badge-high' :
                                poc.cvss_score ? 'badge-medium' : 'badge-low'
                              }`}>
                                {poc.cvss_score ? poc.cvss_score.toFixed(1) : '-'}
                              </span>
                            </td>
                            <td className="text-right font-mono">
                              <span className="inline-flex items-center gap-1.5 justify-end w-full">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {poc.stargazers_count}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Intelligence Tools Row (Bottom) */}
            <div className="mt-8 mb-8 pt-8 border-t border-border">
              <h3 className="text-label-sm text-text-muted uppercase tracking-widest mb-4">
                Intelligence Tools
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                {tools.map((tool, idx) => (
                  <Link 
                    key={idx} 
                    href={tool.href} 
                    className="flex items-center gap-3 px-5 py-3.5 rounded-lg hover:bg-surface transition-colors group flex-1 min-w-[180px]"
                  >
                    <div className={`${tool.color} transition-transform group-hover:scale-110`}>
                      {tool.icon}
                    </div>
                    <span className="text-sm font-medium text-text-base group-hover:text-tertiary transition-colors flex-1">
                      {tool.title}
                    </span>
                    <ArrowRight className="w-4 h-4 text-border group-hover:text-tertiary transition-colors opacity-0 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </div>

          </div>

      </main>
    </div>
  );
}
