"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, Loader2, Shield, AlertTriangle, AlertCircle, CheckCircle2, 
  Lock, Sparkles, Network, Calendar, HelpCircle, User, Activity, 
  FileText, ExternalLink, Globe, HardDrive, ShieldAlert, BadgeInfo
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
      if (results.vt.malicious > 2) {
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
        label: 'MALICIOUS',
        colorClass: 'bg-red-500/10 text-red-500 border-red-500/30',
        icon: <ShieldAlert className="w-5 h-5 shrink-0 text-red-500 animate-pulse" />
      };
    }

    if (isSuspicious) {
      return {
        label: 'SUSPICIOUS',
        colorClass: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
        icon: <AlertCircle className="w-5 h-5 shrink-0 text-orange-500" />
      };
    }

    return {
      label: 'CLEAN',
      colorClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      icon: <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
    };
  };

  const alertLevel = getAlertLevel();

  return (
    <div className="min-h-screen bg-base text-text-base font-sans pb-12">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 md:mt-10">
        
        {/* Title Area */}
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight text-text-base">IP Analyzer</h2>
          <p className="mt-2 text-text-muted text-sm md:text-base font-medium">Aggregated Threat Intelligence (VirusTotal, AlienVault OTX, AbuseIPDB).</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-1 items-center bg-[#1f1f1f] rounded-full shadow-[inset_0_0_0_1px_rgb(124,124,124)] focus-within:shadow-[inset_0_0_0_1px_white] px-5 py-3.5 transition-shadow">
              <Search className="h-5 w-5 text-text-muted shrink-0 mr-3" />
              <input
                type="text"
                className="w-full bg-transparent border-0 outline-none text-sm font-medium placeholder:text-text-muted text-text-base font-mono"
                placeholder="Enter IP Address (e.g. 8.8.8.8)..."
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isAnalyzing || !ipAddress}
              className="px-8 py-3.5 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px] tracking-wide"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SCAN IP'}
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-4 font-medium flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}
        </div>

        {/* Results Area */}
        {results && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Overview Card */}
            <div className="bg-surface p-6 rounded-lg border border-[#4d4d4d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
              <div>
                <h3 className="text-2xl font-mono font-bold tracking-tight">{results.ip}</h3>
                <p className="text-sm font-medium text-text-muted mt-2">
                  {results.location.city !== 'N/A' ? results.location.city + ', ' : ''}
                  {results.location.country} • {results.location.isp}
                </p>
              </div>
              <div className="text-right shrink-0">
                {alertLevel && (
                  <span className={`inline-flex items-center gap-2.5 px-4 py-2 border rounded-md font-bold text-sm tracking-wider ${alertLevel.colorClass}`}>
                    {alertLevel.icon} {alertLevel.label}
                  </span>
                )}
              </div>
            </div>

            {/* Providers Details Section */}
            <div className="space-y-8">
              
              {/* 1. VirusTotal Section */}
              <div className="bg-surface rounded-lg border border-[#4d4d4d] overflow-hidden shadow-md">
                <div className="p-5 border-b border-[#4d4d4d] flex items-center justify-between bg-[#1b1b1b]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-500 border border-blue-500/20">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">VirusTotal Analysis</h4>
                      <p className="text-xs text-text-muted">Multi-engine security scanning & reputation score</p>
                    </div>
                  </div>
                  {!results.vt.configured && (
                    <span className="text-[10px] px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Key Missing
                    </span>
                  )}
                </div>

                <div className="p-6">
                  {!results.vt.configured ? (
                    <div className="text-sm text-text-muted leading-relaxed">
                      <p>API Key not configured. Add <code className="bg-[#1f1f1f] px-1.5 py-0.5 rounded text-amber-500">VIRUSTOTAL_API_KEY</code> to your <code className="bg-[#1f1f1f] px-1.5 py-0.5 rounded">.env.local</code>.</p>
                    </div>
                  ) : !results.vt.success ? (
                    <div className="text-sm text-red-400">
                      <p>Request Failed: {results.vt.error || 'Failed to query VT.'}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left: Scan Stats & Engine Counts */}
                      <div className="space-y-5">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-500" /> Detection Engine Results
                        </h5>
                        
                        {/* Detection stats bar */}
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-3 text-xs flex rounded bg-[#1f1f1f] border border-[#4d4d4d]">
                            <div style={{ width: `${(results.vt.malicious / results.vt.engineCount) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500 transition-all"></div>
                            <div style={{ width: `${(results.vt.suspicious / results.vt.engineCount) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500 transition-all"></div>
                            <div style={{ width: `${(1 - (results.vt.malicious + results.vt.suspicious) / results.vt.engineCount) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all"></div>
                          </div>
                        </div>

                        {/* Detail counts grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="bg-[#1f1f1f] p-3 rounded-lg border border-[#4d4d4d] text-center">
                            <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">Malicious</span>
                            <span className={`text-xl font-mono font-bold ${results.vt.malicious > 0 ? 'text-red-500 animate-pulse' : 'text-text-base'}`}>{results.vt.malicious}</span>
                          </div>
                          <div className="bg-[#1f1f1f] p-3 rounded-lg border border-[#4d4d4d] text-center">
                            <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">Suspicious</span>
                            <span className={`text-xl font-mono font-bold ${results.vt.suspicious > 0 ? 'text-orange-500' : 'text-text-base'}`}>{results.vt.suspicious}</span>
                          </div>
                          <div className="bg-[#1f1f1f] p-3 rounded-lg border border-[#4d4d4d] text-center col-span-2 sm:col-span-1">
                            <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">Total Engines</span>
                            <span className="text-xl font-mono font-bold text-text-base">{results.vt.engineCount}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-text-muted bg-[#1f1f1f] p-3 rounded-lg border border-[#333]">
                          <span>Community Votes Reputation</span>
                          <span className={`font-mono font-bold ${results.vt.reputation < 0 ? 'text-red-400' : results.vt.reputation > 0 ? 'text-emerald-400' : ''}`}>
                            {results.vt.reputation > 0 ? `+${results.vt.reputation}` : results.vt.reputation}
                          </span>
                        </div>
                      </div>

                      {/* Right: Network & Registry Details */}
                      <div className="space-y-4">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                          <Network className="w-4 h-4 text-blue-500" /> Network Metadata
                        </h5>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-2 border-b border-[#333]">
                            <span className="text-text-muted">IP Network Block</span>
                            <span className="font-mono font-bold">{results.vt.network || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-[#333]">
                            <span className="text-text-muted">ASN Number</span>
                            <span className="font-mono font-bold">{results.vt.asn ? `AS${results.vt.asn}` : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-[#333]">
                            <span className="text-text-muted">Autonomous System Owner</span>
                            <span className="font-bold truncate max-w-[200px] text-right">{results.vt.as_owner || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-[#333]">
                            <span className="text-text-muted">Internet Registry</span>
                            <span className="font-bold uppercase">{results.vt.regional_internet_registry || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-text-muted">Last Analysis Updated</span>
                            <span className="font-bold text-xs">{formatUnixDate(results.vt.last_analysis_date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. AbuseIPDB Section */}
              <div className="bg-surface rounded-lg border border-[#4d4d4d] overflow-hidden shadow-md">
                <div className="p-5 border-b border-[#4d4d4d] flex items-center justify-between bg-[#1b1b1b]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-500 border border-purple-500/20">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">AbuseIPDB Threat Check</h4>
                      <p className="text-xs text-text-muted">IP Abuse reports database and confidence ratings</p>
                    </div>
                  </div>
                  {!results.abuseipdb.configured && (
                    <span className="text-[10px] px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Key Missing
                    </span>
                  )}
                </div>

                <div className="p-6">
                  {!results.abuseipdb.configured ? (
                    <div className="text-sm text-text-muted leading-relaxed">
                      <p>API Key not configured. Add <code className="bg-[#1f1f1f] px-1.5 py-0.5 rounded text-amber-500">ABUSEIPDB_API_KEY</code> to your <code className="bg-[#1f1f1f] px-1.5 py-0.5 rounded">.env.local</code>.</p>
                    </div>
                  ) : !results.abuseipdb.success ? (
                    <div className="text-sm text-red-400">
                      <p>Request Failed: {results.abuseipdb.error || 'Failed to query AbuseIPDB.'}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: Score Circle / Reports */}
                      <div className="flex flex-col justify-center items-center p-6 bg-[#171717] rounded-xl border border-[#4d4d4d] space-y-4">
                        <div className="text-center">
                          <span className="text-xs uppercase tracking-wider font-bold text-text-muted">Abuse Confidence Score</span>
                          <div className={`text-4xl font-mono font-black mt-2 ${parseInt(results.abuseipdb.confidence_score) > 30 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {results.abuseipdb.confidence_score}
                          </div>
                        </div>
                        <div className="w-full border-t border-[#333] pt-4 flex justify-around text-center">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-text-muted block">Total Reports</span>
                            <span className={`text-lg font-mono font-bold ${results.abuseipdb.reported_times > 0 ? 'text-red-500' : 'text-text-base'}`}>{results.abuseipdb.reported_times}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-text-muted block">Unique Reporters</span>
                            <span className="text-lg font-mono font-bold text-text-base">{results.abuseipdb.num_distinct_users}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Meta Details */}
                      <div className="space-y-4">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                          <BadgeInfo className="w-4 h-4 text-purple-500" /> Host & Usage Metadata
                        </h5>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-2 border-b border-[#333]">
                            <span className="text-text-muted">Usage Classification</span>
                            <span className="font-bold">{results.abuseipdb.usage_type || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-[#333]">
                            <span className="text-text-muted">IP Primary Domain</span>
                            <span className="font-mono font-bold text-primary">{results.abuseipdb.domain || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-[#333]">
                            <span className="text-text-muted">ISP Provider</span>
                            <span className="font-bold truncate max-w-[200px] text-right">{results.abuseipdb.isp || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-text-muted">Last Reported Incident</span>
                            <span className="font-bold text-xs">{results.abuseipdb.last_reported_at ? formatDate(results.abuseipdb.last_reported_at) : 'No incidents reported'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. AlienVault OTX Section */}
              <div className="bg-surface rounded-lg border border-[#4d4d4d] overflow-hidden shadow-md">
                <div className="p-5 border-b border-[#4d4d4d] flex items-center justify-between bg-[#1b1b1b]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">AlienVault OTX</h4>
                      <p className="text-xs text-text-muted">Open Threat Exchange pulses and campaign correlation</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-500" /> Public Info
                  </span>
                </div>

                <div className="p-6 space-y-6">
                  {!results.otx.success ? (
                    <div className="text-sm text-red-400">
                      <p>Request Failed: {results.otx.error || 'Failed to query OTX.'}</p>
                    </div>
                  ) : (
                    <>
                      {/* Top quick metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#1f1f1f] p-4 rounded-lg border border-[#4d4d4d] flex items-center justify-between">
                          <span className="text-sm font-semibold text-text-muted">Active Threat Pulses</span>
                          <span className={`text-2xl font-mono font-black ${results.otx.pulses > 0 ? 'text-red-500' : 'text-text-muted'}`}>
                            {results.otx.pulses}
                          </span>
                        </div>
                        <div className="bg-[#1f1f1f] p-4 rounded-lg border border-[#4d4d4d] flex flex-col justify-center space-y-2">
                          <span className="text-xs font-bold text-text-muted uppercase">Correlated Malware Families</span>
                          {results.otx.malware_family && results.otx.malware_family.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {results.otx.malware_family.map((mf: string) => (
                                <span key={mf} className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-bold border border-red-500/20">
                                  {mf}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted italic">None identified</span>
                          )}
                        </div>
                      </div>

                      {/* Detailed Pulse List */}
                      <div>
                        <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400" /> Correlated Intelligence Pulses ({results.otx.pulses_details?.length || 0} shown)
                        </h5>

                        {results.otx.pulses_details && results.otx.pulses_details.length > 0 ? (
                          <div className="space-y-4">
                            {results.otx.pulses_details.map((pulse: PulseDetail, index: number) => (
                              <div 
                                key={pulse.id}
                                className="bg-[#171717] rounded-lg border border-[#4d4d4d] p-5 hover:border-indigo-500/40 transition-all space-y-3"
                              >
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <h6 className="font-bold text-sm md:text-base text-text-base flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                                    {pulse.name}
                                  </h6>
                                  {pulse.adversary && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                                      <User className="w-3.5 h-3.5" /> {pulse.adversary}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs md:text-sm text-text-muted leading-relaxed">
                                  {pulse.description}
                                </p>

                                <div className="flex flex-wrap gap-2 pt-1.5 border-t border-[#333] justify-between items-center gap-y-3">
                                  <div className="flex flex-wrap gap-1">
                                    {pulse.tags && pulse.tags.slice(0, 4).map((tag: string) => (
                                      <span key={tag} className="px-2 py-0.5 bg-[#2a2a2a] text-gray-400 rounded text-[10px] font-semibold">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                  <span className="text-[10px] text-text-muted flex items-center gap-1 font-mono">
                                    <Calendar className="w-3 h-3" /> {formatDate(pulse.created)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-[#171717] rounded-lg p-5 border border-[#333] text-center text-xs md:text-sm text-text-muted italic">
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