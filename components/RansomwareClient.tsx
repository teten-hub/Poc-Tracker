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

// Assign a consistent color to group names
const GROUP_COLORS = [
  'bg-red-50 text-red-600 border-red-200',
  'bg-orange-50 text-orange-600 border-orange-200',
  'bg-yellow-50 text-yellow-600 border-yellow-200',
  'bg-green-50 text-green-600 border-green-200',
  'bg-teal-50 text-teal-600 border-teal-200',
  'bg-cyan-50 text-cyan-600 border-cyan-200',
  'bg-blue-50 text-blue-600 border-blue-200',
  'bg-indigo-50 text-indigo-600 border-indigo-200',
  'bg-violet-50 text-violet-600 border-violet-200',
  'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200',
  'bg-pink-50 text-pink-600 border-pink-200',
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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
    <div className="min-h-screen bg-[#f5f6f8] text-gray-900 font-sans pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        
        {/* Page Title Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <Skull className="w-6 h-6 text-tertiary" />
             <h1 className="text-3xl font-semibold text-text-base tracking-tight">Ransomware Threat Landscape</h1>
          </div>
        </div>

        {/* ─── Stats Bar ─────────────────────────────────────────── */}
        {stats && !isLoading && (
          <div className="bg-white rounded-md border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row md:divide-x divide-gray-200">
            <div className="flex-1 flex flex-col items-center justify-center py-4 px-2 text-center">
              <p className="text-xs font-medium text-gray-500 mb-1">Active Groups</p>
              <p className="text-3xl font-normal text-blue-500 tracking-tight">{stats.groups.toLocaleString()}</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-4 px-2 text-center">
              <p className="text-xs font-medium text-gray-500 mb-1">Total Victims</p>
              <p className="text-3xl font-normal text-red-500 tracking-tight">{stats.posts_total.toLocaleString()}</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-4 px-2 text-center">
              <p className="text-xs font-medium text-gray-500 mb-1">Victims (Last 24h)</p>
              <p className="text-3xl font-normal text-orange-500 tracking-tight">{stats.posts_24h.toLocaleString()}</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-4 px-2 text-center">
              <p className="text-xs font-medium text-gray-500 mb-1">{stats.posts_month_label || 'This Month'}</p>
              <p className="text-3xl font-normal text-green-500 tracking-tight">{stats.posts_month.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* ─── Search Bar ────────────────────────────────────────── */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center bg-white border border-gray-200 rounded-md overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 shadow-sm transition-all">
              <div className="pl-4 text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search victims, groups, leaks..."
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 px-4 py-2.5 text-sm outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchResults(null); setShowSearch(false); }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={isSearching || searchQuery.length < 2}
                className="px-6 py-2.5 bg-gray-50 border-l border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors h-full"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* ─── Search Results (overlays main content) ────────────── */}
        {showSearch && searchResults && (
          <div className="mb-8">
            <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">
                    Search Results for &quot;{searchQuery}&quot;
                  </span>
                  <span className="text-xs text-gray-500">
                    ({(searchResults.posts?.length || 0) + (searchResults.groups?.length || 0)} results)
                  </span>
                </div>
                <button onClick={() => { setShowSearch(false); setSearchResults(null); setSearchQuery(''); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search: Posts */}
              {searchResults.posts && searchResults.posts.length > 0 && (
                <div className="p-5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Crosshair className="w-3.5 h-3.5" /> Victim Posts ({searchResults.posts.length})
                  </h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {searchResults.posts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 bg-white rounded-md border border-gray-200 hover:border-blue-300 transition-colors shadow-sm cursor-pointer" onClick={() => openGroupDetail(p.group)}>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-medium whitespace-nowrap uppercase ${getGroupColor(p.group)}`}>
                            {p.group}
                          </span>
                          <span className="text-sm font-medium text-gray-800 truncate">{p.title}</span>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-3">{timeAgo(p.discovered)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search: Groups */}
              {searchResults.groups && searchResults.groups.length > 0 && (
                <div className="p-5 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Groups ({searchResults.groups.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.groups.map((g: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => { openGroupDetail(g.name || g); setShowSearch(false); }}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 shadow-sm transition-colors"
                      >
                        {g.name || g}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(!searchResults.posts || searchResults.posts.length === 0) && (!searchResults.groups || searchResults.groups.length === 0) && (
                <div className="p-10 text-center text-gray-500 font-medium text-sm">
                  No results found for &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Loading State ─────────────────────────────────────── */}
        {isLoading && (
          <div>
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-red-200 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                </div>
              </div>
              <p className="text-gray-500 font-medium text-sm">Loading ransomware intelligence...</p>
            </div>
          </div>
        )}

        {/* ─── Error State ───────────────────────────────────────── */}
        {error && !isLoading && (
          <div>
            <div className="bg-red-50 border border-red-200 rounded-md p-8 text-center max-w-lg mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <p className="text-red-700 font-medium mb-2 text-lg">Failed to load data</p>
              <p className="text-red-600/80 text-sm mb-6">{error}</p>
              <button onClick={fetchDashboard} className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium shadow-sm">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ─── Main Content ─────────────────────────────────────── */}
        {!isLoading && !error && (
          <div>
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-md px-6">
              <button 
                onClick={() => setActiveTab('victims')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'victims' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Recent Victims <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs ml-1">{recentVictims.length}</span>
              </button>
              <button 
                onClick={() => setActiveTab('trending')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'trending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Trending Groups <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs ml-1">{hotGroups.length}</span>
              </button>
              <button 
                onClick={() => setActiveTab('groups')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'groups' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Groups Directory
              </button>
            </div>

            {/* ═══ Tab: Recent Victims ═══ */}
            {activeTab === 'victims' && (
              <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <div className="flex items-center gap-2 text-gray-600 text-[11px] font-semibold uppercase tracking-wider">
                    <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    <span>Live feed — last 50 disclosed victims</span>
                  </div>
                </div>
                
                {recentVictims.length === 0 ? (
                  <EmptyState message="No recent victim data available" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="text-[11px] font-semibold text-gray-500 bg-white border-b border-gray-200">
                        <tr>
                          <th className="px-5 py-3">Time</th>
                          <th className="px-5 py-3">Group</th>
                          <th className="px-5 py-3">Victim Name</th>
                          <th className="px-5 py-3">Description</th>
                          <th className="px-5 py-3 text-right">Website</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recentVictims.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((v, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 whitespace-nowrap text-xs">
                              {timeAgo(v.discovered)}
                            </td>
                            <td className="px-5 py-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); openGroupDetail(v.group); }}
                                className={`text-[10px] px-2 py-0.5 rounded border font-medium uppercase hover:opacity-80 transition-opacity ${getGroupColor(v.group)}`}
                              >
                                {v.group}
                              </button>
                            </td>
                            <td className="px-5 py-3 font-medium text-gray-800">
                              {v.title}
                            </td>
                            <td className="px-5 py-3 max-w-[250px] truncate" title={v.description}>
                              {v.description || '-'}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {v.website ? (
                                <a href={v.website.startsWith('http') ? v.website : `https://${v.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex p-1 text-gray-400 hover:text-blue-500 transition-colors" title={v.website}>
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
                  <div className="px-5 py-3 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                    <div className="text-xs text-gray-500 font-medium">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, recentVictims.length)} of {recentVictims.length}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <div className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded">
                        {currentPage}
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(recentVictims.length / itemsPerPage)))}
                        disabled={currentPage === Math.ceil(recentVictims.length / itemsPerPage)}
                        className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ Tab: Trending Groups ═══ */}
            {activeTab === 'trending' && (
              <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <div className="flex items-center gap-2 text-gray-600 text-[11px] font-semibold uppercase tracking-wider">
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                    <span>Ranked by activity — last {hotMeta.days} days • {hotMeta.total_posts} total posts</span>
                  </div>
                </div>
                
                {hotGroups.length === 0 ? (
                  <EmptyState message="No trending group data available" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="text-[11px] font-semibold text-gray-500 bg-white border-b border-gray-200">
                        <tr>
                          <th className="px-5 py-3 w-16 text-center">Rank</th>
                          <th className="px-5 py-3">Group</th>
                          <th className="px-5 py-3">Last Post</th>
                          <th className="px-5 py-3">Victims</th>
                          <th className="px-5 py-3 w-48">Activity Volume</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {hotGroups.map((hg, i) => {
                          const maxCount = hotGroups[0]?.count || 1;
                          const barWidth = Math.max((hg.count / maxCount) * 100, 2);
                          return (
                            <tr key={hg.group} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openGroupDetail(hg.group)}>
                              <td className="px-5 py-3 text-center">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                                  i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                  i === 1 ? 'bg-gray-200 text-gray-700' :
                                  i === 2 ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-50 text-gray-500 border border-gray-200'
                                }`}>
                                  {i + 1}
                                </span>
                              </td>
                              <td className="px-5 py-3 font-medium text-blue-600 hover:underline">
                                {hg.group}
                              </td>
                              <td className="px-5 py-3 text-xs">
                                {timeAgo(hg.last_post)}
                              </td>
                              <td className="px-5 py-3 font-medium text-gray-800">
                                {hg.count}
                              </td>
                              <td className="px-5 py-3">
                                <div className="w-full h-2 bg-gray-100 rounded-sm overflow-hidden flex">
                                  <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${barWidth}%` }} />
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

            {/* ═══ Tab: Groups Directory ═══ */}
            {activeTab === 'groups' && (
              <div className="bg-white rounded-md border border-gray-200 shadow-sm p-5">
                {groupsLoading ? (
                  <div className="flex items-center justify-center py-20 gap-3">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    <span className="text-gray-500 text-sm font-medium">Loading groups directory...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-4 border-b border-gray-100 pb-4">
                      <Server className="w-3.5 h-3.5 text-blue-500" />
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
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  Sub-Components                                                 */
/* ════════════════════════════════════════════════════════════════ */

function GroupsGrid({ groups, onGroupClick }: { groups: any[]; onGroupClick: (name: string) => void }) {
  const [filter, setFilter] = useState('');
  const filtered = groups.filter(g => {
    const name = (g.name || '').toLowerCase();
    return name.includes(filter.toLowerCase());
  });

  return (
    <div>
      {/* Filter Input */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter groups..."
          className="w-full bg-white border border-gray-200 rounded-md text-sm text-gray-900 placeholder-gray-400 pl-10 pr-4 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 shadow-sm"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((g: any, i: number) => (
          <button
            key={i}
            onClick={() => onGroupClick(g.name)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-md text-left hover:border-blue-400 hover:shadow-sm transition-all duration-200 group"
          >
            <div className="flex items-center gap-2">
              <Skull className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors truncate">{g.name}</span>
            </div>
            {g.description && (
              <p className="text-[10px] text-gray-500 line-clamp-1 mt-1">{g.description}</p>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm font-medium">
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/20 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded border border-red-200 bg-red-50 flex items-center justify-center shadow-sm">
              <Skull className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900">{loading ? 'Loading...' : group?.name || 'Group Detail'}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Ransomware Group Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="text-gray-500 text-sm font-medium">Fetching group intelligence...</span>
            </div>
          ) : group ? (
            <>
              {/* Meta badges */}
              <div className="flex flex-wrap gap-2">
                {group.meta.raas && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-semibold uppercase tracking-wider">
                    💰 RaaS
                  </span>
                )}
                {group.meta.captcha && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200 font-semibold uppercase tracking-wider">
                    <Lock className="w-3 h-3 inline mr-1" />Captcha
                  </span>
                )}
                {group.meta.javascript_render && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 font-semibold uppercase tracking-wider">
                    JS Render
                  </span>
                )}
              </div>

              {/* Locations / Mirrors */}
              {group.locations.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Mirrors & Locations ({group.locations.length})
                  </h4>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-600">
                      <tbody className="divide-y divide-gray-100">
                        {group.locations.map((loc, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2 w-8">
                              <div className={`w-2 h-2 rounded-full ${loc.available ? 'bg-green-500' : 'bg-red-500'}`} />
                            </td>
                            <td className="px-4 py-2 font-medium text-gray-800 break-all">
                              {loc.slug}
                            </td>
                            <td className="px-4 py-2 text-xs">
                              {loc.title || '-'}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${loc.available ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {loc.available ? 'Online' : 'Offline'}
                              </span>
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
                  <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Crosshair className="w-3.5 h-3.5" /> Recent Victims ({posts.length})
                  </h4>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-600">
                      <tbody className="divide-y divide-gray-100">
                        {displayedPosts.map((p, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                              <Crosshair className="w-3.5 h-3.5 text-red-400" />
                              {p.title}
                            </td>
                            <td className="px-4 py-3 text-xs text-right whitespace-nowrap">
                              {timeAgo(p.discovered)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {posts.length > 5 && (
                    <button
                      onClick={() => setShowAllPosts(!showAllPosts)}
                      className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5 justify-center w-full bg-blue-50 py-2 rounded border border-blue-100"
                    >
                      {showAllPosts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {showAllPosts ? 'Show less' : `Show all ${posts.length} victims`}
                    </button>
                  )}
                </div>
              )}

              {posts.length === 0 && group.locations.length === 0 && (
                <div className="text-center py-10 text-gray-500 text-sm font-medium">
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
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-500 bg-gray-50 border border-gray-200 rounded-md">
      <Shield className="w-10 h-10 opacity-30" />
      <p className="font-medium text-sm">{message}</p>
    </div>
  );
}
