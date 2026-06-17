"use client";

import React, { useState } from 'react';
import { 
  Search, Loader2, UserX, Key, CheckCircle2, AlertTriangle, Lock, ShieldAlert, 
  Calendar, Globe, ChevronDown, ChevronUp, Database, Tag, Building2, 
  ShieldCheck, ExternalLink, Hash, FileWarning, BarChart3,
  Users, Clipboard
} from 'lucide-react';

interface BreachDetail {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  Description: string;
  DataClasses: string[];
  PwnCount: number | string;
  Industry: string;
  Logo: string | null;
  PasswordRisk: string;
  References: string | null;
  Searchable: boolean;
  Verified: boolean;
}

function getRiskColor(risk: string) {
  const r = risk?.toLowerCase();
  if (r === 'high' || r === 'critical') return 'text-error bg-error/10 border-error/20';
  if (r === 'medium') return 'text-tertiary bg-tertiary/10 border-tertiary/20';
  if (r === 'low') return 'text-success bg-success/10 border-success/20';
  return 'text-text-muted bg-surface border-border';
}

function getPasswordRiskColor(risk: string) {
  const r = risk?.toLowerCase();
  if (r === 'plaintext' || r === 'easy' || r === 'easytocrack') return 'text-error';
  if (r === 'unknown') return 'text-text-muted';
  if (r === 'strong' || r === 'hardtocrack') return 'text-success';
  return 'text-tertiary';
}

function formatNumber(n: number | string) {
  if (typeof n === 'number') return n.toLocaleString();
  const parsed = parseInt(String(n), 10);
  if (isNaN(parsed)) return String(n);
  return parsed.toLocaleString();
}

function formatDate(dateStr: string) {
  if (!dateStr || dateStr === 'Unknown') return 'Unknown';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getDataClassStyle(cls: string) {
  const c = cls.toLowerCase();
  if (c.includes('password')) return 'bg-error/10 text-error border-error/20';
  if (c.includes('email')) return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
  if (c.includes('name') || c.includes('username')) return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
  if (c.includes('phone') || c.includes('address')) return 'bg-tertiary/10 text-tertiary border-tertiary/20';
  if (c.includes('ip') || c.includes('geo') || c.includes('location')) return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
  if (c.includes('credit') || c.includes('financial') || c.includes('payment')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  return 'bg-surface text-text-muted border-border';
}

function BreachRow({ breach, index }: { breach: BreachDetail; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className={`border-b border-border last:border-b-0 transition-all duration-200 ${expanded ? 'bg-neutral' : ''}`}
    >
      {/* Row — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 focus:outline-none hover:bg-[var(--accent-glow)] transition-colors"
      >
        {/* Icon */}
        <div className="shrink-0 w-9 h-9 rounded-lg bg-error/8 border border-error/15 flex items-center justify-center">
          {breach.Logo ? (
            <img src={breach.Logo} alt="" className="w-6 h-6 rounded object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <ShieldAlert className="w-4 h-4 text-error" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-text-base truncate">{breach.Title}</h4>
            {breach.Verified && (
              <span className="badge badge-danger text-[9px]">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-text-muted flex-wrap font-medium">
            {breach.Domain && breach.Domain !== 'Unknown' && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" /> {breach.Domain}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(breach.BreachDate)}
            </span>
            {breach.PwnCount && breach.PwnCount !== 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {formatNumber(breach.PwnCount)}
              </span>
            )}
          </div>
        </div>

        {/* Toggle */}
        <div className="shrink-0">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 pt-2 space-y-4 border-t border-border/50">
          
          {/* Meta chips */}
          <div className="flex flex-wrap gap-2">
            {breach.Industry && breach.Industry !== 'Unknown' && (
              <span className="badge badge-low flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {breach.Industry}
              </span>
            )}
            {breach.PasswordRisk && breach.PasswordRisk !== 'Unknown' && (
              <span className={`badge badge-low flex items-center gap-1 ${getPasswordRiskColor(breach.PasswordRisk)}`}>
                <Key className="w-3 h-3" /> Password: {breach.PasswordRisk}
              </span>
            )}
          </div>

          {/* Description */}
          {breach.Description && breach.Description !== 'No description available.' && (
            <div className="text-xs text-text-muted leading-relaxed bg-surface rounded-lg p-4 border border-border">
              <p dangerouslySetInnerHTML={{ __html: breach.Description }} />
            </div>
          )}

          {/* Exposed Data Classes */}
          {breach.DataClasses && breach.DataClasses.length > 0 && breach.DataClasses[0] !== 'Unknown' && (
            <div>
              <h5 className="metric-label mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Exposed Data Types
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {breach.DataClasses.map((cls, i) => (
                  <span 
                    key={i} 
                    className={`inline-block px-2.5 py-1 text-[10px] font-semibold rounded-md border ${getDataClassStyle(cls)}`}
                  >
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reference link */}
          {breach.References && breach.References !== 'null' && (
            <a 
              href={breach.References} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-tertiary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Breach Source
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function HibpClient() {
  const [activeTab, setActiveTab] = useState<'account' | 'password'>('account');
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (tab: 'account' | 'password') => {
    setActiveTab(tab);
    setQuery('');
    setResults(null);
    setError(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setError(null);
    setIsAnalyzing(true);
    setResults(null);

    try {
      const res = await fetch(`/api/hibp?type=${activeTab}&query=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to connect to the service. Please try again.');
        return;
      }

      setResults({ ...data, type: activeTab, target: query });
    } catch (err) {
      console.error(err);
      setError('Network error connecting to the service.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const totalRecords = results?.breaches?.reduce((sum: number, b: BreachDetail) => {
    const count = typeof b.PwnCount === 'number' ? b.PwnCount : parseInt(String(b.PwnCount), 10) || 0;
    return sum + count;
  }, 0) || 0;

  const uniqueIndustries = results?.breaches 
    ? [...new Set(results.breaches.map((b: BreachDetail) => b.Industry).filter((i: string) => i && i !== 'Unknown'))]
    : [];

  return (
    <div className="min-h-screen bg-base text-text-base pb-12">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 md:pt-8">
        
        {/* Page Header */}
        <div className="page-header">
          <div className="page-icon">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <h1>Data Breach Intelligence</h1>
            <p className="text-sm text-text-muted mt-0.5">Check if your credentials have been compromised</p>
          </div>
        </div>

        {/* Search Container */}
        <div className="mb-8">
          
          {/* Tabs — underline style */}
          <div className="flex gap-1 mb-6 border-b border-border">
            <button
              onClick={() => handleTabChange('account')}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all border-b-2 ${
                activeTab === 'account' 
                  ? 'border-tertiary text-tertiary' 
                  : 'border-transparent text-text-muted hover:text-text-base'
              }`}
            >
              <UserX className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => handleTabChange('password')}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all border-b-2 ${
                activeTab === 'password' 
                  ? 'border-tertiary text-tertiary' 
                  : 'border-transparent text-text-muted hover:text-text-base'
              }`}
            >
              <Key className="w-4 h-4" />
              Password (k-Anonymity)
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="floating-input flex items-center gap-3 flex-1">
              <Search className="h-4 w-4 text-text-muted shrink-0" />
              <input
                type={activeTab === 'password' ? 'password' : 'text'}
                className="w-full bg-transparent border-0 outline-none text-sm font-medium placeholder:text-text-muted text-text-base"
                placeholder={activeTab === 'account' ? 'Enter email address...' : 'Enter password to check...'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isAnalyzing || !query}
              className="btn-primary min-w-[140px] disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Check Data'}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-error/10 border border-error/20 rounded-lg flex items-start gap-3">
              <Lock className="w-5 h-5 text-error shrink-0 mt-0.5" />
              <div>
                <h4 className="text-error font-medium text-sm">Access Denied / Error</h4>
                <p className="text-error text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Area */}
        {results && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* Overview Banner — inline status bar */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b ${
              results.breached ? 'border-error/30' : 'border-success/30'
            }`}>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 text-text-base">
                  {results.type === 'password' ? '••••••••' : results.target}
                </h3>
                <p className={`text-sm font-medium mt-1.5 ${results.breached ? 'text-error' : 'text-success'}`}>
                  {results.breached 
                    ? `Oh no — pwned! This ${results.type} has been compromised.` 
                    : `Good news — no pwnage found!`}
                </p>
              </div>
              <div className="shrink-0">
                {results.breached ? (
                  <span className="badge badge-danger text-xs py-1.5 px-3">
                    <ShieldAlert className="w-4 h-4" /> COMPROMISED
                  </span>
                ) : (
                  <span className="badge badge-success text-xs py-1.5 px-3">
                    <CheckCircle2 className="w-4 h-4" /> SECURE
                  </span>
                )}
              </div>
            </div>

            {/* PASSWORD RESULTS */}
            {results.type === 'password' && results.breached && (
              <div className="py-6 border-b border-border">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-error" />
                  <h4 className="text-lg font-semibold text-text-base">Password Exposure</h4>
                </div>
                <div className="flex items-center justify-between bg-surface rounded-lg p-4 border border-border">
                  <span className="text-text-muted font-medium text-sm">Seen in breaches:</span>
                  <span className="text-2xl font-bold text-error">{results.count.toLocaleString()} times</span>
                </div>
                <p className="mt-4 text-xs text-text-muted leading-relaxed">
                  <strong className="text-text-base">Advice:</strong> Change this password immediately wherever you use it.
                </p>
              </div>
            )}

            {/* ACCOUNT / EMAIL RESULTS */}
            {results.type === 'account' && results.breached && (
              <>
                {/* Summary — inline metrics, no cards */}
                <div className="metric-row flex-wrap">
                  <div className="metric-item">
                    <span className="metric-label">Breaches</span>
                    <span className="metric-value text-error">{results.breaches.length}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Total Records</span>
                    <span className="metric-value text-tertiary">{formatNumber(totalRecords)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Industries</span>
                    <span className="metric-value text-sky-500">{uniqueIndustries.length}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Pastes</span>
                    <span className="metric-value text-purple-500">
                      {results.pastes?.details?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Exposed Data Summary — inline tags */}
                {results.metrics?.xposedDataSummary && Object.keys(results.metrics.xposedDataSummary).length > 0 && (
                  <div className="pb-6 border-b border-border">
                    <h3 className="metric-label mb-3 flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5 text-tertiary" /> Exposed Data Summary
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(results.metrics.xposedDataSummary).map(([key, count]: [string, any]) => (
                        <span 
                          key={key} 
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md border ${getDataClassStyle(key)}`}
                        >
                          {key}
                          {count > 1 && (
                            <span className="ml-0.5 bg-neutral rounded-full px-1.5 py-0.5 text-[9px]">{count}×</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Breach List — compact expandable rows, NOT cards */}
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                    <h3 className="text-base font-semibold flex items-center gap-2 text-text-base">
                      <AlertTriangle className="w-4 h-4 text-error" /> 
                      Found in {results.breaches.length} Data Breach{results.breaches.length !== 1 ? 'es' : ''}
                    </h3>
                    <a href="https://xposedornot.com/" target="_blank" rel="noreferrer" className="text-[11px] font-medium text-text-muted hover:text-tertiary flex items-center gap-1 transition-colors">
                      Powered by XposedOrNot <Globe className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="section-panel">
                    {results.breaches.map((breach: BreachDetail, index: number) => (
                      <BreachRow key={breach.Name + index} breach={breach} index={index} />
                    ))}
                  </div>
                </div>

                {/* Pastes Section */}
                {results.pastes?.details && results.pastes.details.length > 0 && (
                  <div>
                    <h3 className="metric-label mb-3 flex items-center gap-2">
                      <FileWarning className="w-3.5 h-3.5 text-tertiary" /> Found in {results.pastes.details.length} Paste{results.pastes.details.length !== 1 ? 's' : ''}
                    </h3>
                    <div className="space-y-1">
                      {results.pastes.details.map((paste: any, i: number) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-surface transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <Hash className="w-4 h-4 text-tertiary shrink-0" />
                            <span className="text-sm font-medium text-text-base truncate">
                              {paste.source || paste.id || `Paste #${i + 1}`}
                            </span>
                          </div>
                          <span className="text-xs text-text-muted shrink-0">
                            {paste.date || paste.timestamp || ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Advice — minimal banner */}
                <div className="p-4 bg-tertiary/5 rounded-lg border border-tertiary/15 text-xs text-text-muted leading-relaxed">
                  <strong className="text-text-base">🔐 Security Advice:</strong> Change your passwords immediately, especially if reused. Use a password manager and enable 2FA wherever possible.
                </div>
              </>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
