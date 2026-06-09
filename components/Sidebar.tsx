"use client";

import Link from 'next/link';
import Image from 'next/image';
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

  const navItems = [
    { href: '/pocs', label: 'PoC Tracker', icon: Radar, matchPaths: ['/pocs'] },
    { href: '/ip-analyzer', label: 'IP Analyzer', icon: Search, matchPaths: ['/ip-analyzer'] },
    { href: '/hibp', label: 'Have I Been Pwned', icon: UserX, matchPaths: ['/hibp'] },
    { href: '/ransomware', label: 'Ransomware Tracker', icon: Skull, matchPaths: ['/ransomware'] },
    { href: '/tor-ips', label: 'Tor Exit Nodes', icon: null, isTor: true, matchPaths: ['/tor-ips'] },
  ];

  const isActive = (item: typeof navItems[0]) =>
    item.matchPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

  return (
    <>
      {/* Top Navbar with Hamburger (Mobile Only) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40">
        <Link href="/" onClick={closeSidebar} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="SOC-Core" width={32} height={32} className="rounded-lg" />
          <h1 className="text-lg font-bold tracking-tight text-gray-900">SOC-Core</h1>
        </Link>
        <button onClick={toggleMobileSidebar} className="p-2 -mr-2 text-gray-500 hover:text-gray-900 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay (Mobile Only) */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-sm transition-opacity" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Content */}
      <div 
        className={`h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDesktopCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className={`h-20 flex items-center px-4 ${isDesktopCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Link href="/" className="flex items-center gap-3 overflow-hidden hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="SOC-Core" width={32} height={32} className="rounded-lg shrink-0" />
            {!isDesktopCollapsed && (
              <h1 className="text-lg font-bold tracking-tight text-gray-900 truncate animate-in fade-in duration-200">
                SOC-Core
              </h1>
            )}
          </Link>
          
          {/* Mobile close button */}
          <button onClick={closeSidebar} className="md:hidden p-1.5 text-gray-400 hover:text-gray-900 transition-colors">
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse button */}
          {!isDesktopCollapsed && (
            <button 
              onClick={toggleDesktopCollapse} 
              className="hidden md:flex items-center justify-center w-6 h-6 bg-gray-100 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4 ml-[-1px]" />
            </button>
          )}
        </div>
        
        {/* Nav Links */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link 
                key={item.href}
                href={item.href} 
                onClick={closeSidebar} 
                className={`flex items-center px-3 py-3 rounded-xl transition-all relative group ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                } ${isDesktopCollapsed ? 'justify-center' : 'gap-4'}`}
              >
                {item.isTor ? (
                  <TorIcon className={`w-5 h-5 shrink-0 ${active ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-700 fill-current'}`} />
                ) : (
                  <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-700'}`} />
                )}
                {!isDesktopCollapsed ? (
                  <span className="text-sm truncate animate-in fade-in duration-200">{item.label}</span>
                ) : (
                  <span className="absolute left-full ml-4 px-3 py-2 bg-white border border-gray-200 text-gray-900 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 whitespace-nowrap shadow-lg">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Footer / Status Area */}
        <div className={`p-4 mt-auto flex flex-col gap-2 ${isDesktopCollapsed ? 'items-center justify-center' : ''}`}>
          <div className="flex items-center gap-4 relative group">
            {!isDesktopCollapsed ? (
               <div className="flex items-center gap-3 px-3 py-3 w-full text-gray-500 hover:text-gray-700 transition-colors cursor-default rounded-xl hover:bg-gray-50">
                 <span className="relative flex h-2.5 w-2.5 shrink-0">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                 </span>
                 <span className="text-sm">System Online</span>
               </div>
            ) : (
               <div className="flex items-center justify-center w-full py-3">
                 <span className="relative flex h-2.5 w-2.5 shrink-0">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                 </span>
                 <span className="absolute left-full ml-4 px-3 py-2 bg-white border border-gray-200 text-gray-900 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 whitespace-nowrap shadow-lg">
                   System Online
                 </span>
               </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
