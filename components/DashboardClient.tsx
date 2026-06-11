"use client";

import React, { useState, useMemo } from 'react';
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

  const getSeverityLevel = (score: number | null) => {
    if (score === null) return 0;
    if (score >= 9.0) return 12; // Map to Wazuh high level
    if (score >= 7.0) return 10;
    if (score >= 4.0) return 7;
    return 3;
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-gray-900 font-sans pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        
        {/* Top Header Row (Wazuh style tabs area) */}
        <div className="flex items-center justify-between border-b border-gray-200 mb-4 bg-white px-6 rounded-t-md">
          <div className="flex">
            <button className="px-6 py-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600 flex items-center gap-2">
              <Radar className="w-4 h-4" />
              PoC Tracker
            </button>
            <Link href="/" className="px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent">
              Home Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
          </div>
        </div>

        {/* Global Overview Stats - Single Strip Card */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row md:divide-x divide-gray-200">
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-sm font-medium text-gray-600 mb-1">Total PoCs Tracked</p>
             <p className="text-3xl font-normal text-blue-500 tracking-tight">{initialData.length.toLocaleString()}</p>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-sm font-medium text-gray-600 mb-1">Trending PoCs (30+ Stars)</p>
             <p className="text-3xl font-normal text-red-500 tracking-tight">
               {initialData.filter(p => p.stargazers_count >= 30).length.toLocaleString()}
             </p>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-sm font-medium text-gray-600 mb-1">Critical Severities</p>
             <p className="text-3xl font-normal text-orange-500 tracking-tight">
               {initialData.filter(p => p.severity === 'CRITICAL').length.toLocaleString()}
             </p>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 text-center">
             <p className="text-sm font-medium text-gray-600 mb-1">Data Source</p>
             <a href="https://poc-in-github.motikan2010.net" target="_blank" rel="noopener noreferrer" className="text-base font-medium text-blue-500 hover:underline mt-1 truncate max-w-[200px]">poc-in-github</a>
           </div>
        </div>
        
        {/* Controls Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
          <div className="flex flex-1 items-center bg-white rounded-md border border-gray-200 focus-within:border-blue-500 px-4 py-2 shadow-sm">
            <Search className="h-4 w-4 text-gray-400 shrink-0 mr-3" />
            <input
              type="text"
              className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-gray-400 text-gray-900"
              placeholder="Search CVE ID, keyword, or repository..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden text-sm">
            <button
              onClick={() => handleSort('date')}
              className={`px-4 py-2 font-medium transition-colors border-r border-gray-200 ${
                sortBy.field === 'date' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Time {sortBy.field === 'date' && (sortBy.order === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSort('score')}
              className={`px-4 py-2 font-medium transition-colors border-r border-gray-200 ${
                sortBy.field === 'score' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              CVSS {sortBy.field === 'score' && (sortBy.order === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSort('stars')}
              className={`px-4 py-2 font-medium transition-colors ${
                sortBy.field === 'stars' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Stars {sortBy.field === 'stars' && (sortBy.order === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>

        {/* Table Section (Wazuh Style) */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-base font-medium text-gray-900">Security alerts ({filteredAndSortedData.length} total)</h2>
          </div>
          
          <div className="overflow-x-auto min-h-[400px]">
            {currentData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Bug className="h-10 w-10 mb-4 opacity-50" />
                <p>No vulnerabilities found matching your search.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="text-[11px] font-semibold text-gray-500 bg-white border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Time <ChevronDown className="w-3 h-3 inline text-blue-500" /></th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Agent name</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">CVE(s)</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Description</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Level</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Stars</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentData.map((poc) => {
                    const isViral = poc.stargazers_count >= 30;
                    const level = getSeverityLevel(poc.cvss_score);
                    
                    return (
                      <tr key={poc.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="text-gray-400 mr-1">&gt;</span> 
                          {new Date(poc.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-1.5 max-w-[150px] truncate" title={poc.repo_name}>
                            <GitBranch className="w-3.5 h-3.5 text-gray-400" />
                            {poc.repo_name ? (poc.repo_name.split('/')[1] || poc.repo_name) : 'Unknown'}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-blue-500">
                          {poc.cve_id || '-'}
                        </td>
                        <td className="px-5 py-3 max-w-[300px] truncate" title={poc.description}>
                          {poc.description || 'No description provided.'}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            level >= 10 ? 'bg-red-50 text-red-600' :
                            level >= 7 ? 'bg-orange-50 text-orange-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {level} {poc.cvss_score ? `(${poc.cvss_score})` : ''}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`flex items-center gap-1 font-medium ${isViral ? 'text-orange-500' : 'text-gray-600'}`}>
                            <Star className={`w-3.5 h-3.5 ${isViral ? 'fill-orange-500' : ''}`} />
                            {poc.stargazers_count}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <a
                            href={poc.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
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
            <div className="px-5 py-3 border-t border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="text-xs text-gray-500 font-medium">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
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
