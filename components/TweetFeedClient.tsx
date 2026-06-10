"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Rss, Loader2, Search, TrendingUp, Users, Shield,
  Globe, Calendar, ChevronRight, ChevronLeft, AlertTriangle, Activity,
  ExternalLink, Clock, BarChart3, Link2, Hash, X,
  Copy, Check, Filter, Radio, FileText, Cpu, Eye,
  ArrowUpRight, Zap, Target
} from 'lucide-react';

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
const IOC_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  url:    { label: 'URL',    color: 'text-blue-400',    bgColor: 'bg-blue-500/10 border-blue-500/20',    icon: <Link2 className="w-3.5 h-3.5" /> },
  domain: { label: 'Domain', color: 'text-cyan-400',    bgColor: 'bg-cyan-500/10 border-cyan-500/20',    icon: <Globe className="w-3.5 h-3.5" /> },
  ip:     { label: 'IP',     color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20', icon: <Target className="w-3.5 h-3.5" /> },
  sha256: { label: 'SHA256', color: 'text-amber-400',   bgColor: 'bg-amber-500/10 border-amber-500/20',  icon: <FileText className="w-3.5 h-3.5" /> },
  md5:    { label: 'MD5',    color: 'text-orange-400',  bgColor: 'bg-orange-500/10 border-orange-500/20', icon: <Hash className="w-3.5 h-3.5" /> },
};

const TAG_COLORS = [
  'bg-red-500/15 text-red-400 border-red-500/25',
  'bg-violet-500/15 text-violet-400 border-violet-500/25',
  'bg-pink-500/15 text-pink-400 border-pink-500/25',
  'bg-amber-500/15 text-amber-400 border-amber-500/25',
  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  'bg-teal-500/15 text-teal-400 border-teal-500/25',
  'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/25',
  'bg-rose-500/15 text-rose-400 border-rose-500/25',
  'bg-sky-500/15 text-sky-400 border-sky-500/25',
  'bg-lime-500/15 text-lime-400 border-lime-500/25',
  'bg-purple-500/15 text-purple-400 border-purple-500/25',
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

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<IOCTypeFilter>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [researcherFilter, setResearcherFilter] = useState<string | null>(null);

  // Detail modal
  const [selectedIOC, setSelectedIOC] = useState<IOCEntry | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, tagFilter, researcherFilter, searchQuery]);

  // ─── Fetch data ─────
  const fetchData = useCallback(async (from: string, to: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentPage(1);
    try {
      const res = await fetch(`/api/tweetfeed?from=${from}&to=${to}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load data');
      // Sort by date descending
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

  useEffect(() => {
    fetchData(fromDate, toDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run on mount

  // ─── Computed / Aggregated ─────
  const stats = useMemo(() => {
    const typeCounts: Record<string, number> = { url: 0, domain: 0, ip: 0, sha256: 0, md5: 0 };
    const tagCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    const userTags: Record<string, Record<string, number>> = {};
    const userLatest: Record<string, string> = {};
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<string, number> = {};

    iocData.forEach((entry) => {
      // Type counts
      typeCounts[entry.type] = (typeCounts[entry.type] || 0) + 1;

      // Tag counts
      entry.tags.forEach((tag) => {
        const clean = tag.replace('#', '').toLowerCase();
        tagCounts[clean] = (tagCounts[clean] || 0) + 1;
      });

      // User counts and metadata
      userCounts[entry.user] = (userCounts[entry.user] || 0) + 1;
      if (!userTags[entry.user]) userTags[entry.user] = {};
      entry.tags.forEach((tag) => {
        const clean = tag.replace('#', '').toLowerCase();
        userTags[entry.user][clean] = (userTags[entry.user][clean] || 0) + 1;
      });
      if (!userLatest[entry.user] || entry.date > userLatest[entry.user]) {
        userLatest[entry.user] = entry.date;
      }

      // Timeline
      try {
        let d = new Date(entry.date);
        if (isNaN(d.getTime())) {
          d = new Date(entry.date.replace(' ', 'T') + 'Z');
        }
        if (!isNaN(d.getTime())) {
          hourCounts[d.getUTCHours()] = (hourCounts[d.getUTCHours()] || 0) + 1;
          const dayKey = d.toISOString().split('T')[0];
          dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;
        }
      } catch {}
    });

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    const topResearchers = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1]);

    const researcherDetails = topResearchers.map(([user, count]) => ({
      user,
      count,
      tags: Object.entries(userTags[user] || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t),
      latest: userLatest[user] || '',
    }));

    return { typeCounts, tagCounts, topTags, topResearchers, researcherDetails, hourCounts, dayCounts, total: iocData.length };
  }, [iocData]);

  // ─── Filtered data ─────
  const filteredData = useMemo(() => {
    let data = iocData;
    if (typeFilter !== 'all') {
      data = data.filter((e) => e.type === typeFilter);
    }
    if (tagFilter) {
      data = data.filter((e) => e.tags.some((t) => t.replace('#', '').toLowerCase() === tagFilter));
    }
    if (researcherFilter) {
      data = data.filter((e) => e.user === researcherFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      data = data.filter((e) =>
        e.value.toLowerCase().includes(q) ||
        e.user.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return data;
  }, [iocData, typeFilter, tagFilter, researcherFilter, searchQuery]);

  const clearFilters = () => {
    setTypeFilter('all');
    setTagFilter(null);
    setResearcherFilter(null);
    setSearchQuery('');
  };

  const hasActiveFilters = typeFilter !== 'all' || tagFilter || researcherFilter || searchQuery;

  /* ─── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-base pt-20 md:pt-6 pb-10 px-4 md:px-8">
      {/* Page Title */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Rss className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-base tracking-tight">TweetFeed IOC</h1>
            <p className="text-sm text-text-muted">Real-time IOC feeds from Twitter/X researchers — powered by TweetFeed.live</p>
          </div>
        </div>
      </div>

      {/* ─── Period Selector + Stats ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto mb-6">
        {/* Date Range Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-2 bg-surface border border-gray-200 rounded-lg p-1">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Calendar className="w-4 h-4 text-text-muted" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate}
                className="bg-transparent border-none text-sm text-text-base outline-none cursor-pointer"
              />
            </div>
            <div className="text-text-muted text-xs font-medium">to</div>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate}
                max={new Date().toISOString().split('T')[0]}
                className="bg-transparent border-none text-sm text-text-base outline-none cursor-pointer"
              />
            </div>
          </div>
          
          <button 
            onClick={() => fetchData(fromDate, toDate)}
            className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium hover:bg-cyan-500/20 transition-colors"
          >
            Apply Range
          </button>
          
          <div className="sm:ml-auto flex items-center gap-2 text-xs text-text-muted">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Updates every 15 min</span>
          </div>
        </div>

        {/* Stats Cards & Analytics */}
        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <StatCard
                icon={<Zap className="w-4 h-4" />}
                label="Total IOCs"
                value={stats.total.toLocaleString()}
                accent="text-cyan-400"
                bgAccent="bg-cyan-500/10 border-cyan-500/20"
              />
              {Object.entries(IOC_TYPE_CONFIG).map(([type, cfg]) => (
                <StatCard
                  key={type}
                  icon={cfg.icon}
                  label={cfg.label}
                  value={(stats.typeCounts[type] || 0).toLocaleString()}
                  accent={cfg.color}
                  bgAccent={cfg.bgColor}
                />
              ))}
            </div>

            {/* Analytics Charts */}
            <div className="space-y-6">
              {/* IOC Type Distribution */}
              <div className="bg-surface border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    IOC Type Distribution
                  </h3>
                </div>
                <div className="p-5 space-y-3">
                  {Object.entries(IOC_TYPE_CONFIG).map(([type, cfg]) => {
                    const count = stats.typeCounts[type] || 0;
                    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={type} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={cfg.color}>{cfg.icon}</span>
                            <span className="text-sm font-medium text-text-base">{cfg.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-text-base">{count.toLocaleString()}</span>
                            <span className="text-xs text-text-muted">({pct.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              type === 'url' ? 'bg-blue-400' :
                              type === 'domain' ? 'bg-cyan-400' :
                              type === 'ip' ? 'bg-emerald-400' :
                              type === 'sha256' ? 'bg-amber-400' : 'bg-orange-400'
                            }`}
                            style={{ width: `${Math.max(pct, 0.5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Two columns: Top Tags + Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Tags */}
                <div className="bg-surface border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-text-base flex items-center gap-2">
                      <Hash className="w-4 h-4 text-violet-400" />
                      Top Threat Tags
                    </h3>
                  </div>
                  <div className="p-5 max-h-[260px] overflow-y-auto custom-scrollbar">
                    {stats.topTags.length === 0 ? (
                      <p className="text-sm text-text-muted text-center py-4">No tagged IOCs in this period</p>
                    ) : (
                      <div className="space-y-2.5">
                        {stats.topTags.map(([tag, count], i) => {
                          const maxCount = stats.topTags[0][1];
                          const barW = Math.max((count / maxCount) * 100, 4);
                          return (
                            <button
                              key={tag}
                              onClick={() => { setTagFilter(tag); setActiveTab('feed'); }}
                              className="w-full flex items-center gap-3 group text-left hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                            >
                              <span className="text-xs text-text-muted w-5 text-right font-mono">{i + 1}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getTagColor('#' + tag)}`}>
                                #{tag}
                              </span>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${barW}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-text-base min-w-[2.5rem] text-right">{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="bg-surface border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-text-base flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      {fromDate === toDate ? 'Hourly Activity (UTC)' : 'Daily Activity'}
                    </h3>
                  </div>
                  <div className="p-5">
                    {fromDate === toDate ? (
                      <HourlyChart hourCounts={stats.hourCounts} />
                    ) : (
                      <DailyChart dayCounts={stats.dayCounts} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Loading State ─────────────────────────────────────── */}
      {isLoading && (
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full animate-pulse" />
            </div>
            <p className="text-text-muted text-sm">Fetching IOC intelligence...</p>
          </div>
        </div>
      )}

      {/* ─── Error State ───────────────────────────────────────── */}
      {error && !isLoading && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-medium mb-1">Failed to load data</p>
            <p className="text-text-muted text-sm mb-4">{error}</p>
            <button onClick={() => fetchData(fromDate, toDate)} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Content ─────────────────────────────────────── */}
      {!isLoading && !error && (
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-surface border border-gray-200 rounded-xl p-1 mb-6">
            <TabButton active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} icon={<Rss className="w-4 h-4" />} label="Live Feed" count={filteredData.length} />
            <TabButton active={activeTab === 'researchers'} onClick={() => setActiveTab('researchers')} icon={<Users className="w-4 h-4" />} label="Researchers" count={stats.topResearchers.length} />
          </div>

          {/* ═══ Tab: Live Feed ═══ */}
          {activeTab === 'feed' && (
            <div>
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search IOCs, researchers, tags..."
                    className="w-full bg-surface border border-gray-200 rounded-lg text-sm text-text-base placeholder-text-muted pl-10 pr-4 py-2.5 outline-none focus:border-cyan-500/50 transition-colors"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Type Filter Chips */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-text-muted" />
                <FilterChip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} label="All" count={stats.total} />
                {Object.entries(IOC_TYPE_CONFIG).map(([type, cfg]) => (
                  <FilterChip
                    key={type}
                    active={typeFilter === type}
                    onClick={() => setTypeFilter(type as IOCTypeFilter)}
                    label={cfg.label}
                    count={stats.typeCounts[type] || 0}
                  />
                ))}

                {/* Active tag/researcher filter badges */}
                {tagFilter && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full text-xs font-medium">
                    #{tagFilter}
                    <button onClick={() => setTagFilter(null)} className="hover:text-violet-300"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {researcherFilter && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium">
                    @{researcherFilter}
                    <button onClick={() => setResearcherFilter(null)} className="hover:text-emerald-300"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="ml-auto text-xs text-text-muted hover:text-red-400 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* IOC Feed List */}
              {filteredData.length === 0 ? (
                <EmptyState message="No IOCs match your filters" />
              ) : (
                <>
                  <div className="space-y-2">
                    {filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((entry, i) => (
                      <IOCRow
                        key={`${entry.value}-${i}`}
                        entry={entry}
                        onTagClick={(t) => { setTagFilter(t); setActiveTab('feed'); }}
                        onUserClick={(u) => { setResearcherFilter(u); setActiveTab('feed'); }}
                        onClick={() => setSelectedIOC(entry)}
                      />
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {Math.ceil(filteredData.length / itemsPerPage) > 1 && (
                    <div className="flex items-center justify-between mt-6 bg-surface border border-gray-200 rounded-xl px-4 py-3">
                      <div className="text-sm text-text-muted hidden sm:block">
                        Showing <span className="font-medium text-text-base">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-text-base">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="font-medium text-text-base">{filteredData.length}</span> results
                      </div>
                      
                      <div className="flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-end">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-gray-200 text-text-muted hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-1 px-2">
                          {Array.from({ length: Math.min(5, Math.ceil(filteredData.length / itemsPerPage)) }, (_, i) => {
                            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
                            let pageNum = currentPage;
                            if (currentPage <= 3) pageNum = i + 1;
                            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = currentPage - 2 + i;
                            
                            if (pageNum < 1 || pageNum > totalPages) return null;
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                  currentPage === pageNum 
                                    ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30' 
                                    : 'text-text-muted hover:bg-gray-100 border border-transparent'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredData.length / itemsPerPage), p + 1))}
                          disabled={currentPage === Math.ceil(filteredData.length / itemsPerPage)}
                          className="p-2 rounded-lg border border-gray-200 text-text-muted hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}


          {/* ═══ Tab: Researchers ═══ */}
          {activeTab === 'researchers' && (
            <ResearchersGrid
              researchers={stats.researcherDetails}
              onUserClick={(u) => { setResearcherFilter(u); setActiveTab('feed'); }}
            />
          )}
        </div>
      )}

      {/* ─── IOC Detail Modal ────────────────────────────────────── */}
      {selectedIOC && (
        <IOCDetailModal entry={selectedIOC} onClose={() => setSelectedIOC(null)} />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  Sub-Components                                                 */
/* ════════════════════════════════════════════════════════════════ */

function StatCard({ icon, label, value, accent, bgAccent }: { icon: React.ReactNode; label: string; value: string | number; accent: string; bgAccent: string }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${bgAccent}`}>
      <div className={`${accent}`}>{icon}</div>
      <div>
        <div className={`text-xl font-bold ${accent}`}>{value}</div>
        <div className="text-xs text-text-muted">{label}</div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
          : 'text-text-muted hover:text-text-base hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {count !== undefined && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-cyan-500/20 text-cyan-500' : 'bg-gray-200 text-text-muted'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function FilterChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
        active
          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
          : 'text-text-muted hover:text-text-base bg-gray-50 border border-gray-200 hover:border-gray-300'
      }`}
    >
      {label}
      <span className={`ml-1 ${active ? 'text-cyan-500' : 'text-text-muted/60'}`}>
        {count}
      </span>
    </button>
  );
}

function IOCRow({ entry, onTagClick, onUserClick, onClick }: {
  entry: IOCEntry;
  onTagClick: (tag: string) => void;
  onUserClick: (user: string) => void;
  onClick: () => void;
}) {
  const cfg = IOC_TYPE_CONFIG[entry.type];
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 bg-surface border border-gray-200 rounded-xl px-4 py-3 hover:border-cyan-500/30 transition-all duration-200 cursor-pointer"
    >
      {/* Type Badge */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${cfg?.bgColor || 'bg-gray-100 border-gray-200'} group-hover:scale-105 transition-transform`}>
        <span className={cfg?.color || 'text-text-muted'}>{cfg?.icon}</span>
      </div>

      {/* Value */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-text-base truncate">{defang(entry.value, entry.type)}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {entry.tags.slice(0, 3).map((tag) => (
            <button
              key={tag}
              onClick={(e) => { e.stopPropagation(); onTagClick(tag.replace('#', '').toLowerCase()); }}
              className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium hover:opacity-80 transition-opacity ${getTagColor(tag)}`}
            >
              {tag}
            </button>
          ))}
          {entry.tags.length > 3 && (
            <span className="text-[10px] text-text-muted">+{entry.tags.length - 3}</span>
          )}
        </div>
      </div>

      {/* Researcher */}
      <button
        onClick={(e) => { e.stopPropagation(); onUserClick(entry.user); }}
        className="hidden md:flex items-center gap-1 text-xs text-text-muted hover:text-cyan-400 transition-colors whitespace-nowrap"
      >
        <Users className="w-3 h-3" />
        @{entry.user}
      </button>

      {/* Tweet Link */}
      <a
        href={entry.tweet}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 p-1.5 text-text-muted hover:text-cyan-400 transition-colors"
        title="View original tweet"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>

      {/* Time */}
      <div className="flex items-center gap-1 text-xs text-text-muted whitespace-nowrap">
        <Clock className="w-3 h-3" />
        {timeAgo(entry.date)}
      </div>
    </div>
  );
}

function IOCDetailModal({ entry, onClose }: { entry: IOCEntry; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const cfg = IOC_TYPE_CONFIG[entry.type];

  const copyValue = async () => {
    try {
      await navigator.clipboard.writeText(entry.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-cyan-500/5 to-blue-500/5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${cfg?.bgColor}`}>
              <span className={cfg?.color}>{cfg?.icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-base">{cfg?.label || entry.type.toUpperCase()} IOC</h3>
              <p className="text-xs text-text-muted">Indicator of Compromise Detail</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-base hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* IOC Value */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">IOC Value (Defanged)</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <code className="flex-1 text-sm font-mono text-text-base break-all">{defang(entry.value, entry.type)}</code>
              <button
                onClick={copyValue}
                className="flex-shrink-0 p-2 text-text-muted hover:text-cyan-400 transition-colors"
                title="Copy raw value"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Type</label>
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-lg border ${cfg?.bgColor} ${cfg?.color}`}>
                {cfg?.icon} {cfg?.label}
              </span>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Researcher</label>
              <span className="text-sm font-medium text-text-base">@{entry.user}</span>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Timestamp</label>
              <span className="text-sm text-text-base">{formatDateTime(entry.date)}</span>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Source</label>
              <a
                href={entry.tweet}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View Tweet <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div>
              <label className="text-xs text-text-muted mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <span key={tag} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getTagColor(tag)}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HourlyChart({ hourCounts }: { hourCounts: Record<number, number> }) {
  const maxCount = Math.max(...Object.values(hourCounts), 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div>
      <div className="flex items-end gap-[3px] h-[220px]">
        {hours.map((h) => {
          const count = hourCounts[h] || 0;
          const height = count > 0 ? Math.max((count / maxCount) * 100, 4) : 2;
          return (
            <div key={h} className="flex-1 flex flex-col items-center justify-end group relative h-full">
              <div
                className={`w-full rounded-t transition-all duration-300 ${count > 0 ? 'bg-cyan-400 group-hover:bg-cyan-300' : 'bg-gray-200'}`}
                style={{ height: `${height}%` }}
              />
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {h}:00 — {count} IOCs
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-text-muted">
        <span>0:00</span>
        <span>6:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}

function DailyChart({ dayCounts }: { dayCounts: Record<string, number> }) {
  const sortedDays = Object.entries(dayCounts).sort((a, b) => a[0].localeCompare(b[0]));
  if (sortedDays.length === 0) return <p className="text-sm text-text-muted text-center py-4">No timeline data</p>;

  const maxCount = Math.max(...sortedDays.map(([_, c]) => c), 1);

  return (
    <div>
      <div className="flex items-end gap-[2px] h-[220px]">
        {sortedDays.map(([day, count]) => {
          const height = Math.max((count / maxCount) * 100, 4);
          return (
            <div key={day} className="flex-1 flex flex-col items-center justify-end group relative h-full">
              <div
                className="w-full rounded-t bg-cyan-400 group-hover:bg-cyan-300 transition-all duration-300"
                style={{ height: `${height}%` }}
              />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {day} — {count} IOCs
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-text-muted">
        <span>{sortedDays[0]?.[0]?.slice(5) || ''}</span>
        <span>{sortedDays[sortedDays.length - 1]?.[0]?.slice(5) || ''}</span>
      </div>
    </div>
  );
}

function ResearchersGrid({ researchers, onUserClick }: {
  researchers: { user: string; count: number; tags: string[]; latest: string }[];
  onUserClick: (u: string) => void;
}) {
  const [filter, setFilter] = useState('');
  const filtered = researchers.filter((r) => r.user.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      {/* Filter */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter researchers..."
          className="w-full bg-surface border border-gray-200 rounded-lg text-sm text-text-base placeholder-text-muted pl-10 pr-4 py-2.5 outline-none focus:border-cyan-500/50 transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
        <Users className="w-3.5 h-3.5 text-cyan-400" />
        <span>{filtered.length} researchers contributing IOCs</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((r) => (
          <button
            key={r.user}
            onClick={() => onUserClick(r.user)}
            className="bg-surface border border-gray-200 rounded-xl px-4 py-4 text-left hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {r.user.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-text-base group-hover:text-cyan-400 transition-colors truncate">@{r.user}</div>
                <div className="text-xs text-text-muted">{timeAgo(r.latest)}</div>
              </div>
              <span className="ml-auto text-lg font-bold text-cyan-400">{r.count}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {r.tags.map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-text-muted rounded-full">
                  #{t}
                </span>
              ))}
              {r.tags.length === 0 && (
                <span className="text-[10px] text-text-muted italic">No tags</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-text-muted text-sm">
          No researchers matching &quot;{filter}&quot;
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
      <Shield className="w-10 h-10 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
