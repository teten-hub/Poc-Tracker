"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Radar, Search, Shield, Menu, X, UserX, Skull, Rss } from 'lucide-react';
import TorIcon from './TorIcon';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function Sidebar({
  isMobileOpen,
  setIsMobileOpen
}: SidebarProps) {
  const pathname = usePathname();
  const closeSidebar = () => setIsMobileOpen(false);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  const navItems = [
    { href: '/pocs', label: 'PoC Tracker', icon: Radar, matchPaths: ['/pocs'] },
    { href: '/ip-analyzer', label: 'IP Analyzer', icon: Search, matchPaths: ['/ip-analyzer'] },
    { href: '/shodan', label: 'Threat Exposure Intelligence', icon: Shield, matchPaths: ['/shodan'] },
    { href: '/hibp', label: 'Have I Been Pwned', icon: UserX, matchPaths: ['/hibp'] },
    { href: '/ransomware', label: 'Ransomware Tracker', icon: Skull, matchPaths: ['/ransomware'] },
    { href: '/tor-ips', label: 'Tor Exit Nodes', icon: null, isTor: true, matchPaths: ['/tor-ips'] },
    { href: '/tweetfeed', label: 'TweetFeed IOC', icon: Rss, matchPaths: ['/tweetfeed'] },
  ];

  const isActive = (item: typeof navItems[0]) =>
    item.matchPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

  return (
    <>
      {/* Top Navbar with Hamburger (Mobile Only) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-neutral/80 backdrop-blur-lg flex items-center justify-between px-5 z-40 border-b border-border/50">
        <Link href="/" onClick={closeSidebar} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="Threathunt" width={28} height={28} className="rounded-lg" />
          <h1 className="text-base font-bold tracking-tight text-text-base">Threathunt</h1>
        </Link>
        <button onClick={toggleMobileSidebar} className="p-2 -mr-2 text-text-muted hover:text-text-base transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Overlay (Mobile Only) */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Content */}
      <div 
        className={`h-screen bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(245,247,255,0.92))] dark:bg-[linear-gradient(180deg,rgba(25,25,24,0.96),rgba(17,17,17,1))] border-r border-border/80 backdrop-blur-xl flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 md:translate-x-0 group ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 md:w-[76px] md:hover:w-64 shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_24px_50px_rgba(31,42,111,0.08)]`}
      >
        {/* Header */}
        <div className="h-16 flex items-center px-4 justify-between md:justify-center md:group-hover:justify-between overflow-hidden border-b border-border/70">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="Threathunt" width={28} height={28} className="rounded-lg shrink-0" />
            <h1 className="text-base font-bold tracking-tight text-text-base truncate md:w-0 md:opacity-0 md:group-hover:w-auto md:group-hover:opacity-100 transition-all duration-300">
              Threathunt
            </h1>
          </Link>
          
          {/* Mobile close button */}
          <button onClick={closeSidebar} className="md:hidden p-1.5 text-text-muted hover:text-text-base transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Nav Links */}
        <nav className="flex-1 py-4 px-2.5 space-y-0.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link 
                key={item.href}
                href={item.href} 
                onClick={closeSidebar} 
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 relative group/link gap-3 md:justify-center md:group-hover:justify-start ${
                  active
                    ? 'bg-primary/8 text-primary font-semibold shadow-[inset_0_0_0_1px_rgba(49,57,251,0.08)]' 
                    : 'text-text-muted hover:bg-surface/80 hover:text-text-base hover:translate-x-0.5'
                }`}
                title={item.label}
              >
                {/* Active accent bar */}
                {active && (
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-full" />
                )}
                {item.isTor ? (
                  <TorIcon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-primary' : 'text-text-muted group-hover/link:text-text-base fill-current'}`} />
                ) : (
                  <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-primary' : 'text-text-muted group-hover/link:text-text-base'}`} />
                )}
                <span className="text-[13px] truncate md:w-0 md:opacity-0 md:group-hover:w-auto md:group-hover:opacity-100 transition-all duration-300">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Footer / Status Area */}
        <div className="p-3 mt-auto flex flex-col gap-1.5 md:items-center md:group-hover:items-stretch overflow-hidden border-t border-border/70">
          <div className="flex items-center w-full relative justify-between gap-2 rounded-xl border border-border/80 bg-white/30 px-2 py-2 dark:bg-white/5">
             <div className="flex items-center gap-2.5 md:justify-center md:group-hover:justify-start px-2 py-1.5 w-full text-text-muted cursor-default rounded-lg" title="System Online">
               <span className="relative flex h-2 w-2 shrink-0">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
               </span>
               <span className="text-[12px] font-medium truncate md:w-0 md:opacity-0 md:group-hover:w-auto md:group-hover:opacity-100 transition-all duration-300">Online</span>
             </div>
             <div className="md:w-0 md:opacity-0 md:group-hover:w-auto md:group-hover:opacity-100 transition-all duration-300">
               <ThemeToggle />
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
