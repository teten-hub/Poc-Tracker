"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-base text-text-base">
      {/* Sidebar Component */}
      <Sidebar 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 w-full min-h-screen transition-all duration-300 md:pl-[68px]">
        <div className="pt-14 md:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
