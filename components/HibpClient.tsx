"use client";

import React, { useState } from 'react';
import { Search, Loader2, UserX, Key, CheckCircle2, AlertTriangle, Lock, ShieldAlert, Calendar, Globe } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-base text-text-base font-sans pb-12">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 md:mt-10">
        
        {/* Title Area */}
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight text-text-base flex items-center gap-3">
            <UserX className="w-8 h-8 text-primary" />
            Have I Been Pwned
          </h2>
          <p className="mt-2 text-text-muted text-sm md:text-base font-medium">
            Check if your email, phone number, or password has been compromised in a data breach.
          </p>
        </div>

        {/* Search Container */}
        <div className="mb-8">
          
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-[#4d4d4d] pb-4">
            <button
              onClick={() => handleTabChange('account')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-colors ${
                activeTab === 'account' 
                  ? 'bg-[#1f1f1f] text-primary border border-primary/30' 
                  : 'text-text-muted hover:bg-[#1f1f1f] hover:text-white border border-transparent'
              }`}
            >
              <UserX className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => handleTabChange('password')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-colors ${
                activeTab === 'password' 
                  ? 'bg-[#1f1f1f] text-primary border border-primary/30' 
                  : 'text-text-muted hover:bg-[#1f1f1f] hover:text-white border border-transparent'
              }`}
            >
              <Key className="w-4 h-4" />
              Password (k-Anonymity)
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-1 items-center bg-[#1f1f1f] rounded-full shadow-[inset_0_0_0_1px_rgb(124,124,124)] focus-within:shadow-[inset_0_0_0_1px_white] px-5 py-3.5 transition-shadow">
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
              className="px-8 py-3.5 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px] tracking-wide uppercase"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check Data'}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <Lock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-red-500 font-bold text-sm">Access Denied / Error</h4>
                <p className="text-red-400 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Area */}
        {results && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Overview Banner */}
            <div className={`p-6 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md ${
              results.breached 
                ? 'bg-red-500/10 border-red-500/30' 
                : 'bg-emerald-500/10 border-emerald-500/30'
            }`}>
              <div>
                <h3 className="text-xl font-mono font-bold flex items-center gap-2">
                  {results.type === 'password' ? '••••••••' : results.target}
                </h3>
                <p className={`text-sm font-bold mt-2 ${results.breached ? 'text-red-500' : 'text-emerald-500'}`}>
                  {results.breached 
                    ? `Oh no — pwned! This ${results.type} has been compromised.` 
                    : `Good news — no pwnage found!`}
                </p>
              </div>
              <div className="shrink-0">
                {results.breached ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md font-bold shadow-lg">
                    <ShieldAlert className="w-5 h-5" /> COMPROMISED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-md font-bold shadow-lg">
                    <CheckCircle2 className="w-5 h-5" /> SECURE
                  </span>
                )}
              </div>
            </div>

            {/* Detailed Results (Password) */}
            {results.type === 'password' && results.breached && (
              <div className="bg-surface p-6 rounded-lg border border-[#4d4d4d] shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">Password Exposure</h4>
                    <p className="text-sm text-text-muted">This password was found in a massive database of breached passwords.</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-[#1f1f1f] rounded border border-[#4d4d4d] flex items-center justify-between">
                  <span className="text-text-muted font-medium">Seen in breaches:</span>
                  <span className="text-2xl font-mono font-bold text-red-500">{results.count.toLocaleString()} times</span>
                </div>
                <p className="mt-4 text-xs text-text-muted leading-relaxed">
                  <strong>Advice:</strong> You should change this password immediately wherever you use it. Do not use this password for any new accounts.
                </p>
              </div>
            )}

            {/* Detailed Results (Account / Email) */}
            {results.type === 'account' && results.breached && (
              <div className="bg-surface p-6 rounded-lg border border-[#4d4d4d] shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" /> 
                    Found in {results.breaches.length} Data Breaches
                  </h3>
                  <a href="https://xposedornot.com/" target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-[#1f1f1f] px-3 py-1.5 rounded-full border border-[#4d4d4d]">
                    Powered by XposedOrNot <Globe className="w-3 h-3" />
                  </a>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {results.breaches.map((breach: any) => (
                    <div key={breach.Name} className="flex items-center gap-2 bg-[#1f1f1f] border border-[#4d4d4d] p-3 rounded-md hover:border-red-500/50 transition-colors group overflow-hidden">
                      <ShieldAlert className="w-4 h-4 text-red-500/70 group-hover:text-red-500 shrink-0" />
                      <span className="text-sm font-bold text-text-base truncate" title={breach.Title}>
                        {breach.Title}
                      </span>
                    </div>
                  ))}
                </div>
                
                <p className="mt-6 text-xs text-text-muted leading-relaxed border-t border-[#4d4d4d] pt-4">
                  <strong>Security Advice:</strong> If your email was found in these breaches, change your passwords immediately, especially if you reused the same password across multiple sites. Consider using a password manager and enabling Two-Factor Authentication (2FA) wherever possible.
                </p>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
