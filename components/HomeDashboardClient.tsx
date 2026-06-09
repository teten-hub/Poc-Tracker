"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Radar, Search, Shield, UserX, Skull, ArrowRight, Activity, Globe, AlertTriangle, Eye, Clock, GitBranch, Star, Bug, Network, Database, Lock, ChevronDown, ExternalLink } from 'lucide-react';
import TorIcon from './TorIcon';
import { PocData } from '@/types';

interface HomeDashboardClientProps {
  latestPocs?: PocData[];
}

function ModuleSpoiler({ 
  tool, 
  isOpen, 
  onToggle 
}: { 
  tool: { title: string; description: string; href: string; icon: React.ReactNode; color: string; accentColor: string; stats: string; features: string[] };
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${
      isOpen ? `border-gray-300 shadow-lg` : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
    }`}>
      {/* Collapsed Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-5 flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-xl transition-colors"
      >
        {/* Accent bar */}
        <div className={`absolute left-0 top-0 w-1 h-full ${tool.accentColor} transition-opacity ${isOpen ? 'opacity-100' : 'opacity-40'}`} />
        
        {/* Icon */}
        <div className={`shrink-0 p-3 rounded-xl border ${tool.color} transition-transform duration-300 ${isOpen ? 'scale-110' : 'group-hover:scale-105'}`}>
          {tool.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">{tool.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{tool.description}</p>
        </div>

        {/* Stats badge */}
        <span className="hidden sm:inline-flex items-center px-3 py-1 text-xs font-mono font-medium text-gray-500 bg-gray-100 rounded-full border border-gray-200 uppercase tracking-wider shrink-0">
          {tool.stats}
        </span>

        {/* Chevron */}
        <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Detail */}
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-0 border-t border-gray-100 mt-0">
            <div className="pt-4 space-y-4">
              {/* Full description */}
              <p className="text-sm text-gray-600 leading-relaxed">{tool.description}</p>

              {/* Feature highlights */}
              <div className="flex flex-wrap gap-2">
                {tool.features.map((feature, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-gray-50 border border-gray-200 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    {feature}
                  </span>
                ))}
              </div>

              {/* Action button */}
              <Link
                href={tool.href}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary/90 transition-all hover:shadow-md group/btn"
              >
                Open Module
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeDashboardClient({ latestPocs = [] }: HomeDashboardClientProps) {
  const router = useRouter();
  const [ipAddress, setIpAddress] = useState('');
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({});

  const handleIpSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipAddress.trim()) return;
    router.push(`/ip-analyzer?ip=${encodeURIComponent(ipAddress.trim())}`);
  };

  const toggleModule = (idx: number) => {
    setOpenModules(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const tools = [
    {
      title: 'PoC Tracker',
      description: 'Real-time aggregation of Proof of Concepts from global repositories. Discover new exploits as they get published, track CVE-linked PoCs, and monitor trending security research.',
      href: '/pocs',
      icon: <Radar className="w-7 h-7 text-primary" />,
      color: 'bg-blue-50 border-blue-200',
      accentColor: 'bg-blue-500',
      stats: 'Global Repos',
      features: ['CVE Tracking', 'CVSS Scoring', 'Star Trending', 'Real-time Updates']
    },
    {
      title: 'IP Analyzer',
      description: 'Scan and analyze IP addresses against multiple intelligence feeds including VirusTotal, AbuseIPDB, and AlienVault OTX for comprehensive reputation and geolocation data.',
      href: '/ip-analyzer',
      icon: <Search className="w-7 h-7 text-sky-600" />,
      color: 'bg-sky-50 border-sky-200',
      accentColor: 'bg-sky-500',
      stats: 'OSINT Feeds',
      features: ['VirusTotal', 'AbuseIPDB', 'AlienVault OTX', 'Geolocation']
    },
    {
      title: 'Have I Been Pwned',
      description: 'Check if email addresses or passwords have been compromised in known data breaches. Powered by XposedOrNot for comprehensive breach intelligence and paste monitoring.',
      href: '/hibp',
      icon: <UserX className="w-7 h-7 text-red-500" />,
      color: 'bg-red-50 border-red-200',
      accentColor: 'bg-red-500',
      stats: 'Breach DB',
      features: ['Email Lookup', 'Password Check', 'Paste Monitoring', 'Exposed Data Types']
    },
    {
      title: 'Ransomware Tracker',
      description: 'Monitor recent ransomware group activities, victims, and leaked data announcements. Track trending threat groups and search across global ransomware intelligence.',
      href: '/ransomware',
      icon: <Skull className="w-7 h-7 text-purple-500" />,
      color: 'bg-purple-50 border-purple-200',
      accentColor: 'bg-purple-500',
      stats: 'Dark Web',
      features: ['Live Victim Feed', 'Group Directory', 'Trending Analysis', 'Dark Web Intel']
    },
    {
      title: 'Tor Exit Nodes',
      description: 'Directory of known Tor exit node IP addresses to detect potential anonymized malicious traffic. Continuously updated from curated Tor relay lists.',
      href: '/tor-ips',
      icon: <TorIcon className="w-7 h-7 text-emerald-600 fill-current" />,
      color: 'bg-emerald-50 border-emerald-200',
      accentColor: 'bg-emerald-500',
      stats: 'Anonymization',
      features: ['Exit Node IPs', 'Real-time Updates', 'IP Lookup', 'Analyzer Integration']
    }
  ];

  return (
    <div className="min-h-screen bg-base text-text-base font-sans pb-12">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 md:mt-10">
        
        {/* Header section (Search Engine Style) */}
        <div className="mb-16 mt-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <Shield className="w-4 h-4" />
            <span>Threat Intelligence Platform</span>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <Image src="/logo.png" alt="SOC-Core" width={56} height={56} className="rounded-xl" />
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
              <span className="text-primary">SOC-Core</span> Intelligence
            </h1>
          </div>
          
          <p className="text-xl text-text-muted mb-10 max-w-2xl font-light">
            Comprehensive domain, IP, and vulnerability analysis. Discover exploits, investigate IOCs, and monitor threat actors instantly.
          </p>
          
          {/* Main Search Bar */}
          <form onSubmit={handleIpSearch} className="w-full max-w-2xl relative group">
            <div className="absolute inset-0 bg-primary/10 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center bg-white rounded-full border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-lg overflow-hidden h-14">
              <div className="pl-5 text-text-muted">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Enter IP Address, Hash, or Domain to analyze..."
                className="w-full bg-transparent border-none text-text-base placeholder-text-muted focus:ring-0 py-3 px-4 outline-none"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
              <button
                type="submit"
                disabled={!ipAddress.trim()}
                className="h-full px-6 bg-primary hover:bg-primary/90 text-white disabled:opacity-50 font-semibold transition-colors flex items-center gap-2"
              >
                Scan <ArrowRight className="w-4 h-4 hidden sm:block" />
              </button>
            </div>
          </form>
          
          <div className="flex gap-4 mt-6 text-sm text-text-muted font-medium">
            <span>Powered by multiple OSINT sources</span>
            <span className="text-gray-300">&bull;</span>
            <Link href="/pocs" className="hover:text-primary transition-colors flex items-center gap-1">
              <Eye className="w-4 h-4" /> Browse Latest Exploits
            </Link>
          </div>
        </div>

        {/* Global Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
           <div className="bg-white p-5 rounded-lg border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
             <div className="p-3 bg-blue-50 text-primary rounded-lg">
               <Bug className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-text-muted font-medium">Tracked Exploits</p>
               <p className="text-2xl font-bold font-mono">14,248</p>
             </div>
           </div>
           <div className="bg-white p-5 rounded-lg border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
               <Network className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-text-muted font-medium">Malicious Nodes</p>
               <p className="text-2xl font-bold font-mono">3,192</p>
             </div>
           </div>
           <div className="bg-white p-5 rounded-lg border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
             <div className="p-3 bg-red-50 text-red-500 rounded-lg">
               <Database className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-text-muted font-medium">Breached Records</p>
               <p className="text-2xl font-bold font-mono">12.5B</p>
             </div>
           </div>
           <div className="bg-white p-5 rounded-lg border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
             <div className="p-3 bg-purple-50 text-purple-500 rounded-lg">
               <Lock className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-text-muted font-medium">Active Ransomware</p>
               <p className="text-2xl font-bold font-mono">84 Groups</p>
             </div>
           </div>
        </div>

        {/* Latest PoCs Section */}
        {latestPocs.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Radar className="w-6 h-6 text-primary" />
                Latest Exploit PoCs
              </h2>
              <Link href="/pocs" className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-1 font-medium">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestPocs.map((poc, idx) => (
                <a 
                  key={idx} 
                  href={poc.html_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:border-primary/50 transition-all hover:shadow-md flex flex-col group block"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-sm font-bold bg-blue-50 text-primary px-2.5 py-1 rounded border border-blue-100">
                      {poc.cve_id || 'NO-CVE'}
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-1 border border-gray-200 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      {new Date(poc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-text-base mb-2 group-hover:text-primary transition-colors line-clamp-1" title={poc.repo_name}>
                    {poc.repo_name}
                  </h3>
                  
                  <p className="text-sm text-text-muted mb-4 line-clamp-2" title={poc.description}>
                    {poc.description || 'No description provided.'}
                  </p>
                  
                  <div className="mt-auto flex items-center gap-4 text-xs text-text-muted font-mono">
                    <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> {poc.stargazers_count}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Intelligence Modules — Spoiler/Accordion */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              Intelligence Modules
            </h2>
            <button
              onClick={() => {
                const allOpen = tools.every((_, i) => openModules[i]);
                const newState: Record<number, boolean> = {};
                tools.forEach((_, i) => { newState[i] = !allOpen; });
                setOpenModules(newState);
              }}
              className="text-sm text-text-muted hover:text-primary transition-colors font-medium flex items-center gap-1"
            >
              {tools.every((_, i) => openModules[i]) ? 'Collapse All' : 'Expand All'}
              <ChevronDown className={`w-4 h-4 transition-transform ${tools.every((_, i) => openModules[i]) ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <div className="space-y-3">
            {tools.map((tool, idx) => (
              <ModuleSpoiler
                key={idx}
                tool={tool}
                isOpen={!!openModules[idx]}
                onToggle={() => toggleModule(idx)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
