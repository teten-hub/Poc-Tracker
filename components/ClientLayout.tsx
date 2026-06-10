"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, ChevronRight } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-base text-text-base selection:bg-primary/30">
      {/* Sidebar Component */}
      <Sidebar 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 w-full min-h-screen transition-all duration-300 md:pl-20">
        {/* Universal Top Bar (Empty on Desktop now, Mobile menu handled in Sidebar) */}
        <div className="hidden md:flex items-center h-16 bg-surface border-b border-gray-200 px-6 sticky top-0 z-30 shadow-sm gap-4">
        </div>

        {/* Content Wrapper */}
        <div className="pt-16 md:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
