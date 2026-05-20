"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radar, Search, Shield, Menu, X, UserX } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const closeSidebar = () => setIsOpen(false);
  const toggleSidebar = () => setIsOpen((prev) => !prev);

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
        <button onClick={toggleSidebar} className="p-2 -mr-2 text-text-muted hover:text-text-base transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay (Mobile Only) */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity" 
          onClick={closeSidebar} 
        />
      )}

      {/* Sidebar Content */}
      <div className={`w-64 h-screen bg-surface border-r border-[#4d4d4d] flex flex-col fixed left-0 top-0 z-50 transform transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between md:justify-start px-6 border-b border-[#4d4d4d]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full">
              <Shield className="text-black w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-text-base">SOC-Core</h1>
          </div>
          <button onClick={closeSidebar} className="md:hidden p-2 -mr-2 text-text-muted hover:text-text-base transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2">
          <Link href="/" onClick={closeSidebar} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/' ? 'bg-[#4d4d4d] text-primary' : 'text-text-muted hover:bg-[#4d4d4d] hover:text-text-base'}`}>
            <Radar className="w-5 h-5" />
            <span className="font-medium text-sm">PoC Tracker</span>
          </Link>
          <Link href="/ip-analyzer" onClick={closeSidebar} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/ip-analyzer' ? 'bg-[#4d4d4d] text-primary' : 'text-text-muted hover:bg-[#4d4d4d] hover:text-text-base'}`}>
            <Search className="w-5 h-5" />
            <span className="font-medium text-sm">IP Analyzer</span>
          </Link>
          <Link href="/hibp" onClick={closeSidebar} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/hibp' ? 'bg-[#4d4d4d] text-primary' : 'text-text-muted hover:bg-[#4d4d4d] hover:text-text-base'}`}>
            <UserX className="w-5 h-5" />
            <span className="font-medium text-sm">Have I Been Pwned</span>
          </Link>
        </nav>
        
        <div className="p-6 border-t border-[#4d4d4d] text-xs font-medium text-text-muted">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Online
          </div>
          &copy; {new Date().getFullYear()} SOC-Core
        </div>
      </div>
    </>
  );
}