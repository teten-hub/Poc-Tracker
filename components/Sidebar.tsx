"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radar, Search, Shield, Menu, X, UserX, ChevronLeft, ChevronRight, Skull } from 'lucide-react';
import TorIcon from './TorIcon';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isDesktopCollapsed: boolean;
  toggleDesktopCollapse: () => void;
}

export default function Sidebar({
  isMobileOpen,
  setIsMobileOpen,
  isDesktopCollapsed,
  toggleDesktopCollapse
}: SidebarProps) {
  const pathname = usePathname();
  const closeSidebar = () => setIsMobileOpen(false);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Top Navbar with Hamburger (Mobile Only) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface border-b border-[#4d4d4d] flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full">
            <Shield className="text-black w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-text-base">SOC-Core</h1>
        </div>
        <button onClick={toggleMobileSidebar} className="p-2 -mr-2 text-text-muted hover:text-text-base transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay (Mobile Only) */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Content */}
      <div 
        className={`h-screen bg-surface border-r border-[#4d4d4d] flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDesktopCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className={`h-16 flex items-center justify-between px-4 border-b border-[#4d4d4d] ${isDesktopCollapsed ? 'justify-center' : ''}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full shrink-0">
              <Shield className="text-black w-5 h-5" />
            </div>
            {!isDesktopCollapsed && (
              <h1 className="text-lg font-bold tracking-tight text-text-base truncate animate-in fade-in duration-200">
                SOC-Core
              </h1>
            )}
          </div>
          
          {/* Mobile close button */}
          <button onClick={closeSidebar} className="md:hidden p-1.5 text-text-muted hover:text-text-base transition-colors">
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse button inside sidebar for easy collapse */}
          {!isDesktopCollapsed && (
            <button 
              onClick={toggleDesktopCollapse} 
              className="hidden md:flex p-1.5 text-text-muted hover:text-text-base hover:bg-[#1f1f1f] rounded transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Nav Links */}
        <nav className="flex-1 py-6 px-2.5 space-y-2 overflow-y-auto">
          <Link 
            href="/" 
            onClick={closeSidebar} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors relative group ${
              pathname === '/' 
                ? 'bg-[#4d4d4d] text-primary' 
                : 'text-text-muted hover:bg-[#4d4d4d] hover:text-text-base'
            } ${isDesktopCollapsed ? 'justify-center' : ''}`}
          >
            <Radar className="w-5 h-5 shrink-0" />
            {!isDesktopCollapsed ? (
              <span className="font-medium text-sm truncate animate-in fade-in duration-200">PoC Tracker</span>
            ) : (
              <span className="absolute left-full ml-3 px-2 py-1 bg-surface border border-[#4d4d4d] text-text-base text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 whitespace-nowrap shadow-md">
                PoC Tracker
              </span>
            )}
          </Link>
          <Link 
            href="/ip-analyzer" 
            onClick={closeSidebar} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors relative group ${
              pathname === '/ip-analyzer' 
                ? 'bg-[#4d4d4d] text-primary' 
                : 'text-text-muted hover:bg-[#4d4d4d] hover:text-text-base'
            } ${isDesktopCollapsed ? 'justify-center' : ''}`}
          >
            <Search className="w-5 h-5 shrink-0" />
            {!isDesktopCollapsed ? (
              <span className="font-medium text-sm truncate animate-in fade-in duration-200">IP Analyzer</span>
            ) : (
              <span className="absolute left-full ml-3 px-2 py-1 bg-surface border border-[#4d4d4d] text-text-base text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 whitespace-nowrap shadow-md">
                IP Analyzer
              </span>
            )}
          </Link>
          <Link 
            href="/hibp" 
            onClick={closeSidebar} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors relative group ${
              pathname === '/hibp' 
                ? 'bg-[#4d4d4d] text-primary' 
                : 'text-text-muted hover:bg-[#4d4d4d] hover:text-text-base'
            } ${isDesktopCollapsed ? 'justify-center' : ''}`}
          >
            <UserX className="w-5 h-5 shrink-0" />
            {!isDesktopCollapsed ? (
              <span className="font-medium text-sm truncate animate-in fade-in duration-200">Have I Been Pwned</span>
            ) : (
              <span className="absolute left-full ml-3 px-2 py-1 bg-surface border border-[#4d4d4d] text-text-base text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 whitespace-nowrap shadow-md">
                Have I Been Pwned
              </span>
            )}
          </Link>
          <Link 
            href="/ransomware" 
            onClick={closeSidebar} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors relative group ${
              pathname === '/ransomware' 
                ? 'bg-[#4d4d4d] text-primary' 
                : 'text-text-muted hover:bg-[#4d4d4d] hover:text-text-base'
            } ${isDesktopCollapsed ? 'justify-center' : ''}`}
          >
            <Skull className="w-5 h-5 shrink-0" />
            {!isDesktopCollapsed ? (
              <span className="font-medium text-sm truncate animate-in fade-in duration-200">Ransomware Tracker</span>
            ) : (
              <span className="absolute left-full ml-3 px-2 py-1 bg-surface border border-[#4d4d4d] text-text-base text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 whitespace-nowrap shadow-md">
                Ransomware Tracker
              </span>
            )}
          </Link>
          <Link 
            href="/tor-ips" 
            onClick={closeSidebar} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors relative group ${
              pathname === '/tor-ips' 
                ? 'bg-[#4d4d4d] text-primary' 
                : 'text-text-muted hover:bg-[#4d4d4d] hover:text-text-base'
            } ${isDesktopCollapsed ? 'justify-center' : ''}`}
          >
            <TorIcon className="w-5 h-5 shrink-0" />
            {!isDesktopCollapsed ? (
              <span className="font-medium text-sm truncate animate-in fade-in duration-200">Tor Exit Nodes</span>
            ) : (
              <span className="absolute left-full ml-3 px-2 py-1 bg-surface border border-[#4d4d4d] text-text-base text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 whitespace-nowrap shadow-md">
                Tor Exit Nodes
              </span>
            )}
          </Link>
        </nav>
        
        {/* Footer */}
        <div className={`p-4 border-t border-[#4d4d4d] text-xs font-medium text-text-muted flex flex-col gap-2 ${isDesktopCollapsed ? 'items-center justify-center' : ''}`}>
          <div className="flex items-center gap-2 relative group">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {!isDesktopCollapsed && <span className="animate-in fade-in duration-200">System Online</span>}
            {isDesktopCollapsed && (
              <span className="absolute left-full ml-3 px-2 py-1 bg-surface border border-[#4d4d4d] text-text-base text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 whitespace-nowrap shadow-md">
                System Online
              </span>
            )}
          </div>
          {!isDesktopCollapsed && (
            <div className="animate-in fade-in duration-200">
              &copy; {new Date().getFullYear()} SOC-Core
            </div>
          )}
        </div>
      </div>
    </>
  );
}