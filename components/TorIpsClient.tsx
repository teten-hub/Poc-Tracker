"use client";

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Radio, Shield, Activity, ShieldAlert, AlertTriangle, Crosshair } from 'lucide-react';
import Link from 'next/link';
import TorIcon from './TorIcon';

interface TorIpsClientProps {
  initialData: {
    total: number;
    ips: string[];
  };
}

export default function TorIpsClient({ initialData }: TorIpsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [ips, setIps] = useState<string[]>(initialData.ips);
  const [totalCount, setTotalCount] = useState(initialData.total);
  const [matchedCount, setMatchedCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/tor-ips?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch search results');
      }
      setIps(data.ips);
      setTotalCount(data.total);
      setMatchedCount(data.matched || data.ips.length);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred during search.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-base text-text-base font-sans pb-12">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 md:mt-10">
        
        {/* Title Area */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-text-base">TOR EXIT NODES</h2>
            <p className="mt-2 text-text-muted text-sm md:text-base font-medium">Tracking known Tor exit node IP addresses for threat intelligence.</p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          <div className="bg-surface p-5 rounded-lg hover:bg-surface-elevated hover:shadow-[0_8px_8px_rgba(0,0,0,0.3)] transition-colors relative overflow-hidden group">
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-[#4d4d4d] text-text-base rounded-lg">
                <TorIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Total Tracked IPs</p>
                <p className="text-2xl font-mono font-semibold text-text-base">{initialData.total.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-surface p-5 rounded-lg hover:bg-surface-elevated hover:shadow-[0_8px_8px_rgba(0,0,0,0.3)] transition-colors relative overflow-hidden group">
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-[#4d4d4d] text-text-base rounded-lg">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Data Source</p>
                <a href="https://github.com/teten-hub/ip_list/blob/main/tor_ips.txt" target="_blank" rel="noopener noreferrer" className="text-xl font-semibold text-primary transition-colors">teten-hub/ip_list</a>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex items-center bg-[#1f1f1f] rounded-full shadow-[inset_0_0_0_1px_rgb(124,124,124)] focus-within:shadow-[inset_0_0_0_1px_white] px-4 py-3 transition-shadow">
            <Search className="h-5 w-5 text-text-muted shrink-0 mr-3" />
            <input
              type="text"
              className="w-full bg-transparent border-0 outline-none text-sm font-medium placeholder:text-text-muted text-text-base"
              placeholder={`Search across all ${totalCount.toLocaleString()} IPs in repo...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isSearching && <Loader2 className="w-5 h-5 text-text-muted animate-spin shrink-0 ml-3" />}
          </div>
        </div>

        {/* Info Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-text-muted text-xs">
            <Radio className="w-3.5 h-3.5 text-primary" />
            <span>
              {searchTerm 
                ? `Found ${matchedCount.toLocaleString()} matches across all IPs · Showing ${ips.length}`
                : `Showing up to 100 latest IPs added to repo (out of ${totalCount.toLocaleString()} total)`}
            </span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* List Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ips.length === 0 && !isSearching && !error ? (
            <div className="col-span-full text-center py-20 bg-surface rounded-xl border border-[#4d4d4d]">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-pill bg-base mb-5 border border-[#4d4d4d]">
                <ShieldAlert className="h-10 w-10 text-text-muted" />
              </div>
              <h3 className="text-xl font-semibold text-text-base">No IPs found</h3>
              <p className="text-text-muted mt-2 font-medium">Try adjusting your search query.</p>
            </div>
          ) : (
            ips.map((ip, index) => (
              <div 
                key={`${ip}-${index}`}
                className="bg-surface p-4 rounded-lg hover:bg-surface-elevated hover:shadow-[0_8px_8px_rgba(0,0,0,0.3)] transition-colors border border-transparent hover:border-[#4d4d4d] flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1f1f1f] flex items-center justify-center group-hover:bg-[#4d4d4d] transition-colors">
                    <Crosshair className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                  </div>
                  <span className="font-mono text-sm font-medium text-text-base">{ip}</span>
                </div>
                <Link 
                  href={`/ip-analyzer?ip=${ip}`}
                  className="px-3 py-1.5 bg-[#1f1f1f] text-xs font-semibold text-text-base rounded-pill border border-[#4d4d4d] hover:bg-primary hover:text-black hover:border-primary transition-colors opacity-0 group-hover:opacity-100 uppercase tracking-wide"
                >
                  Analyze
                </Link>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}
