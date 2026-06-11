"use client";

import React, { useState } from 'react';
import { 
  Search, Loader2, UserX, Key, CheckCircle2, AlertTriangle, Lock, ShieldAlert, 
  Calendar, Globe, ChevronDown, ChevronUp, Database, Tag, Building2, 
  ShieldCheck, ShieldX, ExternalLink, Hash, FileWarning, BarChart3,
  Users, TrendingUp, Clipboard
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

// Data class tag color mapping
function getDataClassStyle(cls: string) {
  const c = cls.toLowerCase();
  if (c.includes('password')) return 'bg-error/10 text-error border-error/20';
  if (c.includes('email')) return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
  if (c.includes('name') || c.includes('username')) return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
  if (c.includes('phone') || c.includes('address')) return 'bg-tertiary/10 text-tertiary border-tertiary/20';
  if (c.includes('ip') || c.includes('geo') || c.includes('location')) return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
  if (c.includes('credit') || c.includes('financial') || c.includes('payment')) return 'bg-primary/20 text-secondary border-primary/50';
  return 'bg-surface text-text-muted border-border';
}

function BreachCard({ breach, index }: { breach: BreachDetail; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className={`bg-neutral border rounded-lg overflow-hidden transition-all duration-300 group ${expanded ? 'border-error/50 shadow-md' : 'border-border hover:shadow-md hover:border-border'}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Card Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-start gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50 rounded-lg bg-neutral"
      >
        {/* Icon / Logo */}
        <div className="shrink-0 w-11 h-11 rounded-lg bg-error/10 border border-error/20 flex items-center justify-center group-hover:bg-error/20 transition-colors">
          {breach.Logo ? (
            <img src={breach.Logo} alt="" className="w-7 h-7 rounded object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <ShieldAlert className="w-5 h-5 text-error" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-medium text-text-base truncate">{breach.Title}</h4>
            {breach.Verified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-error/10 text-error rounded border border-error/20">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted flex-wrap font-medium">
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
                <Users className="w-3 h-3" /> {formatNumber(breach.PwnCount)} records
              </span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <div className="shrink-0 mt-1">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-text-muted" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-muted" />
          )}
        </div>
      </button>

      {/* Expanded detail section */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 bg-neutral">
          
          {/* Meta chips row */}
          <div className="flex flex-wrap gap-2">
            {breach.Industry && breach.Industry !== 'Unknown' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-surface border border-border text-secondary">
                <Building2 className="w-3.5 h-3.5 text-text-muted" /> {breach.Industry}
              </span>
            )}
            {breach.PasswordRisk && breach.PasswordRisk !== 'Unknown' && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-surface border border-border ${getPasswordRiskColor(breach.PasswordRisk)}`}>
                <Key className="w-3.5 h-3.5" /> Password: {breach.PasswordRisk}
              </span>
            )}
            {breach.Searchable && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-surface border border-border text-text-muted">
                <Search className="w-3.5 h-3.5" /> Searchable
              </span>
            )}
          </div>

          {/* Description */}
          {breach.Description && breach.Description !== 'No description available.' && (
            <div className="text-sm text-text-muted leading-relaxed bg-surface rounded-lg p-4 border border-border">
              <p dangerouslySetInnerHTML={{ __html: breach.Description }} />
            </div>
          )}

          {/* Exposed Data Classes */}
          {breach.DataClasses && breach.DataClasses.length > 0 && breach.DataClasses[0] !== 'Unknown' && (
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Exposed Data Types
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {breach.DataClasses.map((cls, i) => (
                  <span 
                    key={i} 
                    className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md border ${getDataClassStyle(cls)}`}
                  >
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {breach.PwnCount && breach.PwnCount !== 0 && (
              <div className="bg-surface rounded-lg p-3 border border-border">
                <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1">Exposed Records</span>
                <span className="text-lg font-medium text-error">{formatNumber(breach.PwnCount)}</span>
              </div>
            )}
            <div className="bg-surface rounded-lg p-3 border border-border">
              <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1">Breach Date</span>
              <span className="text-sm font-medium text-text-base">{formatDate(breach.BreachDate)}</span>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-border">
              <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1">Domain</span>
              <span className="text-sm font-medium text-text-base">{breach.Domain || 'N/A'}</span>
            </div>
          </div>

          {/* Reference link */}
          {breach.References && breach.References !== 'null' && (
            <a 
              href={breach.References} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-tertiary hover:text-tertiary/80 transition-colors bg-tertiary/10 px-3 py-2 rounded-lg border border-tertiary/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Breach Source / Reference
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

  // Compute summary stats
  const totalRecords = results?.breaches?.reduce((sum: number, b: BreachDetail) => {
    const count = typeof b.PwnCount === 'number' ? b.PwnCount : parseInt(String(b.PwnCount), 10) || 0;
    return sum + count;
  }, 0) || 0;

  const uniqueIndustries = results?.breaches 
    ? [...new Set(results.breaches.map((b: BreachDetail) => b.Industry).filter((i: string) => i && i !== 'Unknown'))]
    : [];

  return (
    <div className="min-h-screen bg-base text-text-base pb-12">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 md:mt-12">
        
        {/* Title Area */}
        <div className="mb-8">
          <h2 className="text-3xl font-medium tracking-tight text-text-base flex items-center gap-3">
            <UserX className="w-8 h-8 text-tertiary" />
            Have I Been Pwned
          </h2>
          <p className="mt-2 text-text-muted text-sm md:text-base">
            Check if your email, phone number, or password has been compromised in a data breach.
          </p>
        </div>

        {/* Search Container */}
        <div className="mb-8">
          
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border pb-4">
            <button
              onClick={() => handleTabChange('account')}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm font-medium text-sm transition-colors ${
                activeTab === 'account' 
                  ? 'bg-surface text-tertiary border border-border shadow-sm' 
                  : 'text-text-muted hover:bg-surface hover:text-text-base border border-transparent'
              }`}
            >
              <UserX className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => handleTabChange('password')}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm font-medium text-sm transition-colors ${
                activeTab === 'password' 
                  ? 'bg-surface text-tertiary border border-border shadow-sm' 
                  : 'text-text-muted hover:bg-surface hover:text-text-base border border-transparent'
              }`}
            >
              <Key className="w-4 h-4" />
              Password (k-Anonymity)
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-1 items-center bg-neutral rounded-lg border border-border focus-within:border-tertiary focus-within:ring-2 focus-within:ring-tertiary/20 px-5 py-3.5 transition-all shadow-sm">
              <Search className="h-5 w-5 text-text-muted shrink-0 mr-3" />
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
              className="btn-primary min-w-[140px]"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Check Data'}
            </button>
          </form>

          {/* Error Message */}
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Overview Banner */}
            <div className={`p-6 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${
              results.breached 
                ? 'bg-error/10 border-error/20' 
                : 'bg-success/10 border-success/20'
            }`}>
              <div>
                <h3 className="text-xl font-medium flex items-center gap-2">
                  {results.type === 'password' ? '••••••••' : results.target}
                </h3>
                <p className={`text-sm font-medium mt-2 ${results.breached ? 'text-error' : 'text-success'}`}>
                  {results.breached 
                    ? `Oh no — pwned! This ${results.type} has been compromised.` 
                    : `Good news — no pwnage found!`}
                </p>
              </div>
              <div className="shrink-0">
                {results.breached ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-error text-white rounded-md font-medium shadow-sm">
                    <ShieldAlert className="w-5 h-5" /> COMPROMISED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-success text-white rounded-md font-medium shadow-sm">
                    <CheckCircle2 className="w-5 h-5" /> SECURE
                  </span>
                )}
              </div>
            </div>

            {/* === PASSWORD RESULTS === */}
            {results.type === 'password' && results.breached && (
              <div className="wazuh-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error border border-error/20">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">Password Exposure</h4>
                    <p className="text-sm text-text-muted">This password was found in a massive database of breached passwords.</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-surface rounded-lg border border-border flex items-center justify-between">
                  <span className="text-text-muted font-medium">Seen in breaches:</span>
                  <span className="text-2xl font-medium text-error">{results.count.toLocaleString()} times</span>
                </div>
                <p className="mt-4 text-xs text-text-muted leading-relaxed">
                  <strong className="text-secondary">Advice:</strong> You should change this password immediately wherever you use it. Do not use this password for any new accounts.
                </p>
              </div>
            )}

            {/* === ACCOUNT / EMAIL RESULTS === */}
            {results.type === 'account' && results.breached && (
              <>
                {/* Summary Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="wazuh-card !p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <ShieldAlert className="w-4 h-4 text-error" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Breaches</span>
                    </div>
                    <span className="text-2xl font-medium text-error">{results.breaches.length}</span>
                  </div>
                  <div className="wazuh-card !p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-tertiary" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Total Records</span>
                    </div>
                    <span className="text-2xl font-medium text-tertiary">{formatNumber(totalRecords)}</span>
                  </div>
                  <div className="wazuh-card !p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-sky-600" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Industries</span>
                    </div>
                    <span className="text-2xl font-medium text-sky-600">{uniqueIndustries.length}</span>
                  </div>
                  <div className="wazuh-card !p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clipboard className="w-4 h-4 text-purple-600" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Pastes</span>
                    </div>
                    <span className="text-2xl font-medium text-purple-600">
                      {results.pastes?.details?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Exposed Data Summary — from metrics */}
                {results.metrics?.xposedDataSummary && Object.keys(results.metrics.xposedDataSummary).length > 0 && (
                  <div className="wazuh-card">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-tertiary" /> Exposed Data Summary
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(results.metrics.xposedDataSummary).map(([key, count]: [string, any]) => (
                        <span 
                          key={key} 
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border ${getDataClassStyle(key)}`}
                        >
                          {key}
                          {count > 1 && (
                            <span className="ml-1 bg-neutral rounded-full px-1.5 py-0.5 text-[10px]">{count}×</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Breach List */}
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-error" /> 
                      Found in {results.breaches.length} Data Breach{results.breaches.length !== 1 ? 'es' : ''}
                    </h3>
                    <a href="https://xposedornot.com/" target="_blank" rel="noreferrer" className="text-xs font-medium text-tertiary hover:underline flex items-center gap-1 bg-surface px-3 py-1.5 rounded-sm border border-border shadow-sm">
                      Powered by XposedOrNot <Globe className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="space-y-3">
                    {results.breaches.map((breach: BreachDetail, index: number) => (
                      <BreachCard key={breach.Name + index} breach={breach} index={index} />
                    ))}
                  </div>
                </div>

                {/* Pastes Section */}
                {results.pastes?.details && results.pastes.details.length > 0 && (
                  <div className="wazuh-card">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
                      <FileWarning className="w-4 h-4 text-tertiary" /> Found in {results.pastes.details.length} Paste{results.pastes.details.length !== 1 ? 's' : ''}
                    </h3>
                    <div className="space-y-2">
                      {results.pastes.details.map((paste: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-surface p-3 rounded-md border border-border gap-3">
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

                {/* Security Advice */}
                <div className="p-4 bg-tertiary/10 rounded-lg border border-tertiary/20 text-xs text-text-muted leading-relaxed">
                  <strong className="text-secondary">🔐 Security Advice:</strong> If your email was found in these breaches, change your passwords immediately, especially if you reused the same password across multiple sites. Consider using a password manager and enabling Two-Factor Authentication (2FA) wherever possible.
                </div>
              </>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
