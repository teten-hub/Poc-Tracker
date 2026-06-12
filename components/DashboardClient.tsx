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
  const itemsPerPage = 15; // Increased for table view
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
    if (score >= 9.0) return 12; // Map to Wazuh high level
    if (score >= 7.0) return 10;
    if (score >= 4.0) return 7;
    return 3;
  };

  return (
    <div className="min-h-screen bg-base text-text-base font-sans pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        
        {/* Page Title Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <Radar className="w-6 h-6 text-tertiary" />
             <h1 className="text-3xl font-semibold text-text-base tracking-tight">Proof of Concept (PoC) Tracker</h1>
          </div>
        </div>

        {/* Global Overview Stats - Single Strip Card */}
        <div className="bg-neutral rounded-md border border-border shadow-sm mb-6 flex flex-col md:flex-row md:divide-x divide-gray-200">
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-sm font-medium text-text-muted mb-1">Total PoCs Tracked</p>
             <p className="text-3xl font-normal text-blue-500 tracking-tight">{initialData.length.toLocaleString()}</p>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-sm font-medium text-text-muted mb-1">Trending PoCs (30+ Stars)</p>
             <p className="text-3xl font-normal text-red-500 tracking-tight">
               {initialData.filter(p => p.stargazers_count >= 30).length.toLocaleString()}
             </p>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-sm font-medium text-text-muted mb-1">Critical Severities</p>
             <p className="text-3xl font-normal text-orange-500 tracking-tight">
               {initialData.filter(p => p.severity === 'CRITICAL').length.toLocaleString()}
             </p>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-sm font-medium text-text-muted mb-1">Data Source</p>
             <a href="https://poc-in-github.motikan2010.net" target="_blank" rel="noopener noreferrer" className="text-base font-medium text-blue-500 hover:underline mt-1 truncate max-w-[200px]">poc-in-github</a>
           </div>
        </div>
        
        {/* Controls Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
          <div className="flex flex-1 items-center bg-neutral rounded-md border border-border focus-within:border-blue-500 px-4 py-2 shadow-sm">
            <Search className="h-4 w-4 text-text-muted shrink-0 mr-3" />
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

          <div className="flex bg-neutral rounded-md border border-border shadow-sm overflow-hidden text-sm">
            <button
              onClick={() => handleSort('date')}
              className={`px-4 py-2 font-medium transition-colors border-r border-border ${
                sortBy.field === 'date' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-text-muted hover:bg-surface'
              }`}
            >
              Time {sortBy.field === 'date' && (sortBy.order === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSort('score')}
              className={`px-4 py-2 font-medium transition-colors border-r border-border ${
                sortBy.field === 'score' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-text-muted hover:bg-surface'
              }`}
            >
              CVSS {sortBy.field === 'score' && (sortBy.order === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSort('stars')}
              className={`px-4 py-2 font-medium transition-colors ${
                sortBy.field === 'stars' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-text-muted hover:bg-surface'
              }`}
            >
              Stars {sortBy.field === 'stars' && (sortBy.order === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>

        {/* Table Section (Wazuh Style) */}
        <div className="bg-neutral rounded-md border border-border shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border flex justify-between items-center">
            <h2 className="text-base font-medium text-text-base">PoC Lists ({filteredAndSortedData.length} total)</h2>
          </div>
          
          <div className="overflow-x-auto min-h-[400px]">
            {currentData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                <Bug className="h-10 w-10 mb-4 opacity-50" />
                <p>No vulnerabilities found matching your search.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-text-muted">
                <thead className="text-[11px] font-semibold text-text-muted bg-neutral border-b border-border sticky top-0">
                  <tr>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Time</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">CVE(s)</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Description</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">CVSS</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Stars</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap text-right">GitHub</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentData.map((poc) => {
                    const isViral = poc.stargazers_count >= 30;
                    const level = getSeverityLevel(poc.cvss_score);
                    
                    return (
                      <tr key={poc.id} className="hover:bg-surface transition-colors group">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="text-text-muted mr-1">&gt;</span> 
                          {new Date(poc.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3 font-medium text-blue-500">
                          {poc.cve_id || '-'}
                        </td>
                        <td className="px-5 py-3 max-w-[300px] truncate" title={poc.description}>
                          {poc.description || 'No description provided.'}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            (poc.cvss_score || 0) >= 9.0 ? 'bg-red-50 text-red-600 border border-red-200' :
                            (poc.cvss_score || 0) >= 7.0 ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                            poc.cvss_score ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-neutral text-text-muted border border-border'
                          }`}>
                            {poc.cvss_score ? poc.cvss_score.toFixed(1) : '-'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`flex items-center gap-1 font-medium ${isViral ? 'text-orange-500' : 'text-text-muted'}`}>
                            <Star className={`w-3.5 h-3.5 ${isViral ? 'fill-orange-500' : ''}`} />
                            {poc.stargazers_count}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <a
                            href={poc.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1.5 text-text-muted hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
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
          
          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-border flex justify-between items-center bg-surface">
              <div className="text-xs text-text-muted font-medium">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-medium bg-neutral border border-border rounded text-text-muted disabled:opacity-50 hover:bg-surface"
                >
                  Previous
                </button>
                <div className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded">
                  {currentPage}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-medium bg-neutral border border-border rounded text-text-muted disabled:opacity-50 hover:bg-surface"
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
