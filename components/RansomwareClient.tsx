"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Skull, Loader2, Search, TrendingUp, Users, Shield,
  Globe, Calendar, ChevronRight, AlertTriangle, Activity,
  Server, ExternalLink, Eye, Clock, BarChart3, Crosshair,
  X, ChevronDown, ChevronUp, Lock, Radio, FileText,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';

/* ─── Utility ─────────────────────────────────────────────────── */
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  try {
    const d = new Date(dateStr);
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}

const GROUP_COLORS = [
  'bg-red-500/10 text-red-500 border-red-500/20',
  'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'bg-green-500/10 text-green-600 border-green-500/20',
  'bg-teal-500/10 text-teal-600 border-teal-500/20',
  'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  'bg-violet-500/10 text-violet-600 border-violet-500/20',
  'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20',
  'bg-pink-500/10 text-pink-600 border-pink-500/20',
];
function getGroupColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
}

/* ─── Types ───────────────────────────────────────────────────── */
interface Victim {
  title: string;
  group: string;
  discovered: string | null;
  description: string;
  website: string | null;
}

interface HotGroup {
  group: string;
  count: number;
  last_post: string | null;
}

interface Stats {
  groups: number;
  groups_online: number;
  posts_total: number;
  posts_24h: number;
  posts_month: number;
  posts_month_label: string;
  posts_90d: number;
  posts_year: number;
  year: number;
  markets: number;
  parsers: number;
}

interface GroupDetail {
  name: string;
  locations: { slug: string; title: string; available: boolean; updated: string | null; type: string }[];
  meta: { captcha: boolean; parser: boolean; javascript_render: boolean; raas: boolean };
}

interface SearchResult {
  groups: any[];
  posts: Victim[];
  leaks: any[];
  notes: any[];
}

type TabKey = 'victims' | 'trending' | 'groups';

/* ─── Main Component ──────────────────────────────────────────── */
export default function RansomwareClient() {
  const [activeTab, setActiveTab] = useState<TabKey>('victims');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recentVictims, setRecentVictims] = useState<Victim[]>([]);
  const [hotGroups, setHotGroups] = useState<HotGroup[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [hotMeta, setHotMeta] = useState<{ days: number; total_posts: number; from_date: string | null }>({ days: 7, total_posts: 0, from_date: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsLoaded, setGroupsLoaded] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null);
  const [groupPosts, setGroupPosts] = useState<Victim[]>([]);
  const [groupDetailLoading, setGroupDetailLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ransomware?type=dashboard');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load dashboard');
      setRecentVictims(data.recent || []);
      setHotGroups(data.hot?.rows || []);
      setHotMeta({ days: data.hot?.days || 7, total_posts: data.hot?.total_posts || 0, from_date: data.hot?.from_date || null });
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ransomware data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroups = useCallback(async () => {
    if (groupsLoaded || groupsLoading) return;
    setGroupsLoading(true);
    try {
      const res = await fetch('/api/ransomware?type=groups');
      const data = await res.json();
      if (data.success) { setAllGroups(data.groups || []); setGroupsLoaded(true); }
    } catch (err) { console.error('Failed to load groups:', err); }
    finally { setGroupsLoading(false); }
  }, [groupsLoaded, groupsLoading]);

  useEffect(() => { if (activeTab === 'groups') fetchGroups(); }, [activeTab, fetchGroups]);

  const openGroupDetail = async (name: string) => {
    setGroupDetailLoading(true);
    setSelectedGroup(null);
    setGroupPosts([]);
    try {
      const res = await fetch(`/api/ransomware?type=group-detail&name=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (data.success) { setSelectedGroup(data.group); setGroupPosts(data.posts || []); }
    } catch (err) { console.error('Failed to load group detail:', err); }
    finally { setGroupDetailLoading(false); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || searchQuery.length < 2) return;
    setIsSearching(true);
    setSearchResults(null);
    try {
      const res = await fetch(`/api/ransomware?type=search&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) { setSearchResults(data.results); setShowSearch(true); }
    } catch (err) { console.error('Search failed:', err); }
    finally { setIsSearching(false); }
  };

  return (
    <div className="min-h-screen bg-base text-text-base font-sans pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 md:pt-8">
        
        {/* Page Header */}
        <div className="page-header">
          <div className="page-icon !bg-error/10 !border-error/20 !text-error">
            <Skull className="w-5 h-5" />
          </div>
          <div>
            <h1>Ransomware Threat Landscape</h1>
            <p className="text-sm text-text-muted mt-0.5">Live monitoring of ransomware group activities</p>
          </div>
        </div>

        {/* Inline Metrics — NO CARD */}
        {stats && !isLoading && (
          <div className="metric-row flex-wrap">
            <div className="metric-item">
              <span className="metric-label">Active Groups</span>
              <span className="metric-value text-tertiary">{stats.groups.toLocaleString()}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Total Victims</span>
              <span className="metric-value text-error">{stats.posts_total.toLocaleString()}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Last 24h</span>
              <span className="metric-value text-orange-500">{stats.posts_24h.toLocaleString()}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{stats.posts_month_label || 'This Month'}</span>
              <span className="metric-value text-success">{stats.posts_month.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Search — floating */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="relative">
            <div className="floating-input flex items-center gap-3">
              <Search className="w-4 h-4 text-text-muted shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search victims, groups, leaks..."
                className="flex-1 bg-transparent text-text-base placeholder:text-text-muted text-sm outline-none border-0"
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(''); setSearchResults(null); setShowSearch(false); }} className="p-1 text-text-muted hover:text-text-base transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button type="submit" disabled={isSearching || searchQuery.length < 2} className="px-4 py-1.5 text-xs font-medium text-tertiary border border-tertiary/20 rounded-md hover:bg-tertiary/10 disabled:opacity-50 transition-colors">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* Search Results */}
        {showSearch && searchResults && (
          <div className="mb-8 section-panel animate-fade-in-up">
            <div className="section-panel-header bg-surface">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-tertiary" />
                <span className="text-sm font-medium">Results for &quot;{searchQuery}&quot;</span>
                <span className="text-xs text-text-muted">({(searchResults.posts?.length || 0) + (searchResults.groups?.length || 0)})</span>
              </div>
              <button onClick={() => { setShowSearch(false); setSearchResults(null); setSearchQuery(''); }} className="text-text-muted hover:text-text-base transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {searchResults.posts && searchResults.posts.length > 0 && (
              <div className="p-5">
                <h4 className="metric-label mb-3 flex items-center gap-2"><Crosshair className="w-3.5 h-3.5" /> Victims ({searchResults.posts.length})</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {searchResults.posts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-surface transition-colors cursor-pointer" onClick={() => openGroupDetail(p.group)}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`badge text-[9px] ${getGroupColor(p.group)}`}>{p.group}</span>
                        <span className="text-sm font-medium text-text-base truncate">{p.title}</span>
                      </div>
                      <span className="text-xs text-text-muted whitespace-nowrap ml-3">{timeAgo(p.discovered)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.groups && searchResults.groups.length > 0 && (
              <div className="p-5 border-t border-border">
                <h4 className="metric-label mb-3 flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Groups ({searchResults.groups.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {searchResults.groups.map((g: any, i: number) => (
                    <button key={i} onClick={() => { openGroupDetail(g.name || g); setShowSearch(false); }} className="px-3 py-1.5 text-xs font-medium text-text-base border border-border rounded-md hover:border-tertiary hover:text-tertiary transition-colors">
                      {g.name || g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(!searchResults.posts || searchResults.posts.length === 0) && (!searchResults.groups || searchResults.groups.length === 0) && (
              <div className="p-10 text-center text-text-muted text-sm">No results found for &quot;{searchQuery}&quot;</div>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-error animate-spin" />
            <p className="text-text-muted font-medium text-sm">Loading ransomware intelligence...</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-8 text-center max-w-lg mx-auto">
            <AlertTriangle className="w-10 h-10 text-error mx-auto mb-4" />
            <p className="text-error font-medium mb-2 text-lg">Failed to load data</p>
            <p className="text-error/80 text-sm mb-6">{error}</p>
            <button onClick={fetchDashboard} className="btn-primary !bg-error hover:!bg-error/90">Retry</button>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !error && (
          <div>
            {/* Tab Navigation — underline style */}
            <div className="flex border-b border-border mb-6">
              {[
                { key: 'victims' as TabKey, label: 'Recent Victims', count: recentVictims.length },
                { key: 'trending' as TabKey, label: 'Trending Groups', count: hotGroups.length },
                { key: 'groups' as TabKey, label: 'Groups Directory' },
              ].map((tab) => (
                <button 
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-tertiary text-tertiary' : 'border-transparent text-text-muted hover:text-text-base'}`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-1.5 text-[10px] font-bold bg-surface px-1.5 py-0.5 rounded text-text-muted">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab: Recent Victims */}
            {activeTab === 'victims' && (
              <div className="section-panel">
                <div className="section-panel-header">
                  <div className="flex items-center gap-2 text-text-muted">
                    <Radio className="w-3.5 h-3.5 text-error animate-pulse" />
                    <span className="metric-label">Live feed — last 50 disclosed victims</span>
                  </div>
                </div>
                
                {recentVictims.length === 0 ? (
                  <EmptyState message="No recent victim data available" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="clean-table">
                      <thead>
                        <tr>
                          <th className="px-4 py-3">Time</th>
                          <th className="px-4 py-3">Group</th>
                          <th className="px-4 py-3">Victim</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3 text-right">Website</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentVictims.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((v, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 whitespace-nowrap text-xs">{timeAgo(v.discovered)}</td>
                            <td className="px-4 py-3">
                              <button onClick={(e) => { e.stopPropagation(); openGroupDetail(v.group); }} className={`badge text-[9px] hover:opacity-80 transition-opacity ${getGroupColor(v.group)}`}>
                                {v.group}
                              </button>
                            </td>
                            <td className="px-4 py-3 font-medium text-text-base text-sm">{v.title}</td>
                            <td className="px-4 py-3 max-w-[250px] truncate text-xs" title={v.description}>{v.description || '-'}</td>
                            <td className="px-4 py-3 text-right">
                              {v.website ? (
                                <a href={v.website.startsWith('http') ? v.website : `https://${v.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex p-1 text-text-muted hover:text-tertiary transition-colors" title={v.website}>
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {Math.ceil(recentVictims.length / itemsPerPage) > 1 && (
                  <div className="px-5 py-3 border-t border-border flex justify-between items-center">
                    <div className="text-xs text-text-muted font-medium">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, recentVictims.length)} of {recentVictims.length}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="pagination-btn">Previous</button>
                      <div className="pagination-current">{currentPage}</div>
                      <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(recentVictims.length / itemsPerPage)))} disabled={currentPage === Math.ceil(recentVictims.length / itemsPerPage)} className="pagination-btn">Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Trending Groups */}
            {activeTab === 'trending' && (
              <div className="section-panel">
                <div className="section-panel-header">
                  <div className="flex items-center gap-2 text-text-muted">
                    <Activity className="w-3.5 h-3.5 text-tertiary" />
                    <span className="metric-label">Ranked by activity — last {hotMeta.days} days • {hotMeta.total_posts} posts</span>
                  </div>
                </div>
                
                {hotGroups.length === 0 ? (
                  <EmptyState message="No trending group data available" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="clean-table">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 w-16 text-center">Rank</th>
                          <th className="px-4 py-3">Group</th>
                          <th className="px-4 py-3">Last Post</th>
                          <th className="px-4 py-3">Victims</th>
                          <th className="px-4 py-3 w-48">Activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hotGroups.map((hg, i) => {
                          const maxCount = hotGroups[0]?.count || 1;
                          const barWidth = Math.max((hg.count / maxCount) * 100, 2);
                          return (
                            <tr key={hg.group} className="cursor-pointer" onClick={() => openGroupDetail(hg.group)}>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${
                                  i === 0 ? 'bg-amber-500/15 text-amber-600' :
                                  i === 1 ? 'bg-surface text-text-base' :
                                  i === 2 ? 'bg-orange-500/15 text-orange-600' :
                                  'text-text-muted'
                                }`}>{i + 1}</span>
                              </td>
                              <td className="px-4 py-3 font-medium text-tertiary hover:underline text-sm">{hg.group}</td>
                              <td className="px-4 py-3 text-xs">{timeAgo(hg.last_post)}</td>
                              <td className="px-4 py-3 font-bold text-text-base text-sm">{hg.count}</td>
                              <td className="px-4 py-3">
                                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                                  <div className="h-full bg-tertiary rounded-full transition-all duration-700" style={{ width: `${barWidth}%` }} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Groups Directory */}
            {activeTab === 'groups' && (
              <div>
                {groupsLoading ? (
                  <div className="flex items-center justify-center py-20 gap-3">
                    <Loader2 className="w-6 h-6 text-tertiary animate-spin" />
                    <span className="text-text-muted text-sm font-medium">Loading groups directory...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-text-muted mb-4">
                      <Server className="w-3.5 h-3.5 text-tertiary" />
                      <span className="metric-label">{allGroups.length} ransomware groups tracked</span>
                    </div>
                    <GroupsGrid groups={allGroups} onGroupClick={(name) => openGroupDetail(name)} />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Group Detail Modal */}
        {(selectedGroup || groupDetailLoading) && (
          <GroupDetailModal
            group={selectedGroup}
            posts={groupPosts}
            loading={groupDetailLoading}
            onClose={() => { setSelectedGroup(null); setGroupPosts([]); }}
          />
        )}
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
function GroupsGrid({ groups, onGroupClick }: { groups: any[]; onGroupClick: (name: string) => void }) {
  const [filter, setFilter] = useState('');
  const filtered = groups.filter(g => (g.name || '').toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter groups..."
          className="w-full floating-input pl-10 pr-4 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {filtered.map((g: any, i: number) => (
          <button
            key={i}
            onClick={() => onGroupClick(g.name)}
            className="px-4 py-3 rounded-lg text-left hover:bg-surface border border-transparent hover:border-border transition-all duration-200 group"
          >
            <div className="flex items-center gap-2">
              <Skull className="w-3.5 h-3.5 text-text-muted group-hover:text-error transition-colors" />
              <span className="text-xs font-medium text-text-base group-hover:text-tertiary transition-colors truncate">{g.name}</span>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-muted text-sm">No groups matching &quot;{filter}&quot;</div>
      )}
    </div>
  );
}

function GroupDetailModal({ group, posts, loading, onClose }: { group: GroupDetail | null; posts: Victim[]; loading: boolean; onClose: () => void }) {
  const [showAllPosts, setShowAllPosts] = useState(false);
  const displayedPosts = showAllPosts ? posts : posts.slice(0, 5);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/30 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-neutral border border-border rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-error/20 bg-error/10 flex items-center justify-center">
              <Skull className="w-4 h-4 text-error" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-base">{loading ? 'Loading...' : group?.name || 'Group Detail'}</h3>
              <p className="text-[11px] text-text-muted">Ransomware Group Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-base rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 text-tertiary animate-spin" />
              <span className="text-text-muted text-sm font-medium">Fetching group intelligence...</span>
            </div>
          ) : group ? (
            <>
              {/* Meta badges */}
              <div className="flex flex-wrap gap-2">
                {group.meta.raas && <span className="badge badge-medium">💰 RaaS</span>}
                {group.meta.captcha && <span className="badge badge-high"><Lock className="w-3 h-3" /> Captcha</span>}
                {group.meta.javascript_render && <span className="badge badge-low">JS Render</span>}
              </div>

              {/* Locations */}
              {group.locations.length > 0 && (
                <div>
                  <h4 className="metric-label mb-3 flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Mirrors ({group.locations.length})</h4>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="clean-table">
                      <tbody>
                        {group.locations.map((loc, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 w-8"><div className={`w-2 h-2 rounded-full ${loc.available ? 'bg-success' : 'bg-error'}`} /></td>
                            <td className="px-4 py-2 font-medium text-text-base break-all text-xs">{loc.slug}</td>
                            <td className="px-4 py-2 text-xs">{loc.title || '-'}</td>
                            <td className="px-4 py-2 text-right">
                              <span className={`badge text-[9px] ${loc.available ? 'badge-success' : 'badge-danger'}`}>{loc.available ? 'Online' : 'Offline'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent Posts */}
              {posts.length > 0 && (
                <div>
                  <h4 className="metric-label mb-3 flex items-center gap-2"><Crosshair className="w-3.5 h-3.5" /> Recent Victims ({posts.length})</h4>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="clean-table">
                      <tbody>
                        {displayedPosts.map((p, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2.5 font-medium text-text-base flex items-center gap-2 text-sm">
                              <Crosshair className="w-3 h-3 text-error shrink-0" />{p.title}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-right whitespace-nowrap">{timeAgo(p.discovered)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {posts.length > 5 && (
                    <button onClick={() => setShowAllPosts(!showAllPosts)} className="mt-3 text-xs font-medium text-tertiary hover:underline flex items-center gap-1.5 justify-center w-full py-2">
                      {showAllPosts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {showAllPosts ? 'Show less' : `Show all ${posts.length} victims`}
                    </button>
                  )}
                </div>
              )}

              {posts.length === 0 && group.locations.length === 0 && (
                <div className="text-center py-10 text-text-muted text-sm">No detailed information available.</div>
              )}
            </>
          ) : null}
        </div>
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
