"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Skull, Loader2, Search, TrendingUp, Users, Shield,
  Globe, Calendar, ChevronRight, AlertTriangle, Activity,
  Server, ExternalLink, Eye, Clock, BarChart3, Crosshair,
  X, ChevronDown, ChevronUp, Lock, Radio
} from 'lucide-react';

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

// Assign a consistent color to group names
const GROUP_COLORS = [
  'bg-red-500/20 text-red-400 border-red-500/30',
  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'bg-lime-500/20 text-lime-400 border-lime-500/30',
  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'bg-teal-500/20 text-teal-400 border-teal-500/30',
  'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'bg-sky-500/20 text-sky-400 border-sky-500/30',
  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
  'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'bg-rose-500/20 text-rose-400 border-rose-500/30',
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

  // Dashboard data
  const [recentVictims, setRecentVictims] = useState<Victim[]>([]);
  const [hotGroups, setHotGroups] = useState<HotGroup[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [hotMeta, setHotMeta] = useState<{ days: number; total_posts: number; from_date: string | null }>({ days: 7, total_posts: 0, from_date: null });

  // Groups directory
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsLoaded, setGroupsLoaded] = useState(false);

  // Group detail panel
  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null);
  const [groupPosts, setGroupPosts] = useState<Victim[]>([]);
  const [groupDetailLoading, setGroupDetailLoading] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // ─── Load Dashboard ─────
  useEffect(() => {
    fetchDashboard();
  }, []);

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

  // ─── Load Groups (lazy) ─────
  const fetchGroups = useCallback(async () => {
    if (groupsLoaded || groupsLoading) return;
    setGroupsLoading(true);
    try {
      const res = await fetch('/api/ransomware?type=groups');
      const data = await res.json();
      if (data.success) {
        setAllGroups(data.groups || []);
        setGroupsLoaded(true);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setGroupsLoading(false);
    }
  }, [groupsLoaded, groupsLoading]);

  useEffect(() => {
    if (activeTab === 'groups') fetchGroups();
  }, [activeTab, fetchGroups]);

  // ─── Group Detail ─────
  const openGroupDetail = async (name: string) => {
    setGroupDetailLoading(true);
    setSelectedGroup(null);
    setGroupPosts([]);
    try {
      const res = await fetch(`/api/ransomware?type=group-detail&name=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (data.success) {
        setSelectedGroup(data.group);
        setGroupPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Failed to load group detail:', err);
    } finally {
      setGroupDetailLoading(false);
    }
  };

  // ─── Search ─────
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || searchQuery.length < 2) return;
    setIsSearching(true);
    setSearchResults(null);
    try {
      const res = await fetch(`/api/ransomware?type=search&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results);
        setShowSearch(true);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  /* ─── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-base pt-20 md:pt-6 pb-10 px-4 md:px-8">
      {/* Page Title */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20">
            <Skull className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-base tracking-tight">Ransomware Tracker</h1>
            <p className="text-sm text-text-muted">Global ransomware activity intelligence — powered by RansomLook & Ransomware.live</p>
          </div>
        </div>
      </div>

      {/* ─── Stats Bar ─────────────────────────────────────────── */}
      {stats && !isLoading && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<Users className="w-4 h-4" />} label="Active Groups" value={stats.groups} accent="text-violet-400" bgAccent="bg-violet-500/10 border-violet-500/20" />
            <StatCard icon={<Crosshair className="w-4 h-4" />} label="Total Victims" value={stats.posts_total.toLocaleString()} accent="text-red-400" bgAccent="bg-red-500/10 border-red-500/20" />
            <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Last 24h" value={stats.posts_24h} accent="text-amber-400" bgAccent="bg-amber-500/10 border-amber-500/20" />
            <StatCard icon={<BarChart3 className="w-4 h-4" />} label={stats.posts_month_label || 'This Month'} value={stats.posts_month} accent="text-cyan-400" bgAccent="bg-cyan-500/10 border-cyan-500/20" />
          </div>
        </div>
      )}

      {/* ─── Search Bar ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto mb-6">
        <form onSubmit={handleSearch} className="relative">
          <div className="flex items-center bg-surface border border-gray-200 rounded-xl overflow-hidden focus-within:border-red-500/50 transition-colors">
            <div className="pl-4 text-text-muted">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search victims, groups, leaks..."
              className="flex-1 bg-transparent text-text-base placeholder-text-muted px-3 py-3.5 text-sm outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchResults(null); setShowSearch(false); }}
                className="p-2 text-text-muted hover:text-text-base transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching || searchQuery.length < 2}
              className="px-5 py-3.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border-l border-gray-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Search Results (overlays main content) ────────────── */}
      {showSearch && searchResults && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-surface border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-text-base">
                  Search Results for &quot;{searchQuery}&quot;
                </span>
                <span className="text-xs text-text-muted">
                  ({(searchResults.posts?.length || 0) + (searchResults.groups?.length || 0)} results)
                </span>
              </div>
              <button onClick={() => { setShowSearch(false); setSearchResults(null); setSearchQuery(''); }} className="text-text-muted hover:text-text-base transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search: Posts */}
            {searchResults.posts && searchResults.posts.length > 0 && (
              <div className="p-4">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Crosshair className="w-3.5 h-3.5" /> Victim Posts ({searchResults.posts.length})
                </h4>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {searchResults.posts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${getGroupColor(p.group)}`}>
                          {p.group}
                        </span>
                        <span className="text-sm text-text-base truncate">{p.title}</span>
                      </div>
                      <span className="text-xs text-text-muted whitespace-nowrap ml-3">{timeAgo(p.discovered)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search: Groups */}
            {searchResults.groups && searchResults.groups.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Groups ({searchResults.groups.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {searchResults.groups.map((g: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => { openGroupDetail(g.name || g); setShowSearch(false); }}
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-text-base hover:border-violet-500/50 hover:text-violet-400 transition-colors"
                    >
                      {g.name || g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(!searchResults.posts || searchResults.posts.length === 0) && (!searchResults.groups || searchResults.groups.length === 0) && (
              <div className="p-8 text-center text-text-muted text-sm">
                No results found for &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Loading State ─────────────────────────────────────── */}
      {isLoading && (
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-red-500/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            </div>
            <p className="text-text-muted text-sm">Loading ransomware intelligence...</p>
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
            <button onClick={fetchDashboard} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium">
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
            <TabButton active={activeTab === 'victims'} onClick={() => setActiveTab('victims')} icon={<Crosshair className="w-4 h-4" />} label="Recent Victims" count={recentVictims.length} />
            <TabButton active={activeTab === 'trending'} onClick={() => setActiveTab('trending')} icon={<TrendingUp className="w-4 h-4" />} label="Trending Groups" count={hotGroups.length} />
            <TabButton active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} icon={<Users className="w-4 h-4" />} label="Groups Directory" />
          </div>

          {/* ═══ Tab: Recent Victims ═══ */}
          {activeTab === 'victims' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-text-muted text-xs">
                  <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  <span>Live feed — last 50 disclosed victims</span>
                </div>
              </div>
              {recentVictims.length === 0 ? (
                <EmptyState message="No recent victim data available" />
              ) : (
                <div className="grid gap-2.5">
                  {recentVictims.map((v, i) => (
                    <VictimCard key={i} victim={v} onGroupClick={(g) => openGroupDetail(g)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ Tab: Trending Groups ═══ */}
          {activeTab === 'trending' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-text-muted text-xs">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ranked by activity — last {hotMeta.days} days • {hotMeta.total_posts} total posts</span>
                </div>
              </div>
              {hotGroups.length === 0 ? (
                <EmptyState message="No trending group data available" />
              ) : (
                <div className="space-y-2">
                  {hotGroups.map((hg, i) => (
                    <TrendingGroupRow key={hg.group} rank={i + 1} group={hg} maxCount={hotGroups[0]?.count || 1} onClick={() => openGroupDetail(hg.group)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ Tab: Groups Directory ═══ */}
          {activeTab === 'groups' && (
            <div>
              {groupsLoading ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
                  <span className="text-text-muted text-sm">Loading groups directory...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-text-muted text-xs mb-4">
                    <Server className="w-3.5 h-3.5 text-violet-400" />
                    <span>{allGroups.length} ransomware groups tracked</span>
                  </div>
                  <GroupsGrid groups={allGroups} onGroupClick={(name) => openGroupDetail(name)} />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Group Detail Modal ────────────────────────────────── */}
      {(selectedGroup || groupDetailLoading) && (
        <GroupDetailModal
          group={selectedGroup}
          posts={groupPosts}
          loading={groupDetailLoading}
          onClose={() => { setSelectedGroup(null); setGroupPosts([]); }}
        />
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
          ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm'
          : 'text-text-muted hover:text-text-base hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {count !== undefined && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-red-500/20 text-red-500' : 'bg-gray-200 text-text-muted'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function VictimCard({ victim, onGroupClick }: { victim: Victim; onGroupClick: (g: string) => void }) {
  return (
    <div className="group flex items-center gap-4 bg-surface border border-gray-200 rounded-xl px-4 py-3.5 hover:border-red-500/30 transition-all duration-200">
      {/* Threat icon */}
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
        <Crosshair className="w-4 h-4 text-red-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-text-base truncate max-w-xs">{victim.title}</span>
          {victim.website && (
            <a href={victim.website.startsWith('http') ? victim.website : `https://${victim.website}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-cyan-400 transition-colors" title={victim.website}>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        {victim.description && (
          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{victim.description}</p>
        )}
      </div>

      {/* Group badge */}
      <button
        onClick={() => onGroupClick(victim.group)}
        className={`text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap hover:opacity-80 transition-opacity ${getGroupColor(victim.group)}`}
      >
        {victim.group}
      </button>

      {/* Time */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap">
        <Clock className="w-3 h-3" />
        {timeAgo(victim.discovered)}
      </div>
    </div>
  );
}

function TrendingGroupRow({ rank, group, maxCount, onClick }: { rank: number; group: HotGroup; maxCount: number; onClick: () => void }) {
  const barWidth = Math.max((group.count / maxCount) * 100, 4);
  const medalColors: Record<number, string> = {
    1: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    2: 'text-slate-300 bg-slate-400/10 border-slate-400/30',
    3: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  };
  const rankStyle = medalColors[rank] || 'text-text-muted bg-gray-100 border-gray-200';

  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 bg-surface border border-gray-200 rounded-xl px-4 py-3.5 hover:border-violet-500/30 transition-all duration-200 text-left group">
      {/* Rank */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold ${rankStyle}`}>
        {rank}
      </div>

      {/* Group Name */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-base group-hover:text-violet-400 transition-colors truncate">
          {group.group}
        </div>
        <div className="text-xs text-text-muted mt-0.5">
          Last post: {timeAgo(group.last_post)}
        </div>
      </div>

      {/* Activity Bar */}
      <div className="hidden sm:flex flex-col items-end gap-1 w-48">
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full transition-all duration-500" style={{ width: `${barWidth}%` }} />
        </div>
        <span className="text-xs text-text-muted">{group.count} victims</span>
      </div>

      {/* Mobile count */}
      <div className="sm:hidden flex items-center gap-1 text-xs text-red-400 font-semibold">
        {group.count}
        <Crosshair className="w-3 h-3" />
      </div>

      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-violet-400 transition-colors flex-shrink-0" />
    </button>
  );
}

function GroupsGrid({ groups, onGroupClick }: { groups: any[]; onGroupClick: (name: string) => void }) {
  const [filter, setFilter] = useState('');
  const filtered = groups.filter(g => {
    const name = (g.name || '').toLowerCase();
    return name.includes(filter.toLowerCase());
  });

  return (
    <div>
      {/* Filter Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter groups..."
          className="w-full bg-surface border border-gray-200 rounded-lg text-sm text-text-base placeholder-text-muted pl-10 pr-4 py-2.5 outline-none focus:border-violet-500/50 transition-colors"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {filtered.map((g: any, i: number) => (
          <button
            key={i}
            onClick={() => onGroupClick(g.name)}
            className="px-3 py-3 bg-surface border border-gray-200 rounded-xl text-left hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Skull className="w-3.5 h-3.5 text-text-muted group-hover:text-violet-400 transition-colors" />
              <span className="text-sm font-medium text-text-base truncate group-hover:text-violet-400 transition-colors">{g.name}</span>
            </div>
            {g.description && (
              <p className="text-xs text-text-muted line-clamp-2 mt-1">{g.description}</p>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-text-muted text-sm">
          No groups matching &quot;{filter}&quot;
        </div>
      )}
    </div>
  );
}

function GroupDetailModal({ group, posts, loading, onClose }: { group: GroupDetail | null; posts: Victim[]; loading: boolean; onClose: () => void }) {
  const [showAllPosts, setShowAllPosts] = useState(false);
  const displayedPosts = showAllPosts ? posts : posts.slice(0, 5);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-surface border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-500/5 to-violet-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Skull className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-base">{loading ? 'Loading...' : group?.name || 'Group Detail'}</h3>
              <p className="text-xs text-text-muted">Ransomware Group Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-base hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
              <span className="text-text-muted text-sm">Fetching group intelligence...</span>
            </div>
          ) : group ? (
            <>
              {/* Meta badges */}
              <div className="flex flex-wrap gap-2">
                {group.meta.raas && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    💰 RaaS
                  </span>
                )}
                {group.meta.captcha && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                    <Lock className="w-3 h-3 inline mr-1" />Captcha
                  </span>
                )}
                {group.meta.javascript_render && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                    JS Render
                  </span>
                )}
              </div>

              {/* Locations / Mirrors */}
              {group.locations.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Mirrors & Locations ({group.locations.length})
                  </h4>
                  <div className="space-y-2">
                    {group.locations.map((loc, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${loc.available ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-text-base font-mono truncate">{loc.slug}</div>
                          {loc.title && <div className="text-xs text-text-muted">{loc.title}</div>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${loc.available ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {loc.available ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Posts */}
              {posts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Crosshair className="w-3.5 h-3.5" /> Recent Victims ({posts.length})
                  </h4>
                  <div className="space-y-2">
                    {displayedPosts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <Crosshair className="w-3 h-3 text-red-400 flex-shrink-0" />
                          <span className="text-sm text-text-base truncate">{p.title}</span>
                        </div>
                        <span className="text-xs text-text-muted whitespace-nowrap ml-2">{timeAgo(p.discovered)}</span>
                      </div>
                    ))}
                  </div>
                  {posts.length > 5 && (
                    <button
                      onClick={() => setShowAllPosts(!showAllPosts)}
                      className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                    >
                      {showAllPosts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {showAllPosts ? 'Show less' : `Show all ${posts.length} victims`}
                    </button>
                  )}
                </div>
              )}

              {posts.length === 0 && group.locations.length === 0 && (
                <div className="text-center py-8 text-text-muted text-sm">
                  No detailed information available for this group.
                </div>
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
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
      <Shield className="w-10 h-10 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
