"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, Loader2, Shield, AlertTriangle, AlertCircle, CheckCircle2, 
  Lock, Sparkles, Network, Calendar, HelpCircle, User, Activity, 
  FileText, ExternalLink, Globe, HardDrive, ShieldAlert, BadgeInfo,
  MoreVertical
} from 'lucide-react';

interface PulseDetail {
  id: string;
  name: string;
  description: string;
  created: string | null;
  adversary: string | null;
  tags: string[];
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatUnixDate(timestamp: number | null) {
  if (!timestamp) return 'N/A';
  try {
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'N/A';
  }
}

export default function IpAnalyzerClient() {
  const searchParams = useSearchParams();
  const [ipAddress, setIpAddress] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async (ip: string) => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
      setError('Please enter a valid IPv4 address.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setResults(null);

    try {
      const res = await fetch(`/api/analyze-ip?ip=${encodeURIComponent(ip)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to analyze IP. Please try again later.');
        return;
      }

      setResults(data);
    } catch (err) {
      console.error(err);
      setError('Failed to connect to threat intelligence service. Please check your network connection.');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Auto-analyze if ?ip= query param is present (e.g. from Tor Exit Nodes dashboard)
  useEffect(() => {
    const ipParam = searchParams.get('ip');
    if (ipParam) {
      setIpAddress(ipParam);
      runAnalysis(ipParam);
    }
  }, [searchParams, runAnalysis]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipAddress) return;
    runAnalysis(ipAddress);
  };

  const getAlertLevel = () => {
    if (!results) return null;

    let isMalicious = false;
    let isSuspicious = false;

    // Check VirusTotal
    if (results.vt?.success && results.vt?.configured) {
      if (results.vt.malicious > 5) {
        isMalicious = true;
      } else if (results.vt.malicious > 0 || results.vt.suspicious > 0) {
        isSuspicious = true;
      }
    }

    // Check AbuseIPDB
    if (results.abuseipdb?.success && results.abuseipdb?.configured) {
      const score = parseInt(results.abuseipdb.confidence_score) || 0;
      if (score > 40) {
        isMalicious = true;
      } else if (score > 10) {
        isSuspicious = true;
      }
    }

    // Check AlienVault OTX
    if (results.otx?.success && results.otx?.pulses > 0) {
      isSuspicious = true;
    }

    if (isMalicious) {
      return {
        label: 'Level 12',
        colorClass: 'bg-red-50 text-red-600 border-red-200',
        icon: <ShieldAlert className="w-5 h-5 shrink-0 text-red-500 animate-pulse" />
      };
    }

    if (isSuspicious) {
      return {
        label: 'Level 7',
        colorClass: 'bg-orange-50 text-orange-600 border-orange-200',
        icon: <AlertCircle className="w-5 h-5 shrink-0 text-orange-500" />
      };
    }

    return {
      label: 'Level 3',
      colorClass: 'bg-blue-50 text-blue-600 border-blue-200',
      icon: <CheckCircle2 className="w-5 h-5 shrink-0 text-blue-500" />
    };
  };

  const alertLevel = getAlertLevel();

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-gray-900 font-sans pb-12">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        
        {/* Top Header Row (Wazuh style tabs area) */}
        <div className="flex items-center justify-between border-b border-gray-200 mb-4 bg-white px-6 rounded-t-md">
          <div className="flex">
            <button className="px-6 py-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600 flex items-center gap-2">
              <Search className="w-4 h-4" />
              IP Analyzer
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-1 items-center bg-white border border-gray-200 rounded-md focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 px-4 py-2 shadow-sm transition-all">
              <Search className="h-4 w-4 text-gray-400 shrink-0 mr-3" />
              <input
                type="text"
                className="w-full bg-transparent border-0 outline-none text-sm placeholder-gray-400 text-gray-900 font-mono py-1"
                placeholder="Enter IP Address (e.g. 8.8.8.8)..."
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isAnalyzing || !ipAddress}
              className="px-6 py-2.5 bg-blue-50 text-blue-600 font-medium rounded-md border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Scan IP'}
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-4 font-medium flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}
        </div>

        {/* Results Area */}
        {results && (
          <div className="space-y-6">
            
            {/* Overview Card */}
            <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-mono font-medium tracking-tight text-gray-900">{results.ip}</h3>
                  {alertLevel && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border ${alertLevel.colorClass}`}>
                      {alertLevel.icon} {alertLevel.label}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-500 mt-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {results.location.city !== 'N/A' ? results.location.city + ', ' : ''}
                  {results.location.country} • {results.location.isp}
                </p>
              </div>
            </div>

            {/* Providers Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* 1. VirusTotal Section */}
              <div className="bg-white rounded-md border border-gray-200 shadow-sm flex flex-col">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-200">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[13px] text-gray-800">VirusTotal Analysis</h4>
                    </div>
                  </div>
                  {!results.vt.configured ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Key Missing
                    </span>
                  ) : (
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                <div className="p-5 flex-1">
                  {!results.vt.configured ? (
                    <div className="text-sm text-gray-500 leading-relaxed text-center py-10">
                      <p>API Key not configured.</p>
                    </div>
                  ) : !results.vt.success ? (
                    <div className="text-sm text-red-500 text-center py-10">
                      <p>Request Failed: {results.vt.error || 'Failed to query VT.'}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {/* Donut Chart for Engines */}
                      <div className="flex items-center justify-center gap-8 py-4">
                        {(() => {
                          const total = results.vt.engineCount;
                          const malicious = results.vt.malicious;
                          const suspicious = results.vt.suspicious;
                          const clean = total - malicious - suspicious;
                          
                          const malPct = total > 0 ? (malicious / total) * 100 : 0;
                          const susPct = total > 0 ? (suspicious / total) * 100 : 0;
                          
                          const conic = `conic-gradient(#ef4444 0% ${malPct}%, #f97316 ${malPct}% ${malPct + susPct}%, #10b981 ${malPct + susPct}% 100%)`;

                          return (
                            <>
                              <div className="relative w-32 h-32 rounded-full flex items-center justify-center" style={{ background: conic }}>
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-inner flex-col">
                                  <span className="text-2xl font-bold text-gray-800">{malicious + suspicious}</span>
                                  <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Flags</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-3 text-[12px] text-gray-600">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Malicious</div>
                                  <span className="font-bold text-gray-800">{malicious}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> Suspicious</div>
                                  <span className="font-bold text-gray-800">{suspicious}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Clean/Unrated</div>
                                  <span className="font-bold text-gray-800">{clean}</span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Network & Registry Details */}
                      <div>
                        <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3 border-b border-gray-100 pb-2">
                          Network Metadata
                        </h5>
                        <div className="space-y-1.5 text-xs text-gray-600">
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">IP Network Block</span>
                            <span className="font-mono font-medium">{results.vt.network || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">ASN Number</span>
                            <span className="font-mono font-medium">{results.vt.asn ? `AS${results.vt.asn}` : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">Autonomous System Owner</span>
                            <span className="font-medium truncate max-w-[200px] text-right">{results.vt.as_owner || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">Internet Registry</span>
                            <span className="font-medium uppercase">{results.vt.regional_internet_registry || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. AbuseIPDB Section */}
              <div className="bg-white rounded-md border border-gray-200 shadow-sm flex flex-col">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-200">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[13px] text-gray-800">AbuseIPDB Threat Check</h4>
                    </div>
                  </div>
                  {!results.abuseipdb.configured ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Key Missing
                    </span>
                  ) : (
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                <div className="p-5 flex-1">
                  {!results.abuseipdb.configured ? (
                    <div className="text-sm text-gray-500 leading-relaxed text-center py-10">
                      <p>API Key not configured.</p>
                    </div>
                  ) : !results.abuseipdb.success ? (
                    <div className="text-sm text-red-500 text-center py-10">
                      <p>Request Failed: {results.abuseipdb.error || 'Failed to query AbuseIPDB.'}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {/* Score Circle / Reports */}
                      <div className="flex items-center justify-center gap-8 py-4">
                        {(() => {
                          const score = parseInt(results.abuseipdb.confidence_score) || 0;
                          const color = score > 40 ? '#ef4444' : score > 10 ? '#f97316' : '#10b981';
                          const conic = `conic-gradient(${color} 0% ${score}%, #e5e7eb ${score}% 100%)`;
                          return (
                            <>
                              <div className="relative w-32 h-32 rounded-full flex items-center justify-center" style={{ background: conic }}>
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-inner flex-col">
                                  <span className="text-2xl font-bold text-gray-800">{score}%</span>
                                  <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Confidence</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-3 text-[12px] text-gray-600">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-gray-500">Total Reports</span>
                                  <span className="font-bold text-gray-800">{results.abuseipdb.reported_times}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-gray-500">Unique Reporters</span>
                                  <span className="font-bold text-gray-800">{results.abuseipdb.num_distinct_users}</span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Meta Details */}
                      <div>
                        <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3 border-b border-gray-100 pb-2">
                          Host & Usage Metadata
                        </h5>
                        <div className="space-y-1.5 text-xs text-gray-600">
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">Usage Classification</span>
                            <span className="font-medium">{results.abuseipdb.usage_type || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">IP Primary Domain</span>
                            <span className="font-mono font-medium text-blue-600">{results.abuseipdb.domain || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">ISP Provider</span>
                            <span className="font-medium truncate max-w-[200px] text-right">{results.abuseipdb.isp || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">Last Reported Incident</span>
                            <span className="font-medium">{results.abuseipdb.last_reported_at ? formatDate(results.abuseipdb.last_reported_at) : 'No incidents reported'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. AlienVault OTX Section */}
              <div className="bg-white rounded-md border border-gray-200 shadow-sm lg:col-span-2 flex flex-col">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-200">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[13px] text-gray-800">AlienVault OTX</h4>
                    </div>
                  </div>
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </div>

                <div className="p-5 flex-1">
                  {!results.otx.success ? (
                    <div className="text-sm text-red-500 py-10 text-center">
                      <p>Request Failed: {results.otx.error || 'Failed to query OTX.'}</p>
                    </div>
                  ) : (
                    <>
                      {/* Top metrics */}
                      <div className="flex items-center gap-6 mb-6">
                        <div className="flex flex-col items-center justify-center px-6 py-4 bg-gray-50 rounded border border-gray-200 min-w-[150px]">
                          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Active Pulses</span>
                          <span className={`text-3xl font-normal ${results.otx.pulses > 0 ? 'text-red-500' : 'text-gray-800'}`}>
                            {results.otx.pulses}
                          </span>
                        </div>
                        <div className="flex flex-col justify-center flex-1">
                          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Correlated Malware Families</span>
                          {results.otx.malware_family && results.otx.malware_family.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {results.otx.malware_family.map((mf: string) => (
                                <span key={mf} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold border border-red-200 uppercase tracking-wider">
                                  {mf}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">None identified</span>
                          )}
                        </div>
                      </div>

                      {/* Detailed Pulse List Table View */}
                      <div>
                        <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3 border-b border-gray-100 pb-2 flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5" /> Correlated Intelligence Pulses ({results.otx.pulses_details?.length || 0} shown)
                        </h5>

                        {results.otx.pulses_details && results.otx.pulses_details.length > 0 ? (
                          <div className="border border-gray-200 rounded-md overflow-hidden mt-3">
                            <table className="w-full text-left text-sm text-gray-600">
                              <thead className="text-[11px] font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="px-4 py-3">Pulse Name</th>
                                  <th className="px-4 py-3">Adversary</th>
                                  <th className="px-4 py-3">Tags</th>
                                  <th className="px-4 py-3 text-right">Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {results.otx.pulses_details.map((pulse: PulseDetail, index: number) => (
                                  <tr key={pulse.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-800 min-w-[200px]">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                        <span className="truncate max-w-[300px]" title={pulse.name}>{pulse.name}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      {pulse.adversary ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider">
                                          <User className="w-3 h-3" /> {pulse.adversary}
                                        </span>
                                      ) : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap gap-1">
                                        {pulse.tags && pulse.tags.slice(0, 3).map((tag: string) => (
                                          <span key={tag} className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 rounded text-[10px] font-medium">
                                            #{tag}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-xs whitespace-nowrap">
                                      {formatDate(pulse.created)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-md p-8 border border-gray-200 text-center text-sm text-gray-500 italic">
                            No related threat pulses found in the database. This IP address is not associated with active security campaigns.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
