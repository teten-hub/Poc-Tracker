"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, ChevronRight } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-base text-text-base selection:bg-secondary/30">
      {/* Sidebar Component */}
      <Sidebar 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 w-full min-h-screen transition-all duration-300 md:pl-20">
        {/* Mobile top spacing if needed, but since we use sidebar, we can just pad content */}

        {/* Content Wrapper */}
        <div className="pt-4 md:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
