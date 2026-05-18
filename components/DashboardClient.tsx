"use client";

import React, { useState, useMemo } from 'react';
import { Search, ShieldAlert, Star, ExternalLink, GitBranch, Clock, Activity, Shield, AlertTriangle, Bug, Radar } from 'lucide-react';
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
    <div className="min-h-screen bg-base text-text-base font-sans pb-12">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-base/90 backdrop-blur-xl border-b border-[#4d4d4d]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-full transition-transform hover:scale-105">
              <Radar className="text-black w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-text-base">
              PoC Tracker
            </h1>
          </div>
          
          <div className="flex items-center gap-2.5 text-xs font-medium text-text-base bg-surface py-1.5 px-4 rounded-pill border border-[#4d4d4d]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-pill bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-pill h-2 w-2 bg-emerald-500"></span>
            </span>
            SYSTEM ACTIVE
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-10">
        
        {/* Title Area */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-text-base">Vulnerability Intelligence</h2>
            <p className="mt-2 text-text-muted text-sm md:text-base font-medium">Real-time aggregation of Proof of Concepts from global repositories.</p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <div className="bg-surface p-5 rounded-lg hover:bg-surface-elevated hover:shadow-[0_8px_8px_rgba(0,0,0,0.3)] transition-colors relative overflow-hidden group">
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-[#4d4d4d] text-text-base rounded-lg">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Tracked Exploits</p>
                <p className="text-2xl font-mono font-semibold text-text-base">{initialData.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-surface p-5 rounded-lg hover:bg-surface-elevated hover:shadow-[0_8px_8px_rgba(0,0,0,0.3)] transition-colors relative overflow-hidden group">
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-[#4d4d4d] text-text-base rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Trending PoCs</p>
                <p className="text-2xl font-mono font-semibold text-text-base">
                  {initialData.filter(p => p.stargazers_count >= 30).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface p-5 rounded-lg hover:bg-surface-elevated hover:shadow-[0_8px_8px_rgba(0,0,0,0.3)] transition-colors relative overflow-hidden group">
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-[#4d4d4d] text-text-base rounded-lg">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Data Source</p>
                <a href="https://poc-in-github.motikan2010.net" target="_blank" rel="noopener noreferrer" className="text-xl font-semibold text-primary transition-colors">poc-in-github.motikan2010.net</a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Controls Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex flex-1 items-center bg-[#1f1f1f] rounded-full shadow-[inset_0_0_0_1px_rgb(124,124,124)] focus-within:shadow-[inset_0_0_0_1px_white] px-4 py-3 transition-shadow">
            <Search className="h-5 w-5 text-text-muted shrink-0 mr-3" />
            <input
              type="text"
              className="w-full bg-transparent border-0 outline-none text-sm font-medium placeholder:text-text-muted text-text-base"
              placeholder="Search CVE ID, keyword, or repository..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex bg-base p-1 rounded-full shrink-0 items-center gap-1">
            <button
              onClick={() => handleSort('date')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-medium transition-all ${
                sortBy.field === 'date' 
                  ? 'bg-surface text-text-base border border-[#4d4d4d]' 
                  : 'text-text-muted hover:text-text-base hover:bg-[#4d4d4d]'
              }`}
            >
              <Clock className={`w-4 h-4 ${sortBy.field === 'date' ? 'text-primary' : ''}`} />
              {sortBy.field === 'date' && sortBy.order === 'asc' ? 'Oldest' : 'Latest'}
            </button>
            <div className="w-px h-6 bg-[#4d4d4d] mx-1"></div>
            <button
              onClick={() => handleSort('stars')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-medium transition-all ${
                sortBy.field === 'stars' 
                  ? 'bg-surface text-text-base border border-[#4d4d4d]' 
                  : 'text-text-muted hover:text-text-base hover:bg-[#4d4d4d]'
              }`}
            >
              <Star className={`w-4 h-4 ${sortBy.field === 'stars' ? 'text-primary fill-primary' : ''}`} />
              {sortBy.field === 'stars' && sortBy.order === 'asc' ? 'Lowest' : 'Highest'}
            </button>
          </div>
        </div>

        {/* List Section */}
        <div className="space-y-5">
          {currentData.length === 0 ? (
            <div className="text-center py-20 bg-surface rounded-xl border border-[#4d4d4d]">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-pill bg-base mb-5 border border-[#4d4d4d]">
                <Bug className="h-10 w-10 text-text-muted" />
              </div>
              <h3 className="text-xl font-semibold text-text-base">No vulnerabilities found</h3>
              <p className="text-text-muted mt-2 font-medium">Try adjusting your search criteria.</p>
            </div>
          ) : (
            currentData.map((poc) => {
              const isViral = poc.stargazers_count >= 30;
              
              return (
                <div 
                  key={poc.id} 
                  className={`group bg-surface p-6 rounded-lg hover:bg-surface-elevated hover:shadow-[0_8px_8px_rgba(0,0,0,0.3)] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden`}
                >
                  {isViral && <div className="absolute top-0 left-0 w-1 h-full bg-text-negative"></div>}
                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`inline-flex items-center px-3.5 py-1 rounded-sm text-xs font-medium tracking-wide uppercase border border-[#4d4d4d] ${
                        isViral
                          ? 'bg-[#4d4d4d] text-text-negative' 
                          : 'bg-surface text-text-base'
                      }`}>
                        {isViral && <AlertTriangle className="w-3 h-3 mr-1.5 inline" />}
                        {poc.cve_id || "UNKNOWN-CVE"}
                      </span>
                      
                      <div className="flex items-center text-text-base text-sm font-medium truncate bg-base px-3 py-1 rounded-sm border border-[#4d4d4d]">
                        <GitBranch className="w-4 h-4 mr-2 text-text-muted" />
                        <span className="truncate">{poc.repo_name}</span>
                      </div>
                    </div>
                    
                    <p className="text-text-muted text-sm leading-relaxed mb-4 max-w-3xl font-medium">
                      {poc.description || "No description provided."}
                    </p>
                    
                    <div className="flex items-center text-xs font-medium text-text-muted gap-4">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(poc.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[#4d4d4d] mt-2 md:mt-0 gap-3 relative z-10">
                    <div className="flex items-center gap-1.5 text-text-base font-mono font-medium bg-base px-3.5 py-1.5 rounded-sm border border-[#4d4d4d] text-sm">
                      <Star className={`w-4 h-4 ${isViral ? 'text-text-negative fill-text-negative' : 'text-primary'}`} />
                      <span className={isViral ? 'text-text-negative' : ''}>{poc.stargazers_count ? poc.stargazers_count.toLocaleString() : 0}</span>
                    </div>
                    
                    <a
                      href={poc.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-black rounded-pill uppercase tracking-widest font-bold text-xs hover:scale-105 transition-all gap-2 group/btn"
                    >
                      View Source 
                      <ExternalLink className="w-3.5 h-3.5" />
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
              className="px-4 py-2 bg-surface text-text-base font-medium rounded-md border border-[#4d4d4d] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4d4d4d] transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center px-4 font-mono font-medium text-text-base bg-surface rounded-md border border-[#4d4d4d]">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-surface text-text-base font-medium rounded-md border border-[#4d4d4d] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4d4d4d] transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
