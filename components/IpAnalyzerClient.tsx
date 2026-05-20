"use client";

import React, { useState } from 'react';
import { Search, Loader2, Shield, AlertTriangle, AlertCircle, CheckCircle2, Lock, Sparkles } from 'lucide-react';

export default function IpAnalyzerClient() {
  const [ipAddress, setIpAddress] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipAddress) return;

    // Basic IP validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ipAddress)) {
      setError('Please enter a valid IPv4 address.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setResults(null);

    try {
      const res = await fetch(`/api/analyze-ip?ip=${encodeURIComponent(ipAddress)}`);
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
        colorClass: 'bg-red-500/10 text-red-500 border-red-500/20',
        icon: <AlertTriangle className="w-4 h-4 shrink-0" />
      };
    }

    if (isSuspicious) {
      return {
        label: 'SUSPICIOUS',
        colorClass: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        icon: <AlertCircle className="w-4 h-4 shrink-0" />
      };
    }

    return {
      label: 'CLEAN',
      colorClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      icon: <CheckCircle2 className="w-4 h-4 shrink-0" />
    };
  };

  const alertLevel = getAlertLevel();

  return (
    <div className="min-h-screen bg-base text-text-base font-sans pb-12">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 md:mt-10">
        
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
                className="w-full bg-transparent border-0 outline-none text-sm font-medium placeholder:text-text-muted text-text-base"
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Overview Card */}
            <div className="bg-surface p-6 rounded-lg border border-[#4d4d4d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
              <div>
                <h3 className="text-xl font-mono font-bold">{results.ip}</h3>
                <p className="text-sm font-medium text-text-muted mt-1">
                  {results.location.city !== 'N/A' ? results.location.city + ', ' : ''}
                  {results.location.country} - {results.location.isp}
                </p>
              </div>
              <div className="text-right shrink-0">
                {alertLevel && (
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-md font-bold text-sm ${alertLevel.colorClass}`}>
                    {alertLevel.icon} {alertLevel.label}
                  </span>
                )}
              </div>
            </div>

            {/* Providers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* VirusTotal */}
              <div className="bg-surface p-5 rounded-lg border border-[#4d4d4d] flex flex-col justify-between min-h-[180px] shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500">
                        <Shield className="w-4 h-4" />
                      </div>
                      <h4 className="font-semibold">VirusTotal</h4>
                    </div>
                    {!results.vt.configured && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Key Missing
                      </span>
                    )}
                  </div>

                  {!results.vt.configured ? (
                    <div className="text-xs text-text-muted space-y-2 mt-2 leading-relaxed">
                      <p>API Key not configured. Add <code className="bg-[#1f1f1f] px-1 rounded text-amber-500">VIRUSTOTAL_API_KEY</code> to your <code className="bg-[#1f1f1f] px-1.5 py-0.5 rounded">.env.local</code>.</p>
                    </div>
                  ) : !results.vt.success ? (
                    <div className="text-xs text-red-400 space-y-2 mt-2">
                      <p>Request Failed: {results.vt.error || 'Failed to query VT.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-medium">Malicious</span>
                        <span className={`${results.vt.malicious > 0 ? 'text-red-500' : 'text-text-muted'} font-bold font-mono`}>
                          {results.vt.malicious}/{results.vt.engineCount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-medium">Suspicious</span>
                        <span className={`${results.vt.suspicious > 0 ? 'text-orange-500' : 'text-text-muted'} font-bold font-mono`}>
                          {results.vt.suspicious}/{results.vt.engineCount}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AlienVault OTX */}
              <div className="bg-surface p-5 rounded-lg border border-[#4d4d4d] flex flex-col justify-between min-h-[180px] shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-500">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <h4 className="font-semibold">AlienVault OTX</h4>
                    </div>
                    {/* OTX is open, so it's always configured */}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Public
                    </span>
                  </div>

                  {!results.otx.success ? (
                    <div className="text-xs text-red-400 space-y-2 mt-2">
                      <p>Request Failed: {results.otx.error || 'Failed to query OTX.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-medium">Related Pulses</span>
                        <span className={`font-mono font-bold ${results.otx.pulses > 0 ? 'text-orange-500' : 'text-text-muted'}`}>
                          {results.otx.pulses}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-text-muted block mb-1.5 font-medium">Malware Families:</span>
                        {results.otx.malware_family.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {results.otx.malware_family.map((mf: string) => (
                              <span key={mf} className="px-2 py-0.5 bg-[#4d4d4d]/60 text-white rounded text-xs font-medium border border-[#4d4d4d]">
                                {mf}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted italic">None identified</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AbuseIPDB */}
              <div className="bg-surface p-5 rounded-lg border border-[#4d4d4d] flex flex-col justify-between min-h-[180px] shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-500">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <h4 className="font-semibold">AbuseIPDB</h4>
                    </div>
                    {!results.abuseipdb.configured && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Key Missing
                      </span>
                    )}
                  </div>

                  {!results.abuseipdb.configured ? (
                    <div className="text-xs text-text-muted space-y-2 mt-2 leading-relaxed">
                      <p>API Key not configured. Add <code className="bg-[#1f1f1f] px-1 rounded text-amber-500">ABUSEIPDB_API_KEY</code> to your <code className="bg-[#1f1f1f] px-1.5 py-0.5 rounded">.env.local</code>.</p>
                    </div>
                  ) : !results.abuseipdb.success ? (
                    <div className="text-xs text-red-400 space-y-2 mt-2">
                      <p>Request Failed: {results.abuseipdb.error || 'Failed to query AbuseIPDB.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-medium">Reported Times</span>
                        <span className={`font-mono font-bold ${results.abuseipdb.reported_times > 0 ? 'text-red-500' : 'text-text-muted'}`}>
                          {results.abuseipdb.reported_times}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-medium">Confidence Score</span>
                        <span className={`font-bold font-mono ${parseInt(results.abuseipdb.confidence_score) > 20 ? 'text-red-500' : 'text-text-muted'}`}>
                          {results.abuseipdb.confidence_score}
                        </span>
                      </div>
                    </div>
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