"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, Loader2, Shield, AlertTriangle, AlertCircle, CheckCircle2, 
  Lock, Network, Calendar, User, 
  FileText, ExternalLink, Globe, ShieldAlert,
  MoreVertical, Crosshair
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
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
      setError('Please enter a valid IP address.');
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

  useEffect(() => {
    const ipParam = searchParams.get('ip');
    if (ipParam) {
      setIpAddress(ipParam);
      runAnalysis(ipParam);
    }
  }, [searchParams, runAnalysis]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedIp = ipAddress.trim();
    if (!trimmedIp) return;
    setIpAddress(trimmedIp);
    runAnalysis(trimmedIp);
  };

  const getAlertLevel = () => {
    if (!results) return null;

    let isMalicious = false;
    let isSuspicious = false;

    if (results.vt?.success && results.vt?.configured) {
      if (results.vt.malicious > 5) isMalicious = true;
      else if (results.vt.malicious > 0 || results.vt.suspicious > 0) isSuspicious = true;
    }

    if (results.abuseipdb?.success && results.abuseipdb?.configured) {
      const score = parseInt(results.abuseipdb.confidence_score) || 0;
      if (score > 40) isMalicious = true;
      else if (score > 10) isSuspicious = true;
    }

    if (results.otx?.success && results.otx?.pulses > 0) isSuspicious = true;

    if (isMalicious) {
      return {
        label: 'Malicious',
        className: 'badge-critical',
        icon: <ShieldAlert className="w-4 h-4 animate-pulse" />
      };
    }

    if (isSuspicious) {
      return {
        label: 'Suspicious',
        className: 'badge-high',
        icon: <AlertCircle className="w-4 h-4" />
      };
    }

    return {
      label: 'Clean',
      className: 'badge-success',
      icon: <CheckCircle2 className="w-4 h-4" />
    };
  };

  const alertLevel = getAlertLevel();

  return (
    <div className="min-h-screen bg-base text-text-base font-sans pb-12">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 md:pt-8">
        
        {/* Page Header */}
        <div className="page-header">
          <div className="page-icon">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <h1>IP Threat Analyzer</h1>
            <p className="text-sm text-text-muted mt-0.5">Multi-source intelligence analysis</p>
          </div>
        </div>

        {/* Search — floating */}
        <div className="mb-8">
          <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-3">
            <div className="floating-input flex items-center gap-3 flex-1">
              <Search className="h-4 w-4 text-text-muted shrink-0" />
              <input
                type="text"
                className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-text-muted text-text-base font-mono py-0.5"
                placeholder="Enter IPv4 or IPv6 Address..."
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isAnalyzing || !ipAddress}
              className="btn-primary px-6 shrink-0 disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Scan IP'}
            </button>
          </form>
          {error && <p className="text-error text-sm mt-3 font-medium flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}
        </div>

        {/* Results Area */}
        {results && (
          <div className="space-y-8 animate-fade-in-up">
            
            {/* Overview — inline, no card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-mono font-bold tracking-tight text-text-base">{results.ip}</h3>
                  {alertLevel && (
                    <span className={`badge ${alertLevel.className} text-xs`}>
                      {alertLevel.icon} {alertLevel.label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-muted mt-1.5 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {results.location.city !== 'N/A' ? results.location.city + ', ' : ''}
                  {results.location.country} • {results.location.isp}
                </p>
              </div>
            </div>

            {/* Providers — section panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* VirusTotal */}
              <div className="section-panel">
                <div className="section-panel-header">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-tertiary/10 flex items-center justify-center text-tertiary border border-tertiary/20">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="!text-sm">VirusTotal Analysis</h3>
                  </div>
                  {!results.vt.configured && (
                    <span className="badge badge-low text-[9px] flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Key Missing
                    </span>
                  )}
                </div>

                <div className="p-5">
                  {!results.vt.configured ? (
                    <div className="text-sm text-text-muted text-center py-10">API Key not configured.</div>
                  ) : !results.vt.success ? (
                    <div className="text-sm text-error text-center py-10">Request Failed: {results.vt.error || 'Failed to query VT.'}</div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {/* Donut */}
                      <div className="flex items-center justify-center gap-6 py-2">
                        {(() => {
                          const total = results.vt.engineCount;
                          const malicious = results.vt.malicious;
                          const suspicious = results.vt.suspicious;
                          const clean = total - malicious - suspicious;
                          const malPct = total > 0 ? (malicious / total) * 100 : 0;
                          const susPct = total > 0 ? (suspicious / total) * 100 : 0;
                          const conic = `conic-gradient(#d64545 0% ${malPct}%, #f59e0b ${malPct}% ${malPct + susPct}%, #2f9e44 ${malPct + susPct}% 100%)`;

                          return (
                            <>
                              <div className="relative w-28 h-28 rounded-full flex items-center justify-center" style={{ background: conic }}>
                                <div className="w-20 h-20 bg-neutral rounded-full flex items-center justify-center flex-col">
                                  <span className="text-xl font-bold text-text-base">{malicious + suspicious}</span>
                                  <span className="text-[9px] text-text-muted font-semibold uppercase tracking-wider">Flags</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2.5 text-[11px] text-text-muted">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#d64545]"></div> Malicious</div>
                                  <span className="font-bold text-text-base">{malicious}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div> Suspicious</div>
                                  <span className="font-bold text-text-base">{suspicious}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#2f9e44]"></div> Clean</div>
                                  <span className="font-bold text-text-base">{clean}</span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Network Metadata */}
                      <div>
                        <h5 className="metric-label mb-3 pb-2 border-b border-border flex items-center gap-1.5">
                          Network Metadata
                        </h5>
                        <div className="space-y-2 text-xs text-text-muted">
                          {[
                            ['IP Network Block', results.vt.network || 'Unknown'],
                            ['ASN Number', results.vt.asn ? `AS${results.vt.asn}` : 'N/A'],
                            ['AS Owner', results.vt.as_owner || 'N/A'],
                            ['Registry', results.vt.regional_internet_registry || 'N/A'],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between py-1">
                              <span>{label}</span>
                              <span className="font-mono font-medium text-text-base text-right max-w-[200px] truncate">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AbuseIPDB */}
              <div className="section-panel">
                <div className="section-panel-header">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="!text-sm">AbuseIPDB Threat Check</h3>
                  </div>
                  {!results.abuseipdb.configured && (
                    <span className="badge badge-low text-[9px] flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Key Missing
                    </span>
                  )}
                </div>

                <div className="p-5">
                  {!results.abuseipdb.configured ? (
                    <div className="text-sm text-text-muted text-center py-10">API Key not configured.</div>
                  ) : !results.abuseipdb.success ? (
                    <div className="text-sm text-error text-center py-10">Request Failed: {results.abuseipdb.error || 'Failed to query AbuseIPDB.'}</div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-center gap-6 py-2">
                        {(() => {
                          const score = parseInt(results.abuseipdb.confidence_score) || 0;
                          const color = score > 40 ? '#d64545' : score > 10 ? '#f59e0b' : '#2f9e44';
                          const conic = `conic-gradient(${color} 0% ${score}%, var(--muted) ${score}% 100%)`;
                          return (
                            <>
                              <div className="relative w-28 h-28 rounded-full flex items-center justify-center" style={{ background: conic }}>
                                <div className="w-20 h-20 bg-neutral rounded-full flex items-center justify-center flex-col">
                                  <span className="text-xl font-bold text-text-base">{score}%</span>
                                  <span className="text-[9px] text-text-muted font-semibold uppercase tracking-wider">Score</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2.5 text-[11px] text-text-muted">
                                <div className="flex items-center justify-between gap-4">
                                  <span>Total Reports</span>
                                  <span className="font-bold text-text-base">{results.abuseipdb.reported_times}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span>Unique Reporters</span>
                                  <span className="font-bold text-text-base">{results.abuseipdb.num_distinct_users}</span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <div>
                        <h5 className="metric-label mb-3 pb-2 border-b border-border">Host & Usage Metadata</h5>
                        <div className="space-y-2 text-xs text-text-muted">
                          {[
                            ['Usage Classification', results.abuseipdb.usage_type || 'Unknown'],
                            ['Primary Domain', results.abuseipdb.domain || 'N/A'],
                            ['ISP Provider', results.abuseipdb.isp || 'N/A'],
                            ['Last Reported', results.abuseipdb.last_reported_at ? formatDate(results.abuseipdb.last_reported_at) : 'No incidents'],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between py-1">
                              <span>{label}</span>
                              <span className="font-medium text-text-base text-right max-w-[200px] truncate">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AlienVault OTX — spans full width */}
              <div className="section-panel lg:col-span-2">
                <div className="section-panel-header">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-sky-500/10 flex items-center justify-center text-sky-500 border border-sky-500/20">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="!text-sm">AlienVault OTX</h3>
                  </div>
                </div>

                <div className="p-5">
                  {!results.otx.success ? (
                    <div className="text-sm text-error py-10 text-center">Request Failed: {results.otx.error || 'Failed to query OTX.'}</div>
                  ) : (
                    <>
                      {/* Top metrics — inline, not card */}
                      <div className="flex items-center gap-8 mb-6 pb-6 border-b border-border">
                        <div className="flex flex-col">
                          <span className="metric-label mb-1">Active Pulses</span>
                          <span className={`text-3xl font-bold ${results.otx.pulses > 0 ? 'text-error' : 'text-text-base'}`}>
                            {results.otx.pulses}
                          </span>
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="metric-label mb-2">Correlated Malware Families</span>
                          {results.otx.malware_family && results.otx.malware_family.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {results.otx.malware_family.map((mf: string) => (
                                <span key={mf} className="badge badge-critical">
                                  {mf}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted italic">None identified</span>
                          )}
                        </div>
                      </div>

                      {/* Pulse List */}
                      <div>
                        <h5 className="metric-label mb-3 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> Intelligence Pulses ({results.otx.pulses_details?.length || 0})
                        </h5>

                        {results.otx.pulses_details && results.otx.pulses_details.length > 0 ? (
                          <div className="overflow-hidden rounded-lg border border-border mt-3">
                            <table className="clean-table">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2.5">Pulse Name</th>
                                  <th className="px-4 py-2.5">Adversary</th>
                                  <th className="px-4 py-2.5">Tags</th>
                                  <th className="px-4 py-2.5 text-right">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {results.otx.pulses_details.map((pulse: PulseDetail, index: number) => (
                                  <tr key={pulse.id}>
                                    <td className="px-4 py-2.5 font-medium text-text-base min-w-[200px]">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0" />
                                        <span className="truncate max-w-[300px]" title={pulse.name}>{pulse.name}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5 whitespace-nowrap">
                                      {pulse.adversary ? (
                                        <span className="badge badge-critical">
                                          <User className="w-3 h-3" /> {pulse.adversary}
                                        </span>
                                      ) : '-'}
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <div className="flex flex-wrap gap-1">
                                        {pulse.tags && pulse.tags.slice(0, 3).map((tag: string) => (
                                          <span key={tag} className="badge badge-low text-[9px]">
                                            #{tag}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap">
                                      {formatDate(pulse.created)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-surface rounded-lg p-8 text-center text-sm text-text-muted italic">
                            No related threat pulses found. This IP is not associated with active campaigns.
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
