"use client";

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Radio, ShieldAlert, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import TorIcon from './TorIcon';

interface TorIpsClientProps {
  initialData: {
    total: number;
    ips: string[];
    latestUpdate?: string;
  };
}

export default function TorIpsClient({ initialData }: TorIpsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [ips, setIps] = useState<string[]>(initialData.ips);
  const [totalCount, setTotalCount] = useState(initialData.total);
  const [matchedCount, setMatchedCount] = useState(0);
  const [latestUpdate, setLatestUpdate] = useState(initialData.latestUpdate);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Debounced search
  useEffect(() => {
    setCurrentPage(1);
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
      if (data.latestUpdate) setLatestUpdate(data.latestUpdate);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred during search.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-base text-text-base font-sans pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 md:pt-8">
        
        {/* Page Header */}
        <div className="mb-16">
          <h1 className="text-headline-display text-text-base mb-4">
            Tor Exit Node Directory
          </h1>
          <p className="text-body-lg text-text-muted">
            Known Tor exit node IP addresses
          </p>
        </div>

        {/* Inline Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
           <div className="section-panel !p-6 flex flex-col justify-center">
             <span className="text-label-sm text-text-muted mb-2 uppercase tracking-widest">Total Tracked</span>
             <span className="text-headline-md font-mono text-success">{initialData.total.toLocaleString()}</span>
           </div>
           <div className="section-panel !p-6 flex flex-col justify-center">
             <span className="text-label-sm text-text-muted mb-2 uppercase tracking-widest">Listed IPs</span>
             <span className="text-headline-md font-mono text-tertiary">{ips.length.toLocaleString()}</span>
           </div>
           <div className="section-panel !p-6 flex flex-col justify-center">
             <span className="text-label-sm text-text-muted mb-2 uppercase tracking-widest">Status</span>
             <span className="flex items-center gap-2">
               <span className="relative flex h-2.5 w-2.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
               </span>
               <span className="text-headline-sm font-semibold text-text-base">Active</span>
             </span>
           </div>
           <div className="section-panel !p-6 flex flex-col justify-center">
             <span className="text-label-sm text-text-muted mb-2 uppercase tracking-widest">Data Source</span>
             <a href="https://github.com/teten-hub/ip_list/blob/main/tor_ips.txt" target="_blank" rel="noopener noreferrer" className="text-body-md font-medium text-tertiary hover:underline">teten-hub/ip_list</a>
           </div>
           <div className="section-panel !p-6 flex flex-col justify-center">
             <span className="text-label-sm text-text-muted mb-2 uppercase tracking-widest">Latest Update</span>
             <span className="text-body-md font-medium text-text-base">
               {latestUpdate ? new Date(latestUpdate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown'}
             </span>
           </div>
        </div>

        {/* Search — floating */}
        <div className="mb-6">
          <div className="floating-input flex items-center gap-3">
            <Search className="h-4 w-4 text-text-muted shrink-0" />
            <input
              type="text"
              className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-text-muted text-text-base py-0.5"
              placeholder={`Search across all ${totalCount.toLocaleString()} IPs...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isSearching && <Loader2 className="w-4 h-4 text-tertiary animate-spin shrink-0" />}
          </div>
        </div>

        {/* Info line — no card */}
        <div className="flex items-center gap-2 text-text-muted text-[11px] font-semibold uppercase tracking-wider mb-4">
          <Radio className="w-3.5 h-3.5 text-success animate-pulse" />
          <span>
            {searchTerm 
              ? `Found ${matchedCount.toLocaleString()} matches · Showing ${ips.length}`
              : `Showing up to 100 latest IPs (out of ${totalCount.toLocaleString()} total)`}
          </span>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-6 text-center mb-6">
            <AlertTriangle className="w-8 h-8 text-error mx-auto mb-3" />
            <p className="text-error font-medium">{error}</p>
          </div>
        )}

        {/* Table — section panel */}
        <div className="section-panel mb-6">
          <div className="overflow-x-auto min-h-[300px]">
            {ips.length === 0 && !isSearching && !error ? (
              <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                <ShieldAlert className="h-10 w-10 mb-4 opacity-30" />
                <p className="text-sm font-medium">No IPs found matching your search.</p>
              </div>
            ) : (
              <table className="clean-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">#</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((ip, index) => (
                    <tr key={`${ip}-${index}`} className="group">
                      <td className="px-4 py-3 text-center text-xs text-text-muted">
                        {((currentPage - 1) * itemsPerPage) + index + 1}
                      </td>
                      <td className="px-4 py-3 font-mono text-text-base font-medium text-sm">
                        {ip}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge badge-success">
                          Tor Exit Node
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link 
                          href={`/ip-analyzer?ip=${ip}`}
                          className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-tertiary rounded-md border border-tertiary/20 hover:bg-tertiary/10 transition-all"
                        >
                          Analyze
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination */}
          {Math.ceil(ips.length / itemsPerPage) > 1 && (
            <div className="px-5 py-3 border-t border-border flex justify-between items-center">
              <div className="text-xs text-text-muted font-medium">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, ips.length)} of {ips.length}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <div className="pagination-current">
                  {currentPage}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(ips.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(ips.length / itemsPerPage)}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
