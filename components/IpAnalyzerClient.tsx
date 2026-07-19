"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, Loader2, Shield, AlertTriangle, AlertCircle, CheckCircle2, 
  Lock, Network, Calendar, User, 
  FileText, ExternalLink, Globe, ShieldAlert,
  ChevronDown, ChevronUp, Crosshair
} from 'lucide-react';

interface PulseDetail {
  id: string;
  name: string;
  description: string;
  created: string | null;
  adversary: string | null;
  tags: string[];
}

interface AbuseReportDetail {
  reported_at: string | null;
  comment: string;
  categories: number[];
  reporter_id: number | null;
  reporter_country_code: string | null;
  reporter_country_name: string | null;
}

function BrandBadge({ src, alt }: { src: string; alt: string }) {
  return (
    <img src={src} alt={alt} className="h-7 w-auto object-contain" />
  );
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
  const [openAbuseReportIndex, setOpenAbuseReportIndex] = useState<number | null>(null);

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

  useEffect(() => {
    setOpenAbuseReportIndex(null);
  }, [results?.ip]);

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
    <div className="min-h-screen bg-base text-text-base font-sans pb-24">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 md:pt-16">
        
        {/* Page Header */}
        <div className="mb-16">
          <h1 className="text-headline-display text-text-base mb-4">
            IP Threat Analyzer
          </h1>
          <p className="text-body-lg text-text-muted">
            Multi-source intelligence analysis
          </p>
        </div>

        {/* Search */}
        <div className="mb-16">
          <form onSubmit={handleAnalyze} className="flex gap-4 max-w-2xl">
            <input
              type="text"
              className="floating-input flex-1"
              placeholder="Enter IPv4 or IPv6 Address..."
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
            <button
              type="submit"
              disabled={isAnalyzing || !ipAddress}
              className="btn-primary shrink-0 disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Scan IP'}
            </button>
          </form>
          {error && <p className="text-error text-label-sm mt-4 font-medium flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}
        </div>

        {/* Results Area */}
        {results && (
          <div className="space-y-10 animate-fade-in-up">
            
            {/* Overview */}
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-headline-display font-mono text-text-base">{results.ip}</h3>
                {alertLevel && (
                  <span className={`badge ${alertLevel.className} px-3 py-1 text-sm rounded-full`}>
                    {alertLevel.icon} {alertLevel.label}
                  </span>
                )}
              </div>
              <p className="text-body-md text-text-muted flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {results.location.city !== 'N/A' ? results.location.city + ', ' : ''}
                {results.location.country} • {results.location.isp}
              </p>
            </div>

            {/* Providers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* VirusTotal */}
              <div className="section-panel">
                <div className="section-panel-header">
                  <h3 className="text-headline-sm flex items-center gap-3">
                    <BrandBadge src="/Virustotal_logo.png" alt="VirusTotal" />
                    <span>VirusTotal</span>
                    <span className="text-label-sm text-text-muted font-medium hidden sm:inline">Malware reputation</span>
                  </h3>
                  {!results.vt.configured && (
                    <span className="badge badge-low text-xs flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Key Missing
                    </span>
                  )}
                </div>

                <div>
                  {!results.vt.configured ? (
                    <div className="text-body-sm text-text-muted text-center py-10">API Key not configured.</div>
                  ) : !results.vt.success ? (
                    <div className="text-body-sm text-error text-center py-10">Request Failed: {results.vt.error || 'Failed to query VT.'}</div>
                  ) : (
                    <div className="flex flex-col gap-8">
                      {/* Security Vendor Flagged */}
                      <div className="flex flex-col items-center justify-center py-6">
                        {(() => {
                          const malicious = results.vt.malicious;
                          const total = results.vt.engineCount || 1;
                          const isMalicious = malicious > 0;
                          
                          const radius = 70;
                          const strokeWidth = 8;
                          const normalizedRadius = radius - strokeWidth / 2;
                          const circumference = normalizedRadius * 2 * Math.PI;
                          
                          const ratio = malicious / total;
                          const strokeDashoffset = circumference - (ratio * circumference);

                          return (
                            <div className="flex flex-col items-center">
                              <div className="relative flex items-center justify-center mb-6">
                                <svg
                                  height={radius * 2}
                                  width={radius * 2}
                                  className="transform -rotate-90"
                                >
                                  {/* Background Ring */}
                                  <circle
                                    stroke="var(--color-border)"
                                    fill="transparent"
                                    strokeWidth={strokeWidth}
                                    r={normalizedRadius}
                                    cx={radius}
                                    cy={radius}
                                  />
                                  {/* Colored Ring */}
                                  <circle
                                    stroke={isMalicious ? "#f87171" : "#4ade80"}
                                    fill="transparent"
                                    strokeWidth={strokeWidth}
                                    strokeLinecap="round"
                                    strokeDasharray={circumference + ' ' + circumference}
                                    style={{ 
                                      strokeDashoffset: isMalicious ? strokeDashoffset : 0,
                                      transition: "stroke-dashoffset 1s ease-in-out"
                                    }}
                                    r={normalizedRadius}
                                    cx={radius}
                                    cy={radius}
                                  />
                                </svg>
                                
                                {/* Inner Text */}
                                <div className="absolute flex flex-col items-center justify-center">
                                  <span className={`text-5xl font-medium tracking-tight ${isMalicious ? 'text-[#f87171]' : 'text-[#4ade80]'}`}>
                                    {malicious}
                                  </span>
                                  <span className="text-body-sm text-text-muted font-medium">
                                    / {total}
                                  </span>
                                </div>
                              </div>
                              <p className="text-body-md text-text-muted">
                                Security vendors flagged this IP as malicious
                              </p>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Network Metadata */}
                      <div>
                        <h5 className="text-label-md text-text-muted mb-4">
                          Network Metadata
                        </h5>
                        <div className="space-y-3">
                          {[
                            ['IP Network Block', results.vt.network || 'Unknown'],
                            ['ASN Number', results.vt.asn ? `AS${results.vt.asn}` : 'N/A'],
                            ['AS Owner', results.vt.as_owner || 'N/A'],
                            ['Registry', results.vt.regional_internet_registry || 'N/A'],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-body-sm text-text-muted">{label}</span>
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
                  <h3 className="text-headline-sm flex items-center gap-3">
                    <BrandBadge src="/AbuselPDB-icon.png" alt="AbuseIPDB" />
                    <span>AbuseIPDB</span>
                    <span className="text-label-sm text-text-muted font-medium hidden sm:inline">Abuse score</span>
                  </h3>
                  {!results.abuseipdb.configured && (
                    <span className="badge badge-low text-xs flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Key Missing
                    </span>
                  )}
                </div>

                <div>
                  {!results.abuseipdb.configured ? (
                    <div className="text-body-sm text-text-muted text-center py-10">API Key not configured.</div>
                  ) : !results.abuseipdb.success ? (
                    <div className="text-body-sm text-error text-center py-10">Request Failed: {results.abuseipdb.error || 'Failed to query AbuseIPDB.'}</div>
                  ) : (
                    <div className="flex flex-col gap-8">
                      <div className="flex items-center justify-center gap-10">
                        {(() => {
                          const score = parseInt(results.abuseipdb.confidence_score) || 0;
                          const color = score > 40 ? '#d64545' : score > 10 ? '#f59e0b' : '#2f9e44';
                          const conic = `conic-gradient(${color} 0% ${score}%, var(--color-surface) ${score}% 100%)`;
                          return (
                            <>
                              <div className="relative w-36 h-36 rounded-full flex items-center justify-center" style={{ background: conic }}>
                                <div className="w-28 h-28 bg-neutral rounded-full flex items-center justify-center flex-col">
                                  <span className="text-headline-md font-bold text-text-base">{score}%</span>
                                  <span className="text-caption text-text-muted uppercase tracking-wider">Score</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-4 text-label-sm">
                                <div className="flex items-center justify-between gap-6">
                                  <span className="text-text-muted">Total Reports</span>
                                  <span className="font-bold text-label-md">{results.abuseipdb.reported_times}</span>
                                </div>
                                <div className="flex items-center justify-between gap-6">
                                  <span className="text-text-muted">Unique Reporters</span>
                                  <span className="font-bold text-label-md">{results.abuseipdb.num_distinct_users}</span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <div>
                        <h5 className="text-label-md text-text-muted mb-4">Host & Usage Metadata</h5>
                        <div className="space-y-3">
                          {[
                            ['IP Version', results.abuseipdb.ip_version ? `IPv${results.abuseipdb.ip_version}` : 'N/A'],
                            ['Public IP', results.abuseipdb.is_public === null ? 'N/A' : results.abuseipdb.is_public ? 'Yes' : 'No'],
                            ['Whitelisted', results.abuseipdb.is_whitelisted === null ? 'N/A' : results.abuseipdb.is_whitelisted ? 'Yes' : 'No'],
                            ['Tor Exit Node', results.abuseipdb.is_tor === null ? 'N/A' : results.abuseipdb.is_tor ? 'Yes' : 'No'],
                            ['Usage Classification', results.abuseipdb.usage_type || 'Unknown'],
                            ['Primary Domain', results.abuseipdb.domain || 'N/A'],
                            ['ISP Provider', results.abuseipdb.isp || 'N/A'],
                            ['Country', results.abuseipdb.country_name || results.abuseipdb.country || 'N/A'],
                            ['Last Reported', results.abuseipdb.last_reported_at ? formatDate(results.abuseipdb.last_reported_at) : 'No incidents'],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-body-sm text-text-muted">{label}</span>
                              <span className="font-medium text-text-base text-right max-w-[200px] truncate">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </div>

              {/* AbuseIPDB Report Details — spans full width */}
              <div className="section-panel lg:col-span-2">
                <div className="section-panel-header">
                  <h3 className="text-headline-sm flex items-center gap-3">
                    <BrandBadge src="/AbuselPDB-icon.png" alt="AbuseIPDB" />
                    <span>Abuse Reports</span>
                    <span className="text-label-sm text-text-muted font-medium hidden sm:inline">Recent submissions</span>
                  </h3>
                  <span className="badge badge-low text-xs">
                    {results.abuseipdb.reports_details?.length || 0} reports
                  </span>
                </div>

                {results.abuseipdb.reports_details && results.abuseipdb.reports_details.length > 0 ? (
                  <div className="space-y-3">
                    {results.abuseipdb.reports_details.map((report: AbuseReportDetail, index: number) => {
                      const isOpen = openAbuseReportIndex === index;

                      return (
                        <div key={`${report.reported_at || 'report'}-${index}`} className="rounded-xl border border-border/60 bg-surface/60 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setOpenAbuseReportIndex(isOpen ? null : index)}
                            className="w-full flex items-center justify-between gap-4 px-4 py-4 text-left hover:bg-surface/80 transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-text-base font-medium">
                                <Calendar className="w-4 h-4 text-tertiary shrink-0" />
                                <span className="truncate">{formatDate(report.reported_at)}</span>
                              </div>
                              <p className="text-xs text-text-muted mt-1 truncate">
                                Reporter: {report.reporter_country_name || report.reporter_country_code || 'Unknown'}
                                {report.reporter_id ? ` • ID ${report.reporter_id}` : ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-[280px]">
                                {report.categories && report.categories.length > 0 ? (
                                  report.categories.slice(0, 3).map((category) => (
                                    <span key={`${report.reported_at || 'report'}-${category}`} className="badge badge-low text-[10px] px-2 py-1 rounded-full">
                                      Category {category}
                                    </span>
                                  ))
                                ) : (
                                  <span className="badge badge-low text-[10px] px-2 py-1 rounded-full">No categories</span>
                                )}
                              </div>
                              {isOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                            </div>
                          </button>

                          {isOpen && (
                            <div className="px-4 pb-4 border-t border-border/50">
                              <div className="pt-4 flex flex-wrap gap-2 mb-4">
                                {report.categories && report.categories.length > 0 ? (
                                  report.categories.map((category) => (
                                    <span key={`${report.reported_at || 'report'}-${category}`} className="badge badge-low text-[10px] px-2 py-1 rounded-full">
                                      Category {category}
                                    </span>
                                  ))
                                ) : (
                                  <span className="badge badge-low text-[10px] px-2 py-1 rounded-full">No categories</span>
                                )}
                              </div>

                              <p className="text-sm text-text-base leading-6 break-words whitespace-pre-line">
                                {report.comment}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-surface rounded-lg p-8 text-center text-body-md text-text-muted italic">
                    No detailed reports were returned for this IP.
                  </div>
                )}
              </div>

              {/* AlienVault OTX — spans full width */}
              <div className="section-panel lg:col-span-2">
                <div className="section-panel-header">
                  <h3 className="text-headline-sm flex items-center gap-3">
                    <BrandBadge src="/alienvault-otx-logo.png" alt="AlienVault OTX" />
                    <span>AlienVault OTX</span>
                    <span className="text-label-sm text-text-muted font-medium hidden sm:inline">Pulses</span>
                  </h3>
                </div>

                <div>
                  {!results.otx.success ? (
                    <div className="text-body-sm text-error py-10 text-center">Request Failed: {results.otx.error || 'Failed to query OTX.'}</div>
                  ) : (
                    <>
                      {/* Top metrics */}
                      <div className="flex items-center gap-12 mb-8">
                        <div className="flex flex-col">
                          <span className="text-label-sm text-text-muted mb-1 uppercase tracking-widest">Active Pulses</span>
                          <span className={`text-headline-md font-mono ${results.otx.pulses > 0 ? 'text-error' : 'text-text-base'}`}>
                            {results.otx.pulses}
                          </span>
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="text-label-sm text-text-muted mb-2 uppercase tracking-widest">Correlated Malware Families</span>
                          {results.otx.malware_family && results.otx.malware_family.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {results.otx.malware_family.map((mf: string) => (
                                <span key={mf} className="badge badge-critical text-sm px-3 py-1 rounded-full">
                                  {mf}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-body-sm text-text-muted italic">None identified</span>
                          )}
                        </div>
                      </div>

                      {/* Pulse List */}
                      <div>
                        <h5 className="text-label-md text-text-muted mb-4 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Intelligence Pulses ({results.otx.pulses_details?.length || 0})
                        </h5>

                        {results.otx.pulses_details && results.otx.pulses_details.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="clean-table">
                              <thead>
                                <tr>
                                  <th>Pulse Name</th>
                                  <th>Adversary</th>
                                  <th>Tags</th>
                                  <th className="text-right">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {results.otx.pulses_details.map((pulse: PulseDetail, index: number) => (
                                  <tr key={pulse.id}>
                                    <td className="font-medium text-text-base min-w-[300px]">
                                      <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-tertiary shrink-0" />
                                        <span className="truncate max-w-[400px]" title={pulse.name}>{pulse.name}</span>
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap">
                                      {pulse.adversary ? (
                                        <span className="badge badge-critical px-2 py-1 rounded-full">
                                          <User className="w-3 h-3" /> {pulse.adversary}
                                        </span>
                                      ) : '-'}
                                    </td>
                                    <td>
                                      <div className="flex flex-wrap gap-1">
                                        {pulse.tags && pulse.tags.slice(0, 3).map((tag: string) => (
                                          <span key={tag} className="badge badge-low text-[10px] px-2 py-1 rounded-full">
                                            #{tag}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="text-right text-sm whitespace-nowrap text-text-muted">
                                      {formatDate(pulse.created)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-surface rounded-lg p-8 text-center text-body-md text-text-muted italic">
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
