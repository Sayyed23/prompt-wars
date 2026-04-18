'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Clock, MessageSquare, Shield, Home } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function MobileNav() {
  const pathname = usePathname();

  const tabs = [
    { label: 'Home', icon: Home, href: '/dashboard' },
    { label: 'Map', icon: Map, href: '/dashboard/map' },
    { label: 'Queues', icon: Clock, href: '/dashboard/queues' },
    { label: 'Assistant', icon: MessageSquare, href: '/assistant' },
    { label: 'Safety', icon: Shield, href: '/dashboard/safety' },
  ];

  const currentPath = pathname || '/';

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-2xl border-t border-white/5 px-6 pb-8 pt-4 lg:hidden z-50 transition-all duration-500"
      aria-label="Mobile Navigation"
    >
      <div className="flex justify-between items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.href || (currentPath === '/' && tab.href === '/dashboard');
          const Icon = tab.icon;
          
          return (
            <a
              key={tab.label}
              href={tab.href}
              role="button"
              aria-label={tab.label}
              aria-pressed={isActive}
              className={cn(
                "flex flex-col items-center gap-1.5 touch-target p-2 transition-all duration-300 no-underline",
                isActive ? "text-primary" : "text-stealth-400 grayscale opacity-60 hover:opacity-100 hover:grayscale-0"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-500",
                isActive ? "bg-primary/10 shadow-lg shadow-primary/20 scale-110" : "bg-transparent"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-all",
                isActive ? "opacity-100" : "opacity-0 scale-90"
              )}>
                {tab.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
