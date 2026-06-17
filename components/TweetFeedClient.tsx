"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Rss, Loader2, Search, TrendingUp, Users, Shield,
  Globe, Calendar, ChevronRight, ChevronLeft, AlertTriangle, Activity,
  ExternalLink, Clock, BarChart3, Link2, Hash, X,
  Copy, Check, Filter, Radio, FileText, Cpu, Eye,
  ArrowUpRight, Zap, Target, MoreVertical
} from 'lucide-react';
import Link from 'next/link';

/* ─── Types ───────────────────────────────────────────────────── */
interface IOCEntry {
  date: string;
  user: string;
  type: 'url' | 'domain' | 'ip' | 'md5' | 'sha256';
  value: string;
  tags: string[];
  tweet: string;
}

type TabKey = 'feed' | 'researchers';
type IOCTypeFilter = 'all' | 'url' | 'domain' | 'ip' | 'sha256' | 'md5';

/* ─── Constants ───────────────────────────────────────────────── */
const IOC_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode; rawColor: string }> = {
  url:    { label: 'URL',    color: 'text-[#3d82f6]',    bgColor: 'bg-[#3d82f6]/10 border-[#3d82f6]/20',    icon: <Link2 className="w-4 h-4" />, rawColor: '#3d82f6' },
  domain: { label: 'Domain', color: 'text-[#8b5cf6]',    bgColor: 'bg-[#8b5cf6]/10 border-[#8b5cf6]/20',    icon: <Globe className="w-4 h-4" />, rawColor: '#8b5cf6' },
  ip:     { label: 'IP',     color: 'text-[#2f9e44]',     bgColor: 'bg-[#2f9e44]/10 border-[#2f9e44]/20', icon: <Target className="w-4 h-4" />, rawColor: '#2f9e44' },
  sha256: { label: 'SHA256', color: 'text-[#f59e0b]',   bgColor: 'bg-[#f59e0b]/10 border-[#f59e0b]/20',  icon: <FileText className="w-4 h-4" />, rawColor: '#f59e0b' },
  md5:    { label: 'MD5',    color: 'text-[#d64545]',  bgColor: 'bg-[#d64545]/10 border-[#d64545]/20', icon: <Hash className="w-4 h-4" />, rawColor: '#d64545' },
};

const TAG_COLORS = [
  'bg-red-500/10 text-red-500 border-red-500/20',
  'bg-violet-500/10 text-violet-500 border-violet-500/20',
  'bg-pink-500/10 text-pink-500 border-pink-500/20',
  'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'bg-green-500/10 text-green-600 border-green-500/20',
  'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  'bg-teal-500/10 text-teal-600 border-teal-500/20',
  'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'bg-amber-500/10 text-amber-600 border-amber-500/20',
];

function getTagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

/* ─── Utility ─────────────────────────────────────────────────── */
function defang(value: string, type: string): string {
  if (type === 'md5' || type === 'sha256') return value;
  let defanged = value
    .replace(/https?:\/\//gi, (match) => match.replace('http', 'hxxp'))
    .replace(/ftp:\/\//gi, 'fxp://')
    .replace(/\./g, '[.]');
  return defanged;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  try {
    let d = new Date(dateStr);
    if (isNaN(d.getTime())) d = new Date(dateStr.replace(' ', 'T') + 'Z');
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 30) return `${diffD}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}

function formatDateTime(dateStr: string): string {
  try {
    let d = new Date(dateStr);
    if (isNaN(d.getTime())) d = new Date(dateStr.replace(' ', 'T') + 'Z');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } catch { return dateStr; }
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function TweetFeedClient() {
  const [activeTab, setActiveTab] = useState<TabKey>('feed');
  
  const defaultFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defaultTo = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState<string>(defaultFrom);
  const [toDate, setToDate] = useState<string>(defaultTo);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iocData, setIocData] = useState<IOCEntry[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<IOCTypeFilter>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [researcherFilter, setResearcherFilter] = useState<string | null>(null);
  const [selectedIOC, setSelectedIOC] = useState<IOCEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { setCurrentPage(1); }, [typeFilter, tagFilter, researcherFilter, searchQuery]);

  const fetchData = useCallback(async (from: string, to: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentPage(1);
    try {
      const res = await fetch(`/api/tweetfeed?from=${from}&to=${to}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load data');
      const sorted = (json.data || []).sort((a: IOCEntry, b: IOCEntry) =>
        new Date(b.date.replace(' ', 'T') + 'Z').getTime() - new Date(a.date.replace(' ', 'T') + 'Z').getTime()
      );
      setIocData(sorted);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch TweetFeed data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(fromDate, toDate); }, []);

  const stats = useMemo(() => {
    const typeCounts: Record<string, number> = { url: 0, domain: 0, ip: 0, sha256: 0, md5: 0 };
    const tagCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    const userTags: Record<string, Record<string, number>> = {};
    const userLatest: Record<string, string> = {};
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<string, number> = {};

    iocData.forEach((entry) => {
      typeCounts[entry.type] = (typeCounts[entry.type] || 0) + 1;
      entry.tags.forEach((tag) => {
        const clean = tag.replace('#', '').toLowerCase();
        tagCounts[clean] = (tagCounts[clean] || 0) + 1;
      });
      userCounts[entry.user] = (userCounts[entry.user] || 0) + 1;
      if (!userTags[entry.user]) userTags[entry.user] = {};
      entry.tags.forEach((tag) => {
        const clean = tag.replace('#', '').toLowerCase();
        userTags[entry.user][clean] = (userTags[entry.user][clean] || 0) + 1;
      });
      if (!userLatest[entry.user] || entry.date > userLatest[entry.user]) {
        userLatest[entry.user] = entry.date;
      }
      try {
        let d = new Date(entry.date);
        if (isNaN(d.getTime())) d = new Date(entry.date.replace(' ', 'T') + 'Z');
        if (!isNaN(d.getTime())) {
          hourCounts[d.getUTCHours()] = (hourCounts[d.getUTCHours()] || 0) + 1;
          const dayKey = d.toISOString().split('T')[0];
          dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;
        }
      } catch {}
    });

    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
    const topResearchers = Object.entries(userCounts).sort((a, b) => b[1] - a[1]);
    const researcherDetails = topResearchers.map(([user, count]) => ({
      user, count,
      tags: Object.entries(userTags[user] || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t),
      latest: userLatest[user] || '',
    }));

    return { typeCounts, tagCounts, topTags, topResearchers, researcherDetails, hourCounts, dayCounts, total: iocData.length };
  }, [iocData]);

  const filteredData = useMemo(() => {
    let data = iocData;
    if (typeFilter !== 'all') data = data.filter((e) => e.type === typeFilter);
    if (tagFilter) data = data.filter((e) => e.tags.some((t) => t.replace('#', '').toLowerCase() === tagFilter));
    if (researcherFilter) data = data.filter((e) => e.user === researcherFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      data = data.filter((e) => e.value.toLowerCase().includes(q) || e.user.toLowerCase().includes(q) || e.tags.some((t) => t.toLowerCase().includes(q)));
    }
    return data;
  }, [iocData, typeFilter, tagFilter, researcherFilter, searchQuery]);

  const clearFilters = () => { setTypeFilter('all'); setTagFilter(null); setResearcherFilter(null); setSearchQuery(''); };
  const hasActiveFilters = typeFilter !== 'all' || tagFilter || researcherFilter || searchQuery;

  return (
    <div className="min-h-screen bg-base text-text-base font-sans pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 md:pt-8">
        
        {/* Page Header */}
        <div className="page-header">
          <div className="page-icon !bg-teal-500/10 !border-teal-500/20 !text-teal-500">
            <Rss className="w-5 h-5" />
          </div>
          <div>
            <h1>OSINT Threat Feed</h1>
            <p className="text-sm text-text-muted mt-0.5">Real-time IOCs from security researchers</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-2 floating-input py-2 px-3">
              <Calendar className="w-4 h-4 text-text-muted" />
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} max={toDate} className="bg-transparent border-none text-sm font-medium text-text-base outline-none cursor-pointer" />
              <span className="text-text-muted text-xs font-bold uppercase tracking-wider px-1">to</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} min={fromDate} max={new Date().toISOString().split('T')[0]} className="bg-transparent border-none text-sm font-medium text-text-base outline-none cursor-pointer" />
            </div>
            
            <button onClick={() => fetchData(fromDate, toDate)} className="btn-primary px-5 py-2 text-sm shrink-0">
              Apply Range
            </button>
            
            <div className="sm:ml-auto flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <Radio className="w-3.5 h-3.5 text-success animate-pulse" />
              <span>Updates every 15 min</span>
            </div>
          </div>

          {/* Stats Row — NO CARD */}
          {!isLoading && !error && (
            <>
              <div className="metric-row flex-wrap mb-6">
                <div className="metric-item">
                  <span className="metric-label">Total IOCs</span>
                  <span className="metric-value text-tertiary">{stats.total.toLocaleString()}</span>
                </div>
                {Object.entries(IOC_TYPE_CONFIG).map(([type, cfg]) => (
                  <div key={type} className="metric-item">
                    <span className="metric-label">{cfg.label}s</span>
                    <span className="metric-value" style={{ color: cfg.rawColor }}>{(stats.typeCounts[type] || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Analytics Charts — section panels */}
              <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Donut */}
                  <div className="section-panel">
                    <div className="section-panel-header"><h3>IOC Types</h3></div>
                    <div className="p-5 flex-1 flex flex-col items-center justify-center gap-6">
                      {(() => {
                        let currentPct = 0;
                        const gradients = Object.entries(IOC_TYPE_CONFIG).map(([type, cfg]) => {
                          const count = stats.typeCounts[type] || 0;
                          const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                          const start = currentPct; const end = currentPct + pct; currentPct = end;
                          return `${cfg.rawColor} ${start}% ${end}%`;
                        });
                        const conicString = gradients.length > 0 ? `conic-gradient(${gradients.join(', ')})` : 'conic-gradient(#b7c6d7 0% 100%)';
                        return (
                          <div className="relative w-32 h-32 rounded-full flex items-center justify-center" style={{ background: conicString }}>
                            <div className="w-[88px] h-[88px] bg-neutral rounded-full flex items-center justify-center flex-col">
                              <span className="text-xl font-bold text-text-base">{stats.total > 0 ? Object.keys(stats.typeCounts).length : 0}</span>
                              <span className="text-[9px] text-text-muted font-semibold uppercase tracking-wider">Types</span>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="flex flex-col gap-2 text-[11px] text-text-muted w-full px-4">
                        {Object.entries(IOC_TYPE_CONFIG).map(([type, cfg]) => {
                          const count = stats.typeCounts[type] || 0;
                          const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                          return (
                            <div key={type} className="flex items-center justify-between">
                              <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cfg.rawColor }}></div>{cfg.label}</span>
                              <span className="font-bold text-text-base">{pct.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="section-panel lg:col-span-2 flex flex-col">
                    <div className="section-panel-header">
                      <h3>{fromDate === toDate ? 'Hourly Activity' : 'Daily Activity'}</h3>
                      <span className="text-[10px] text-text-muted font-medium bg-surface px-2 py-0.5 rounded-md">per {fromDate === toDate ? '60 mins' : 'day'}</span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      {fromDate === toDate ? <HourlyChart hourCounts={stats.hourCounts} /> : <DailyChart dayCounts={stats.dayCounts} />}
                    </div>
                  </div>
                </div>

                {/* Top Tags — section panel */}
                <div className="section-panel">
                  <div className="section-panel-header"><h3>Top Threat Tags</h3></div>
                  <div className="p-5 overflow-y-auto max-h-[250px]">
                    {stats.topTags.length === 0 ? (
                      <p className="text-sm text-text-muted text-center py-6">No tagged IOCs in this period</p>
                    ) : (
                      <div className="space-y-3">
                        {stats.topTags.map(([tag, count]) => {
                          const maxCount = stats.topTags[0][1];
                          const barW = Math.max((count / maxCount) * 100, 2);
                          return (
                            <div key={tag} className="group">
                              <div className="flex items-center justify-between mb-1">
                                <button onClick={() => { setTagFilter(tag); setActiveTab('feed'); }} className="text-xs font-medium text-text-base hover:text-tertiary transition-colors uppercase tracking-wider">#{tag}</button>
                                <span className="text-sm font-bold text-text-base">{count}</span>
                              </div>
                              <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-400 to-tertiary rounded-full transition-all duration-700" style={{ width: `${barW}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-tertiary animate-spin" />
            <p className="text-text-muted font-medium text-sm">Fetching IOC intelligence...</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-8 text-center max-w-lg mx-auto">
            <AlertTriangle className="w-10 h-10 text-error mx-auto mb-4" />
            <p className="text-error font-medium mb-2 text-lg">Failed to load data</p>
            <p className="text-error/80 text-sm mb-6">{error}</p>
            <button onClick={() => fetchData(fromDate, toDate)} className="btn-primary !bg-error hover:!bg-error/90">Retry</button>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !error && (
          <div>
            {/* Tabs — underline */}
            <div className="flex border-b border-border mb-6">
              <button 
                onClick={() => setActiveTab('feed')}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'feed' ? 'border-tertiary text-tertiary' : 'border-transparent text-text-muted hover:text-text-base'}`}
              >
                Live Feed
              </button>
              <button 
                onClick={() => setActiveTab('researchers')}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'researchers' ? 'border-tertiary text-tertiary' : 'border-transparent text-text-muted hover:text-text-base'}`}
              >
                Researchers <span className="text-[10px] font-bold bg-surface px-1.5 py-0.5 rounded text-text-muted">{stats.topResearchers.length}</span>
              </button>
            </div>

            {/* Tab: Feed */}
            {activeTab === 'feed' && (
              <div>
                {/* Search + Filters — floating, no card */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="floating-input flex items-center gap-3 flex-1">
                    <Search className="w-4 h-4 text-text-muted shrink-0" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search IOCs, researchers, tags..." className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-text-muted text-text-base" />
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="text-text-muted hover:text-text-base p-1"><X className="w-4 h-4" /></button>}
                  </div>
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <Filter className="w-4 h-4 text-text-muted mr-1" />
                  <FilterChip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} label="All" count={stats.total} />
                  {Object.entries(IOC_TYPE_CONFIG).map(([type, cfg]) => (
                    <FilterChip key={type} active={typeFilter === type} onClick={() => setTypeFilter(type as IOCTypeFilter)} label={cfg.label} count={stats.typeCounts[type] || 0} />
                  ))}

                  {tagFilter && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-tertiary/10 text-tertiary border border-tertiary/20 rounded-md text-xs font-medium ml-2">
                      #{tagFilter}
                      <button onClick={() => setTagFilter(null)} className="hover:text-tertiary/70"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  )}
                  {researcherFilter && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-md text-xs font-medium ml-2">
                      @{researcherFilter}
                      <button onClick={() => setResearcherFilter(null)} className="hover:text-indigo-400"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  )}
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="ml-auto text-xs font-medium text-text-muted hover:text-error transition-colors">Clear all</button>
                  )}
                </div>

                {/* Table — section panel */}
                <div className="section-panel mb-6">
                  {filteredData.length === 0 ? (
                    <EmptyState message="No IOCs match your filters" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="clean-table">
                        <thead>
                          <tr>
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Value</th>
                            <th className="px-4 py-3">Researcher</th>
                            <th className="px-4 py-3">Tags</th>
                            <th className="px-4 py-3 text-right">Tweet</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((entry, i) => {
                            const cfg = IOC_TYPE_CONFIG[entry.type];
                            return (
                              <tr key={`${entry.value}-${i}`} className="cursor-pointer" onClick={() => setSelectedIOC(entry)}>
                                <td className="px-4 py-3 whitespace-nowrap text-xs">{timeAgo(entry.date)}</td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: cfg.rawColor }}>
                                    {cfg.icon} {cfg.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-text-base break-all min-w-[200px] text-xs">{defang(entry.value, entry.type)}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <button onClick={(e) => { e.stopPropagation(); setResearcherFilter(entry.user); setActiveTab('feed'); }} className="text-text-base hover:text-tertiary text-xs font-medium flex items-center gap-1">
                                    <Users className="w-3 h-3" /> @{entry.user}
                                  </button>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {entry.tags.slice(0, 2).map((tag) => (
                                      <button key={tag} onClick={(e) => { e.stopPropagation(); setTagFilter(tag.replace('#', '').toLowerCase()); setActiveTab('feed'); }} className={`badge text-[9px] hover:opacity-80 transition-opacity ${getTagColor(tag)}`}>
                                        {tag}
                                      </button>
                                    ))}
                                    {entry.tags.length > 2 && <span className="text-[10px] text-text-muted">+{entry.tags.length - 2}</span>}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <a href={entry.tweet} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex p-1 text-text-muted hover:text-tertiary transition-colors" title="View tweet">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {Math.ceil(filteredData.length / itemsPerPage) > 1 && (
                    <div className="px-5 py-3 border-t border-border flex justify-between items-center">
                      <div className="text-xs text-text-muted font-medium">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="pagination-btn">Previous</button>
                        <div className="pagination-current">{currentPage}</div>
                        <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredData.length / itemsPerPage), p + 1))} disabled={currentPage === Math.ceil(filteredData.length / itemsPerPage)} className="pagination-btn">Next</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Researchers */}
            {activeTab === 'researchers' && (
              <ResearchersGrid researchers={stats.researcherDetails} onUserClick={(u) => { setResearcherFilter(u); setActiveTab('feed'); }} />
            )}
          </div>
        )}

        {/* IOC Detail Modal */}
        {selectedIOC && <IOCDetailModal entry={selectedIOC} onClose={() => setSelectedIOC(null)} />}
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
function FilterChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border ${active ? 'bg-tertiary/10 text-tertiary border-tertiary/20' : 'text-text-muted bg-transparent border-border hover:bg-surface'}`}>
      {label}
      <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${active ? 'bg-tertiary/20 text-tertiary' : 'bg-surface text-text-muted'}`}>{count}</span>
    </button>
  );
}

function IOCDetailModal({ entry, onClose }: { entry: IOCEntry; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const cfg = IOC_TYPE_CONFIG[entry.type];

  const copyValue = async () => {
    try { await navigator.clipboard.writeText(entry.value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/30 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-neutral border border-border rounded-xl overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border flex items-center justify-center bg-neutral" style={{ borderColor: cfg.rawColor + '40', color: cfg.rawColor }}>
              {cfg?.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-base">{cfg?.label || entry.type.toUpperCase()} Indicator</h3>
              <p className="text-[11px] text-text-muted">IOC Details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-base rounded-md transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="metric-label mb-2 block">IOC Value (Defanged)</label>
            <div className="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3">
              <code className="flex-1 text-sm font-mono text-text-base break-all">{defang(entry.value, entry.type)}</code>
              <button onClick={copyValue} className="flex-shrink-0 p-2 rounded-md bg-neutral border border-border text-text-muted hover:text-tertiary transition-all" title="Copy raw value">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface p-3 rounded-lg border border-border">
              <label className="metric-label mb-1 block">Researcher</label>
              <span className="text-sm font-medium text-text-base flex items-center gap-1.5"><Users className="w-4 h-4 text-text-muted" /> @{entry.user}</span>
            </div>
            <div className="bg-surface p-3 rounded-lg border border-border">
              <label className="metric-label mb-1 block">Timestamp</label>
              <span className="text-sm font-medium text-text-base flex items-center gap-1.5"><Clock className="w-4 h-4 text-text-muted" /> {formatDateTime(entry.date)}</span>
            </div>
          </div>

          {entry.tags.length > 0 && (
            <div>
              <label className="metric-label mb-2 block">Associated Tags</label>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <span key={tag} className={`badge text-[10px] ${getTagColor(tag)}`}>{tag}</span>
                ))}
              </div>
            </div>
          )}
          
          <a href={entry.tweet} target="_blank" rel="noopener noreferrer" className="btn-primary w-full justify-center gap-2">
            View Original Tweet <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

function HourlyChart({ hourCounts }: { hourCounts: Record<number, number> }) {
  const maxCount = Math.max(...Object.values(hourCounts), 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="h-full flex relative pt-4">
      <div className="flex flex-col justify-between text-[10px] text-text-muted mr-2 py-2 w-8 text-right">
        <span>{maxCount}</span><span>{Math.floor(maxCount/2)}</span><span>0</span>
      </div>
      <div className="flex-1 flex items-end gap-1 pb-1 border-b border-l border-border pl-1 relative">
        <div className="absolute w-full top-0 border-t border-border border-dashed" />
        <div className="absolute w-full top-1/2 border-t border-border border-dashed" />
        {hours.map((h) => {
          const count = hourCounts[h] || 0;
          const height = count > 0 ? Math.max((count / maxCount) * 100, 2) : 0;
          return (
            <div key={h} className="flex-1 flex flex-col items-center justify-end group relative h-full">
              <div className="w-full bg-gradient-to-t from-[#3d82f6]/80 to-tertiary rounded-t-sm transition-all duration-300 hover:opacity-80" style={{ height: `${height}%` }} />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral border border-border text-text-base text-[10px] font-medium rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {h}:00 — <span className="text-tertiary">{count}</span> IOCs
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyChart({ dayCounts }: { dayCounts: Record<string, number> }) {
  const sortedDays = Object.entries(dayCounts).sort((a, b) => a[0].localeCompare(b[0]));
  if (sortedDays.length === 0) return <p className="text-sm text-text-muted text-center py-10">No timeline data</p>;
  const maxCount = Math.max(...sortedDays.map(([_, c]) => c), 1);

  return (
    <div className="h-full flex relative pt-4">
      <div className="flex flex-col justify-between text-[10px] text-text-muted mr-2 py-2 w-8 text-right">
        <span>{maxCount}</span><span>{Math.floor(maxCount/2)}</span><span>0</span>
      </div>
      <div className="flex-1 flex items-end gap-[2px] pb-1 border-b border-l border-border pl-1 relative">
        <div className="absolute w-full top-0 border-t border-border border-dashed" />
        <div className="absolute w-full top-1/2 border-t border-border border-dashed" />
        {sortedDays.map(([day, count]) => {
          const height = Math.max((count / maxCount) * 100, 2);
          return (
            <div key={day} className="flex-1 flex flex-col items-center justify-end group relative h-full">
              <div className="w-full bg-gradient-to-t from-[#3d82f6]/80 to-tertiary rounded-t-sm transition-all duration-300 hover:opacity-80" style={{ height: `${height}%` }} />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral border border-border text-text-base text-[10px] font-medium rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {day} — <span className="text-tertiary">{count}</span> IOCs
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResearchersGrid({ researchers, onUserClick }: { researchers: { user: string; count: number; tags: string[]; latest: string }[]; onUserClick: (u: string) => void }) {
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const filtered = researchers.filter((r) => r.user.toLowerCase().includes(filter.toLowerCase()));

  useEffect(() => { setCurrentPage(1); }, [filter]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter researchers..." className="w-full floating-input pl-10 pr-4 py-2 text-sm" />
        </div>
      </div>

      <div className="section-panel">
        <div className="overflow-x-auto">
          <table className="clean-table">
            <thead>
              <tr>
                <th className="px-4 py-3">Researcher</th>
                <th className="px-4 py-3">IOC Count</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3">Top Tags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((r) => (
                <tr key={r.user}>
                  <td className="px-4 py-3">
                    <button onClick={() => onUserClick(r.user)} className="flex items-center gap-2 group text-left">
                      <div className="w-7 h-7 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center text-xs font-bold border border-tertiary/20">
                        {r.user.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-text-base group-hover:text-tertiary transition-colors text-sm">@{r.user}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 font-bold text-tertiary text-sm">{r.count}</td>
                  <td className="px-4 py-3 text-xs">{timeAgo(r.latest)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.tags.map((t) => (
                        <span key={t} className="badge badge-low text-[9px]">#{t}</span>
                      ))}
                      {r.tags.length === 0 && <span className="text-[10px] text-text-muted italic">No tags</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-text-muted text-sm">No researchers matching &quot;{filter}&quot;</div>
          )}
        </div>

        {Math.ceil(filtered.length / itemsPerPage) > 1 && (
          <div className="px-5 py-3 border-t border-border flex justify-between items-center">
            <div className="text-xs text-text-muted font-medium">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="pagination-btn">Previous</button>
              <div className="pagination-current">{currentPage}</div>
              <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filtered.length / itemsPerPage), p + 1))} disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)} className="pagination-btn">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-text-muted">
      <Shield className="w-10 h-10 opacity-20" />
      <p className="font-medium text-sm">{message}</p>
    </div>
  );
}
