"use client";

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Radio, Shield, Activity, ShieldAlert, AlertTriangle, Crosshair, FileText, Globe, ExternalLink, Activity as ActivityIcon } from 'lucide-react';
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
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred during search.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-gray-900 font-sans pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        
        {/* Page Title Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <TorIcon className="w-6 h-6 fill-current text-tertiary" />
             <h1 className="text-3xl font-semibold text-text-base tracking-tight">Tor Exit Node Directory</h1>
          </div>
        </div>

        {/* Global Overview Stats - Single Strip Card */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row md:divide-x divide-gray-200">
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-xs font-medium text-gray-500 mb-1">Total Tracked IPs</p>
             <p className="text-3xl font-normal text-green-500 tracking-tight">{initialData.total.toLocaleString()}</p>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-xs font-medium text-gray-500 mb-1">Listed IPs</p>
             <p className="text-3xl font-normal text-blue-500 tracking-tight">{ips.length.toLocaleString()}</p>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
             <p className="text-3xl font-normal text-gray-800 tracking-tight flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div> Active</p>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-xs font-medium text-gray-500 mb-1">Data Source</p>
             <a href="https://github.com/teten-hub/ip_list/blob/main/tor_ips.txt" target="_blank" rel="noopener noreferrer" className="text-base font-medium text-blue-500 hover:underline mt-1">teten-hub/ip_list</a>
           </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex items-center bg-white rounded-md border border-gray-200 focus-within:border-blue-500 px-4 py-2 shadow-sm transition-all">
            <Search className="h-4 w-4 text-gray-400 shrink-0 mr-3" />
            <input
              type="text"
              className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-gray-400 text-gray-900 py-1"
              placeholder={`Search across all ${totalCount.toLocaleString()} IPs in repo...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isSearching && <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0 ml-3" />}
          </div>
        </div>

        {/* Info Header */}
        <div className="flex items-center justify-between mb-4 bg-white px-5 py-3 rounded-md border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-[11px] font-semibold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-green-500 animate-pulse" />
            <span>
              {searchTerm 
                ? `Found ${matchedCount.toLocaleString()} matches · Showing ${ips.length}`
                : `Showing up to 100 latest IPs added to repo (out of ${totalCount.toLocaleString()} total)`}
            </span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* List Section (Wazuh Table Style) */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto min-h-[300px]">
            {ips.length === 0 && !isSearching && !error ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <ShieldAlert className="h-10 w-10 mb-4 opacity-50" />
                <p className="text-sm">No IPs found matching your search.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="text-[11px] font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 w-16 text-center">#</th>
                    <th className="px-5 py-3">IP Address</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((ip, index) => (
                    <tr key={`${ip}-${index}`} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-5 py-3 text-center text-xs text-gray-400">
                        {((currentPage - 1) * itemsPerPage) + index + 1}
                      </td>
                      <td className="px-5 py-3 font-mono text-gray-800 font-medium">
                        {ip}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-200">
                          Tor Exit Node
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link 
                          href={`/ip-analyzer?ip=${ip}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-xs font-medium text-gray-600 rounded border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors opacity-0 group-hover:opacity-100 uppercase tracking-wider"
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
          
          {/* Pagination Footer */}
          {Math.ceil(ips.length / itemsPerPage) > 1 && (
            <div className="px-5 py-3 border-t border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="text-xs text-gray-500 font-medium">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, ips.length)} of {ips.length}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(ips.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(ips.length / itemsPerPage)}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded text-gray-600 disabled:opacity-50 hover:bg-gray-50"
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
