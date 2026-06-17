"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Search, ShieldAlert, Star, ExternalLink, GitBranch, Clock, Activity, Shield, AlertTriangle, Bug, Radar, ChevronDown, FileText, Globe } from 'lucide-react';
import Link from 'next/link';
import { PocData } from '@/types';

interface DashboardClientProps {
  initialData: PocData[];
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState({ field: 'date', order: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [enrichedData, setEnrichedData] = useState<Record<string, { cvss_score: number | null, severity: string }>>({});

  const filteredAndSortedData = useMemo(() => {
    let result = initialData.map(item => {
      if (item.cve_id && enrichedData[item.cve_id]) {
        return { ...item, cvss_score: enrichedData[item.cve_id].cvss_score, severity: enrichedData[item.cve_id].severity as 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'|'UNKNOWN' };
      }
      return item;
    });

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
      } else if (sortBy.field === 'score') {
        const scoreA = a.cvss_score ?? -1;
        const scoreB = b.cvss_score ?? -1;
        return sortBy.order === 'desc' ? scoreB - scoreA : scoreA - scoreB;
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

  useEffect(() => {
    const cvesToFetch = Array.from(new Set(
      currentData
        .filter(p => p.cve_id && (p.cvss_score === null || p.cvss_score === undefined) && enrichedData[p.cve_id] === undefined)
        .map(p => p.cve_id)
    ));

    if (cvesToFetch.length > 0) {
      fetch('/api/cvss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cves: cvesToFetch })
      })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setEnrichedData(prev => ({ ...prev, ...json.data }));
        }
      })
      .catch(console.error);
    }
  }, [currentData, enrichedData]);

  const getSeverityLevel = (score: number | null) => {
    if (score === null) return 0;
    if (score >= 9.0) return 12;
    if (score >= 7.0) return 10;
    if (score >= 4.0) return 7;
    return 3;
  };

  return (
    <div className="min-h-screen bg-base text-text-base font-sans pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 md:pt-8">
        
        {/* Page Header */}
        <div className="mb-16">
          <h1 className="text-headline-display text-text-base mb-4">
            Proof of Concept Tracker
          </h1>
          <p className="text-body-lg text-text-muted">
            Aggregated exploits from global repositories
          </p>
        </div>

        {/* Inline Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
           <div className="section-panel !p-6 flex flex-col justify-center">
             <span className="text-label-sm text-text-muted mb-2 uppercase tracking-widest">Total PoCs</span>
             <span className="text-headline-md font-mono text-tertiary">{initialData.length.toLocaleString()}</span>
           </div>
           <div className="section-panel !p-6 flex flex-col justify-center">
             <span className="text-label-sm text-text-muted mb-2 uppercase tracking-widest">Trending (30+ ★)</span>
             <span className="text-headline-md font-mono text-error">
               {initialData.filter(p => p.stargazers_count >= 30).length.toLocaleString()}
             </span>
           </div>
           <div className="section-panel !p-6 flex flex-col justify-center">
             <span className="text-label-sm text-text-muted mb-2 uppercase tracking-widest">Critical Severities</span>
             <span className="text-headline-md font-mono text-orange-500">
               {initialData.filter(p => p.severity === 'CRITICAL').length.toLocaleString()}
             </span>
           </div>
           <div className="section-panel !p-6 flex flex-col justify-center">
             <span className="text-label-sm text-text-muted mb-2 uppercase tracking-widest">Data Source</span>
             <a href="https://poc-in-github.motikan2010.net" target="_blank" rel="noopener noreferrer" className="text-body-md font-medium text-tertiary hover:underline">poc-in-github</a>
           </div>
        </div>
        
        {/* Controls — Search + Sort, no card */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 items-center">
          <div className="floating-input flex items-center gap-3 flex-1 w-full">
            <Search className="h-4 w-4 text-text-muted shrink-0" />
            <input
              type="text"
              className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-text-muted text-text-base"
              placeholder="Search CVE ID, keyword, or repository..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex rounded-lg border border-border overflow-hidden text-xs shrink-0">
            {[
              { field: 'date', label: 'Time' },
              { field: 'score', label: 'CVSS' },
              { field: 'stars', label: 'Stars' },
            ].map((btn) => (
              <button
                key={btn.field}
                onClick={() => handleSort(btn.field)}
                className={`px-4 py-2 font-medium transition-all border-r border-border last:border-r-0 ${
                  sortBy.field === btn.field 
                    ? 'bg-tertiary/10 text-tertiary' 
                    : 'text-text-muted hover:bg-surface hover:text-text-base'
                }`}
              >
                {btn.label} {sortBy.field === btn.field && (sortBy.order === 'desc' ? '↓' : '↑')}
              </button>
            ))}
          </div>
        </div>

        {/* Table — Section panel */}
        <div className="section-panel mb-6">
          <div className="section-panel-header">
            <h3 className="text-headline-sm">PoC Lists ({filteredAndSortedData.length} total)</h3>
          </div>
          
          <div className="overflow-x-auto min-h-[400px]">
            {currentData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                <Bug className="h-10 w-10 mb-4 opacity-30" />
                <p className="text-sm font-medium">No vulnerabilities found matching your search.</p>
              </div>
            ) : (
              <table className="clean-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">CVE(s)</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">CVSS</th>
                    <th className="px-4 py-3">Stars</th>
                    <th className="px-4 py-3 text-right">GitHub</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((poc) => {
                    const isViral = poc.stargazers_count >= 30;
                    
                    return (
                      <tr key={poc.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          {new Date(poc.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 font-medium text-tertiary text-sm">
                          {poc.cve_id || '-'}
                        </td>
                        <td className="px-4 py-3 max-w-[300px] truncate text-xs" title={poc.description}>
                          {poc.description || 'No description provided.'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${
                            (poc.cvss_score || 0) >= 9.0 ? 'badge-critical' :
                            (poc.cvss_score || 0) >= 7.0 ? 'badge-high' :
                            poc.cvss_score ? 'badge-medium' : 'badge-low'
                          }`}>
                            {poc.cvss_score ? poc.cvss_score.toFixed(1) : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 font-medium text-xs ${isViral ? 'text-amber-500' : 'text-text-muted'}`}>
                            <Star className={`w-3.5 h-3.5 ${isViral ? 'fill-amber-500' : ''}`} />
                            {poc.stargazers_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={poc.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1.5 text-text-muted hover:text-tertiary rounded-md transition-colors"
                            title="View Repository"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-border flex justify-between items-center">
              <div className="text-xs text-text-muted font-medium">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
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
