"use client";

import React, { useState, useMemo } from 'react';
import { Search, ShieldAlert, Star, ExternalLink, GitBranch, Clock, Activity, Shield, AlertTriangle, Bug } from 'lucide-react';
import { PocData } from '@/types';

interface DashboardClientProps {
  initialData: PocData[];
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState({ field: 'date', order: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAndSortedData = useMemo(() => {
    let result = [...initialData];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.cve_id && item.cve_id.toLowerCase().includes(lowerSearch)) ||
        (item.description && item.description.toLowerCase().includes(lowerSearch)) ||
        (item.repo_name && item.repo_name.toLowerCase().includes(lowerSearch))
      );
    }

    result.sort((a, b) => {
      if (sortBy.field === 'stars') {
        return sortBy.order === 'desc' 
          ? b.stargazers_count - a.stargazers_count 
          : a.stargazers_count - b.stargazers_count;
      } else if (sortBy.field === 'date') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortBy.order === 'desc' ? dateB - dateA : dateA - dateB;
      }
      return 0;
    });

    return result;
  }, [initialData, searchTerm, sortBy]);

  const handleSort = (field: string) => {
    setCurrentPage(1);
    if (sortBy.field === field) {
      setSortBy({ field, order: sortBy.order === 'desc' ? 'asc' : 'desc' });
    } else {
      setSortBy({ field, order: 'desc' });
    }
  };

  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentData = filteredAndSortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] text-slate-800 font-sans selection:bg-indigo-200 selection:text-indigo-900 pb-12">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.1)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-700">
              PoC Tracker
            </h1>
          </div>
          
          <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-700 bg-emerald-50/80 backdrop-blur-md py-1.5 px-4 rounded-full border border-emerald-200/50 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.2)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            SYSTEM ACTIVE
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-10">
        
        {/* Title Area */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">Vulnerability Intelligence</h2>
            <p className="mt-2 text-slate-600 text-sm md:text-base font-medium">Real-time aggregation of Proof of Concepts from global repositories.</p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-indigo-100/50 text-indigo-600 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tracked Exploits</p>
                <p className="text-2xl font-black text-slate-800">{initialData.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-rose-100/50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trending PoCs</p>
                <p className="text-2xl font-black text-slate-800">
                  {initialData.filter(p => p.stargazers_count >= 30).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-blue-100/50 text-blue-600 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data Source</p>
                <a href="https://poc-in-github.motikan2010.net" target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-slate-800 hover:text-indigo-600 transition-colors">poc-in-github.motikan2010.net</a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Controls Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white/60 backdrop-blur-md p-2 rounded-2xl border border-white/60 shadow-sm">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-600">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3 bg-white border-0 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400 shadow-sm"
              placeholder="Search CVE ID, keyword, or repository..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex bg-slate-100/50 p-1 rounded-xl shrink-0 items-center">
            <button
              onClick={() => handleSort('date')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                sortBy.field === 'date' 
                  ? 'bg-white shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] text-indigo-600' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              <Clock className={`w-4 h-4 ${sortBy.field === 'date' ? 'text-indigo-500' : ''}`} />
              {sortBy.field === 'date' && sortBy.order === 'asc' ? 'Oldest' : 'Latest'}
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button
              onClick={() => handleSort('stars')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                sortBy.field === 'stars' 
                  ? 'bg-white shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] text-indigo-600' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              <Star className={`w-4 h-4 ${sortBy.field === 'stars' ? 'text-amber-400 fill-amber-400' : ''}`} />
              {sortBy.field === 'stars' && sortBy.order === 'asc' ? 'Lowest' : 'Highest'}
            </button>
          </div>
        </div>

        {/* List Section */}
        <div className="space-y-5">
          {currentData.length === 0 ? (
            <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl border border-white shadow-sm">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-5 shadow-inner">
                <Bug className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800">No vulnerabilities found</h3>
              <p className="text-slate-500 mt-2 font-medium">Try adjusting your search criteria.</p>
            </div>
          ) : (
            currentData.map((poc) => {
              const isViral = poc.stargazers_count >= 30;
              
              return (
                <div 
                  key={poc.id} 
                  className={`group bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-y border-r border-white shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden
                    ${isViral ? 'border-l-4 border-l-rose-500' : 'border-l-4 border-l-indigo-500'}
                  `}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none ${isViral ? 'bg-gradient-to-r from-rose-100 to-transparent' : 'bg-gradient-to-r from-indigo-100 to-transparent'}`}></div>

                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-black tracking-widest uppercase shadow-sm ${
                        isViral
                          ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/30' 
                          : 'bg-slate-100 text-indigo-700 border border-slate-200'
                      }`}>
                        {isViral && <AlertTriangle className="w-3 h-3 mr-1.5 inline" />}
                        {poc.cve_id || "UNKNOWN-CVE"}
                      </span>
                      
                      <div className="flex items-center text-slate-700 text-sm font-bold truncate hover:text-indigo-600 transition-colors cursor-pointer bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                        <GitBranch className="w-4 h-4 mr-2 text-slate-400" />
                        <span className="truncate">{poc.repo_name}</span>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 text-sm leading-relaxed mb-4 max-w-3xl font-medium">
                      {poc.description || "No description provided."}
                    </p>
                    
                    <div className="flex items-center text-xs font-bold text-slate-400 gap-4">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(poc.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 mt-2 md:mt-0 gap-3 relative z-10">
                    <div className="flex items-center gap-1.5 text-slate-700 font-extrabold bg-amber-50 px-3.5 py-1.5 rounded-xl border border-amber-100/50 text-sm">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      {poc.stargazers_count ? poc.stargazers_count.toLocaleString() : 0}
                    </div>
                    
                    <a
                      href={poc.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all gap-2 group/btn"
                    >
                      View Source 
                      <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white text-slate-700 font-bold rounded-xl shadow-sm border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center px-4 font-bold text-slate-600 bg-white rounded-xl shadow-sm border border-slate-200">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white text-slate-700 font-bold rounded-xl shadow-sm border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
