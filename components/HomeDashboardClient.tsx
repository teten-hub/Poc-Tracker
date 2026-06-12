"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Radar, Search, Shield, UserX, Skull, ArrowRight, Activity, AlertTriangle, Bug, GitBranch, Lock, ChevronDown, ExternalLink, MoreVertical, Star, Activity as ActivityIcon, Moon, Sun } from 'lucide-react';
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
  // Removed dark mode logic to adhere to DESIGN.md

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

  const handleIpSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipAddress.trim()) return;
    router.push(`/ip-analyzer?ip=${encodeURIComponent(ipAddress.trim())}`);
  };

  const tools = [
    {
      title: 'PoC Tracker',
      description: 'Real-time aggregation of Proof of Concepts from global repositories.',
      href: '/pocs',
      icon: <Radar className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      color: 'bg-blue-50 dark:bg-blue-500/10',
      borderColor: 'border-blue-200 dark:border-blue-500/20',
      stats: 'Global Repos',
    },
    {
      title: 'Threat Intel',
      description: 'Stream of actionable Indicators of Compromise (IOCs) from Twitter.',
      href: '/tweetfeed',
      icon: <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      color: 'bg-teal-50 dark:bg-teal-500/10',
      borderColor: 'border-teal-200 dark:border-teal-500/20',
      stats: 'OSINT Feed',
    },
    {
      title: 'IP Analyzer',
      description: 'Scan and analyze IP addresses against multiple intelligence feeds.',
      href: '/ip-analyzer',
      icon: <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      color: 'bg-indigo-50 dark:bg-indigo-500/10',
      borderColor: 'border-indigo-200 dark:border-indigo-500/20',
      stats: 'OSINT Feeds',
    },
    {
      title: 'Data Breach (HIBP)',
      description: 'Check if emails or passwords have been compromised in data breaches.',
      href: '/hibp',
      icon: <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />,
      color: 'bg-red-50 dark:bg-red-500/10',
      borderColor: 'border-red-200 dark:border-red-500/20',
      stats: 'Breach DB',
    },
    {
      title: 'Ransomware Tracker',
      description: 'Monitor recent ransomware group activities and victims.',
      href: '/ransomware',
      icon: <Skull className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      color: 'bg-purple-50 dark:bg-purple-500/10',
      borderColor: 'border-purple-200 dark:border-purple-500/20',
      stats: 'Dark Web',
    },
    {
      title: 'Tor Exit Nodes',
      description: 'Directory of known Tor exit node IP addresses.',
      href: '/tor-ips',
      icon: <TorIcon className="w-4 h-4 text-green-600 dark:text-green-400 fill-current" />,
      color: 'bg-green-50 dark:bg-green-500/10',
      borderColor: 'border-green-200 dark:border-green-500/20',
      stats: 'Anonymization',
    }
  ];

  const getSeverityLevel = (score: number | null) => {
    if (score === null) return 0;
    if (score >= 9.0) return 12; // Map to Wazuh high level
    if (score >= 7.0) return 10;
    if (score >= 4.0) return 7;
    return 3;
  };

  // Stats Calculations
  const totalPocs = totalPocsCount > 0 ? totalPocsCount : latestPocs.length;
  const countCritical = latestPocs.filter(p => p.cvss_score !== null && p.cvss_score >= 9.0).length;
  const countHigh = latestPocs.filter(p => p.cvss_score !== null && p.cvss_score >= 7.0 && p.cvss_score < 9.0).length;
  const countMedium = latestPocs.filter(p => p.cvss_score !== null && p.cvss_score >= 4.0 && p.cvss_score < 7.0).length;
  const countLowOrUnknown = totalPocs - countCritical - countHigh - countMedium;

  const pctCritical = totalPocs > 0 ? (countCritical / totalPocs) * 100 : 0;
  const pctHigh = totalPocs > 0 ? (countHigh / totalPocs) * 100 : 0;
  const pctMedium = totalPocs > 0 ? (countMedium / totalPocs) * 100 : 0;

  const donutTrackBg = '#b7c6d7';
  const conicGradient = `conic-gradient(#d64545 0% ${pctCritical}%, #ffeb6d ${pctCritical}% ${pctCritical + pctHigh}%, #3d82f6 ${pctCritical + pctHigh}% ${pctCritical + pctHigh + pctMedium}%, ${donutTrackBg} ${pctCritical + pctHigh + pctMedium}% 100%)`;

  // For Chart 3: Top High Risk Vulnerabilities
  const highRiskPocs = [...latestPocs]
    .filter(p => p.cvss_score && p.cvss_score >= 7.0)
    .sort((a, b) => (b.cvss_score || 0) - (a.cvss_score || 0))
    .slice(0, 5);
  
  const trendingPocsCount = latestPocs.filter(p => p.stargazers_count >= 10).length;

  // TweetFeed Calculations
  const totalIocs = tweetFeedData.length;
  const typeCounts: Record<string, number> = { url: 0, domain: 0, ip: 0, sha256: 0, md5: 0 };
  tweetFeedData.forEach(ioc => {
    if (typeCounts[ioc.type] !== undefined) {
      typeCounts[ioc.type]++;
    }
  });

  const pctUrl = totalIocs > 0 ? (typeCounts.url / totalIocs) * 100 : 0;
  const pctDomain = totalIocs > 0 ? (typeCounts.domain / totalIocs) * 100 : 0;
  const pctIp = totalIocs > 0 ? (typeCounts.ip / totalIocs) * 100 : 0;
  const pctSha256 = totalIocs > 0 ? (typeCounts.sha256 / totalIocs) * 100 : 0;
  const pctMd5 = totalIocs > 0 ? (typeCounts.md5 / totalIocs) * 100 : 0;

  // Colors based on DESIGN.md: url (Tertiary #3d82f6), domain (Secondary #292929), ip (Success #2f9e44), sha256 (Primary #ffeb6d), md5 (Error #d64545)
  let iocGradients = [];
  let curPct = 0;
  if (pctUrl > 0) { iocGradients.push(`#3d82f6 ${curPct}% ${curPct + pctUrl}%`); curPct += pctUrl; }
  if (pctDomain > 0) { iocGradients.push(`#292929 ${curPct}% ${curPct + pctDomain}%`); curPct += pctDomain; }
  if (pctIp > 0) { iocGradients.push(`#2f9e44 ${curPct}% ${curPct + pctIp}%`); curPct += pctIp; }
  if (pctSha256 > 0) { iocGradients.push(`#ffeb6d ${curPct}% ${curPct + pctSha256}%`); curPct += pctSha256; }
  if (pctMd5 > 0) { iocGradients.push(`#d64545 ${curPct}% ${curPct + pctMd5}%`); curPct += pctMd5; }
  const iocConicGradient = iocGradients.length > 0 ? `conic-gradient(${iocGradients.join(', ')})` : `conic-gradient(${donutTrackBg} 0% 100%)`;

  return (
    <div className="min-h-screen bg-base text-text-base font-sans pb-12 transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        
        {/* Page Title Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <Activity className="w-6 h-6 text-tertiary" />
             <h1 className="text-3xl font-semibold text-text-base tracking-tight">Global Threat Overview</h1>
          </div>
        </div>

        {/* Global Overview Stats Strip - Flatter UI */}
        <div className="bg-neutral rounded-md border border-border mb-6 flex flex-col md:flex-row md:divide-x divide-gray-200 shadow-sm transition-colors">
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-xs font-medium text-text-muted dark:text-text-muted mb-1 uppercase tracking-wider">Tracked Exploits</p>
             <p className="text-3xl font-normal text-blue-600 dark:text-blue-400 tracking-tight">{totalPocs}</p>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-xs font-medium text-text-muted dark:text-text-muted mb-1 uppercase tracking-wider">Critical Severities</p>
             <p className="text-3xl font-normal text-red-500 dark:text-red-400 tracking-tight">{countCritical}</p>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-xs font-medium text-text-muted dark:text-text-muted mb-1 uppercase tracking-wider">High Severities</p>
             <p className="text-3xl font-normal text-orange-500 dark:text-[#ffeb6d] tracking-tight">{countHigh}</p>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-xs font-medium text-text-muted dark:text-text-muted mb-1 uppercase tracking-wider">Trending (10+ Stars)</p>
             <p className="text-3xl font-normal text-green-600 dark:text-green-400 tracking-tight">{trendingPocsCount}</p>
           </div>
        </div>

        {/* IP Search Inline */}
        <div className="mb-6 flex flex-col md:flex-row items-center gap-4 bg-neutral border border-border p-4 rounded-md shadow-sm transition-colors">
          <div className="flex items-center gap-2 text-text-base min-w-[200px]">
            <Search className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <span className="text-sm font-medium">Quick IP Analysis</span>
          </div>
          <form onSubmit={handleIpSearch} className="flex w-full md:w-auto flex-1">
            <input
              type="text"
              className="flex-1 bg-surface border border-border rounded-l-md px-4 py-2 text-sm focus:border-blue-500 focus:bg-neutral focus:ring-1 focus:ring-blue-500 outline-none font-mono transition-all text-text-base placeholder:text-text-muted dark:placeholder:text-text-muted"
              placeholder="Enter IP address (e.g. 8.8.8.8)..."
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 border border-blue-600 dark:border-blue-500 dark:bg-blue-500 rounded-r-md px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
              Analyze
            </button>
          </form>
        </div>

        {/* Charts Split Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Chart 1: Donut Chart (Vulnerability Severities) */}
          <div className="bg-neutral rounded-md border border-border shadow-sm flex flex-col transition-colors">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border ">
              <h3 className="text-[13px] font-medium text-text-base ">PoC Severity Distribution</h3>
            </div>
            <div className="p-5 flex-1 flex items-center justify-center gap-8">
              <div className="relative w-36 h-36 rounded-full flex items-center justify-center shrink-0 transition-all" style={{ background: conicGradient }}>
                <div className="w-24 h-24 bg-neutral rounded-full flex items-center justify-center shadow-inner flex-col transition-colors">
                  <span className="text-2xl font-bold text-text-base ">{totalPocs}</span>
                  <span className="text-[10px] text-text-muted dark:text-text-muted font-medium uppercase tracking-wider">Total</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 text-[12px] text-text-muted dark:text-text-muted flex-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#d64545]"></div> Critical</span>
                  <span className="font-bold">{countCritical}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#ffeb6d]"></div> High</span>
                  <span className="font-bold">{countHigh}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#3d82f6]"></div> Medium</span>
                  <span className="font-bold">{countMedium}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: donutTrackBg }}></div> Low/Unknown</span>
                  <span className="font-bold">{countLowOrUnknown}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2: Donut Chart (TweetFeed IOC Types) */}
          <div className="bg-neutral rounded-md border border-border shadow-sm flex flex-col transition-colors">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border ">
              <h3 className="text-[13px] font-medium text-text-base ">7-Day IOC Types (TweetFeed)</h3>
            </div>
            <div className="p-5 flex-1 flex items-center justify-center gap-8">
              <div className="relative w-36 h-36 rounded-full flex items-center justify-center shrink-0 transition-all" style={{ background: iocConicGradient }}>
                <div className="w-24 h-24 bg-neutral rounded-full flex items-center justify-center shadow-inner flex-col transition-colors">
                  <span className="text-2xl font-bold text-text-base ">{totalIocs}</span>
                  <span className="text-[10px] text-text-muted dark:text-text-muted font-medium uppercase tracking-wider">Total</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 text-[12px] text-text-muted dark:text-text-muted flex-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#3d82f6]"></div> URL</span>
                  <span className="font-bold">{typeCounts.url}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#292929]"></div> Domain</span>
                  <span className="font-bold">{typeCounts.domain}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#2f9e44]"></div> IP</span>
                  <span className="font-bold">{typeCounts.ip}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#ffeb6d]"></div> SHA256</span>
                  <span className="font-bold">{typeCounts.sha256}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#d64545]"></div> MD5</span>
                  <span className="font-bold">{typeCounts.md5}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 3: Top High Risk Vulnerabilities Bar Chart */}
          <div className="bg-neutral rounded-md border border-border shadow-sm flex flex-col transition-colors">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border ">
              <h3 className="text-[13px] font-medium text-text-base ">Top 5 High Risk Vulnerabilities (CVSS)</h3>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-center gap-4">
              {highRiskPocs.map((poc, i) => {
                const barWidth = Math.max(((poc.cvss_score || 0) / 10) * 100, 2);
                return (
                  <div key={i} className="flex flex-col gap-1.5 group">
                    <div className="flex items-center justify-between text-xs text-text-muted dark:text-text-muted">
                      <span className="font-medium truncate max-w-[250px]" title={poc.cve_id || poc.repo_name}>
                        {poc.cve_id || (poc.repo_name ? poc.repo_name.split('/')[1] : 'Unknown')}
                      </span>
                      <span className="font-mono text-text-muted dark:text-text-muted group-hover:text-red-500 transition-colors flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-[#d64545]" /> {poc.cvss_score?.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#f5f5f5] rounded-sm overflow-hidden flex transition-colors">
                      <div className="h-full bg-[#d64545] transition-all duration-500" style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                );
              })}
              {highRiskPocs.length === 0 && (
                <div className="text-center text-text-muted dark:text-text-muted text-xs py-10">No data available.</div>
              )}
            </div>
          </div>

        </div>

        {/* Latest PoCs Section (Flatter Layout) */}
        {latestPocs.length > 0 && (
          <div className="mb-8">
            <div className="bg-neutral rounded-md border border-border shadow-sm transition-colors">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-base font-medium text-text-base flex items-center gap-2">
                  <Bug className="w-4 h-4 text-text-muted dark:text-text-muted" /> Latest Security Alerts
                </h2>
                <Link href="/pocs" className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">View all</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-text-muted ">
                  <thead className="text-[11px] font-semibold text-text-muted dark:text-text-muted bg-surface border-b border-border transition-colors">
                    <tr>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">Time</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">Repository</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">CVE(s)</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">Description</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">Level</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap text-right">Stars</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 ">
                    {latestPocs.slice(0, 10).map((poc) => {
                      const level = getSeverityLevel(poc.cvss_score);
                      return (
                        <tr key={poc.id} className="hover:bg-surface dark:hover:bg-[#2a2a2a] transition-colors">
                          <td className="px-5 py-2 whitespace-nowrap text-xs">
                            {new Date(poc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-5 py-2">
                            <a href={poc.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 max-w-[150px] truncate hover:text-blue-600 transition-colors font-medium">
                              <GitBranch className="w-3.5 h-3.5 text-text-muted dark:text-text-muted" />
                              {poc.repo_name ? (poc.repo_name.split('/')[1] || poc.repo_name) : 'Unknown'}
                            </a>
                          </td>
                          <td className="px-5 py-2 font-medium text-text-base ">
                            {poc.cve_id || '-'}
                          </td>
                          <td className="px-5 py-2 max-w-[300px] truncate text-xs" title={poc.description}>
                            {poc.description || 'No description provided.'}
                          </td>
                          <td className="px-5 py-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              level >= 10 ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' :
                              level >= 7 ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-[#ffeb6d] border-orange-200 dark:border-orange-500/20' :
                              'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                            }`}>
                              Lvl {level}
                            </span>
                          </td>
                          <td className="px-5 py-2 text-right">
                            <span className="inline-flex items-center gap-1 font-mono text-xs">
                              <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" /> {poc.stargazers_count}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modules Grid (Moved to Bottom) */}
        <div>
          <h2 className="text-sm font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider mb-4 border-b border-border pb-2 transition-colors">Intelligence Modules Directory</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {tools.map((tool, idx) => (
              <Link key={idx} href={tool.href} className="bg-neutral rounded-md border border-border shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all group p-4 flex flex-row items-center gap-4">
                <div className={`p-3 rounded border shrink-0 ${tool.color} ${tool.borderColor}`}>
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-text-muted dark:text-text-muted truncate mt-0.5">
                    {tool.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
