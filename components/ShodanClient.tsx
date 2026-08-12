"use client";

import { useState, useMemo } from 'react';
import {
  Search, Loader2, ShieldAlert, Activity, Radar,
  ServerCog, AlertTriangle, TrendingUp, ArrowRight,
  Globe2, Lock, CheckCircle2
} from 'lucide-react';

interface ShodanSummary {
  riskLevel: string;
  riskScore: number;
  openPorts: number;
  riskyPorts: number;
  uniqueServices: number;
  lastSeen: string;
}

interface ShodanResult {
  success: boolean;
  configured?: boolean;
  message?: string;
  summary?: ShodanSummary;
  host?: {
    ip: string;
    city: string;
    country: string;
    org: string;
    lastSeen: string;
    openPorts: string[];
    riskyPorts: string[];
    serviceNames: string[];
    vulns: string[];
  };
  exposureMonitor?: {
    observedAssets: number;
    exposedPortCount: number;
    riskyPortCount: number;
    uniqueServices: number;
    status: string;
    topPorts: string[];
  };
  continuousWatch?: {
    trend: string;
    lastSeen: string;
    changeRisk: string;
    recommendation: string;
  };
  risk?: {
    score: number;
    level: string;
    reasons: string[];
  };
  recommendations?: string[];
  error?: string;
}

function getRiskColor(level: string) {
  switch (level) {
    case 'Critical': return 'bg-red-500/15 text-red-400 border-red-500/20';
    case 'High': return 'bg-orange-500/15 text-orange-400 border-orange-500/20';
    case 'Moderate': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20';
    default: return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
  }
}

export default function ShodanClient() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShodanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = target.trim();
    if (!value) {
      setError('Please enter an IP or hostname to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/shodan?target=${encodeURIComponent(value)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || data.message || 'Unable to analyze target.');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Failed to connect to Shodan analysis service.');
    } finally {
      setLoading(false);
    }
  };

  const riskBadge = useMemo(() => {
    if (!result?.summary) return null;
    return {
      label: result.summary.riskLevel,
      className: getRiskColor(result.summary.riskLevel)
    };
  }, [result]);

  return (
    <div className="min-h-screen bg-base text-text-base pb-24">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 md:pt-16">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-tertiary/10 text-tertiary p-2 rounded-lg">
              <Radar className="w-5 h-5" />
            </span>
            <p className="text-label-md text-text-muted uppercase tracking-[0.18em]">Threat Exposure Intelligence</p>
          </div>
          <h1 className="text-headline-display text-text-base mb-4">Threat Exposure Intelligence</h1>
          <p className="text-body-lg text-text-muted max-w-3xl">
            Monitor exposed services, compute risk, and maintain continuous coverage of internet-facing assets.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-12 flex flex-col sm:flex-row gap-4 max-w-3xl">
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Enter IP address or hostname (example: 8.8.8.8 or example.com)"
            className="floating-input flex-1"
          />
          <button type="submit" disabled={loading || !target.trim()} className="btn-primary shrink-0 disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run Shodan Scan'}
          </button>
        </form>

        {error && (
          <div className="mb-8 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300 text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            {error}
          </div>
        )}

        {!result && !error && (
          <div className="section-panel p-8 text-text-muted">
            No scan performed yet. Enter an IP or hostname to view Shodan host intelligence and exposure trends.
          </div>
        )}

        {result && (
          <>
            <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-label-sm text-text-muted uppercase tracking-[0.14em]">Target</p>
                <h2 className="text-headline-sm font-mono text-text-base mt-1">{result.host?.ip || target}</h2>
              </div>

              {riskBadge && (
                <div className={`inline-flex items-center gap-2 border px-3 py-2 rounded-full text-sm font-medium ${riskBadge.className}`}>
                  <ShieldAlert className="w-4 h-4" />
                  {riskBadge.label}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
              <div className="section-panel p-5">
                <p className="text-label-sm text-text-muted">Risk Score</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-headline-md text-text-base">{result.summary?.riskScore ?? 0}</span>
                  <span className="text-caption text-text-muted">/ 100</span>
                </div>
              </div>

              <div className="section-panel p-5">
                <p className="text-label-sm text-text-muted">Open Ports</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-headline-md text-text-base">{result.summary?.openPorts ?? 0}</span>
                  <span className="text-caption text-text-muted">total</span>
                </div>
              </div>

              <div className="section-panel p-5">
                <p className="text-label-sm text-text-muted">Risky Ports</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-headline-md text-text-base">{result.summary?.riskyPorts ?? 0}</span>
                  <span className="text-caption text-text-muted">critical</span>
                </div>
              </div>

              <div className="section-panel p-5">
                <p className="text-label-sm text-text-muted">Services</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-headline-md text-text-base">{result.summary?.uniqueServices ?? 0}</span>
                  <span className="text-caption text-text-muted">unique</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="section-panel">
                <div className="section-panel-header">
                  <h3 className="text-headline-sm flex items-center gap-3">
                    <Search className="w-5 h-5 text-tertiary" />
                    Shodan Host Analyzer
                  </h3>
                </div>
                <div className="space-y-4 text-body-sm text-text-muted">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span>Location</span>
                    <span className="font-medium text-text-base">{result.host?.city || 'Unknown'}, {result.host?.country || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span>Organization</span>
                    <span className="font-medium text-text-base">{result.host?.org || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span>Last seen</span>
                    <span className="font-medium text-text-base">{result.host?.lastSeen || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Vulnerabilities</span>
                    <span className="font-medium text-text-base">{result.host?.vulns?.length ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="section-panel">
                <div className="section-panel-header">
                  <h3 className="text-headline-sm flex items-center gap-3">
                    <Activity className="w-5 h-5 text-tertiary" />
                    Exposure Monitor
                  </h3>
                </div>
                <div className="space-y-4 text-body-sm text-text-muted">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span>Observed assets</span>
                    <span className="font-medium text-text-base">{result.exposureMonitor?.observedAssets ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span>Exposed ports</span>
                    <span className="font-medium text-text-base">{result.exposureMonitor?.exposedPortCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span>Risky ports</span>
                    <span className="font-medium text-text-base">{result.exposureMonitor?.riskyPortCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>State</span>
                    <span className="font-medium text-text-base capitalize">{result.exposureMonitor?.status || 'watch'}</span>
                  </div>
                </div>
              </div>

              <div className="section-panel">
                <div className="section-panel-header">
                  <h3 className="text-headline-sm flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-tertiary" />
                    Risk Scoring
                  </h3>
                </div>
                <div className="space-y-3">
                  {result.risk?.reasons?.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-lg bg-surface px-3 py-2 text-body-sm text-text-muted">
                      <span className="mt-1 text-tertiary">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                      <span>{reason}</span>
                    </div>
                  ))}
                  <div className="mt-4 border-t border-border/60 pt-4 flex items-center justify-between">
                    <span className="text-text-muted">Risk level</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(result.risk?.level || 'Low')}`}>
                      {result.risk?.level || 'Low'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="section-panel">
                <div className="section-panel-header">
                  <h3 className="text-headline-sm flex items-center gap-3">
                    <ServerCog className="w-5 h-5 text-tertiary" />
                    Continuous Asset Watch
                  </h3>
                </div>
                <div className="space-y-4 text-body-sm text-text-muted">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span>Trend</span>
                    <span className="font-medium text-text-base capitalize">{result.continuousWatch?.trend || 'steady'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span>Change risk</span>
                    <span className="font-medium text-text-base">{result.continuousWatch?.changeRisk || 'steady'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last seen</span>
                    <span className="font-medium text-text-base">{result.continuousWatch?.lastSeen || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="section-panel">
                <div className="section-panel-header">
                  <h3 className="text-headline-sm flex items-center gap-3">
                    <Globe2 className="w-5 h-5 text-tertiary" />
                    Open Ports
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(result.host?.openPorts?.length ? result.host.openPorts : ['No open ports detected']).map((port) => (
                    <span key={port} className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-sm text-text-base">
                      {port}
                    </span>
                  ))}
                </div>
              </div>

              <div className="section-panel">
                <div className="section-panel-header">
                  <h3 className="text-headline-sm flex items-center gap-3">
                    <Lock className="w-5 h-5 text-tertiary" />
                    Services & Exposure
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(result.host?.serviceNames?.length ? result.host.serviceNames : ['No service fingerprint detected']).map((svc) => (
                    <span key={svc} className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-sm text-text-base">
                      {svc}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 section-panel">
              <div className="section-panel-header">
                <h3 className="text-headline-sm flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-tertiary" />
                  Recommendations
                </h3>
              </div>
              <ul className="space-y-3 text-body-sm text-text-muted">
                {(result.recommendations || []).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <ArrowRight className="w-4 h-4 mt-0.5 text-tertiary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
