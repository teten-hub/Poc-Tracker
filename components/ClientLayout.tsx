"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, ChevronRight } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  // Load state from localStorage on load
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      setIsDesktopCollapsed(true);
    }
  }, []);

  const toggleDesktopCollapse = () => {
    setIsDesktopCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-base text-text-base selection:bg-primary/30">
      {/* Sidebar Component */}
      <Sidebar 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isDesktopCollapsed={isDesktopCollapsed}
        toggleDesktopCollapse={toggleDesktopCollapse}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 w-full min-h-screen transition-all duration-300 ${
          isDesktopCollapsed ? 'md:pl-16' : 'md:pl-64'
        }`}
      >
        {/* Universal Top Bar with Hamburger for Desktop Collapse */}
        <div className="hidden md:flex items-center h-16 bg-surface border-b border-[#4d4d4d] px-6 sticky top-0 z-30 shadow-sm gap-4">
          {isDesktopCollapsed && (
            <button 
              onClick={toggleDesktopCollapse}
              className="p-2 -ml-2 text-text-muted hover:text-text-base hover:bg-[#1f1f1f] rounded-lg transition-all flex items-center gap-2 group border border-transparent hover:border-[#4d4d4d]"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
          
          <span className="text-xs font-mono text-text-muted bg-[#1f1f1f] px-3 py-1.5 rounded-full border border-[#4d4d4d] tracking-wide uppercase">
            SOC-Core Workspace / ThreatIntel
          </span>
        </div>

        {/* Content Wrapper */}
        <div className="pt-16 md:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
