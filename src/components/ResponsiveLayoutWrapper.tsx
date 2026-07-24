'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

interface ResponsiveLayoutWrapperProps {
  title: string;
  subtitle: string;
  navComponent: React.ReactElement<{ onNavigate?: () => void }>;
  rightSidebar?: React.ReactNode;
  children: React.ReactNode;
}

export default function ResponsiveLayoutWrapper({
  title,
  subtitle,
  navComponent,
  rightSidebar,
  children,
}: ResponsiveLayoutWrapperProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileNav = () => setMobileOpen(false);

  // Clone navComponent to pass down onNavigate handler
  const navWithClose = React.cloneElement(navComponent, {
    onNavigate: closeMobileNav,
  });

  return (
    <div className="flex flex-col md:flex-row h-screen bg-black text-white overflow-hidden">
      {/* MOBILE TOP HEADER (Visible only on screens < md) */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-brand-border shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="/logo.jpg"
            alt="Manchester Technologies"
            width={34}
            height={34}
            className="rounded-full border border-brand-gold/30 shrink-0"
          />
          <div className="min-w-0">
            <h1 className="font-bold text-xs tracking-wide text-gold-gradient truncate">{title}</h1>
            <p className="text-[9px] text-brand-muted uppercase font-bold tracking-widest truncate">{subtitle}</p>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-brand-gold hover:text-white bg-zinc-900 border border-brand-border rounded-lg transition cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* MOBILE DRAWER BACKDROP & SLIDE-OVER MENU */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={closeMobileNav}
          />

          {/* Drawer Panel */}
          <aside className="relative z-10 w-72 max-w-[85vw] bg-zinc-950 border-r border-brand-border flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Image
                  src="/logo.jpg"
                  alt="Manchester Technologies"
                  width={36}
                  height={36}
                  className="rounded-full border border-brand-gold/30 shrink-0"
                />
                <div className="min-w-0">
                  <h1 className="font-bold text-xs tracking-wide text-gold-gradient truncate">{title}</h1>
                  <p className="text-[9px] text-brand-muted uppercase font-bold tracking-widest truncate">{subtitle}</p>
                </div>
              </div>

              <button
                onClick={closeMobileNav}
                className="p-1 text-zinc-400 hover:text-white bg-transparent border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {navWithClose}
            </div>
          </aside>
        </div>
      )}

      {/* DESKTOP FIXED LEFT SIDEBAR (Visible on md+) */}
      <aside className="hidden md:flex w-64 glass-panel border-r border-brand-border flex-col h-full shrink-0">
        <div className="p-6 border-b border-brand-border flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="Manchester Technologies"
            width={40}
            height={40}
            className="rounded-full border border-brand-gold/30 shrink-0"
          />
          <div>
            <h1 className="font-bold text-sm tracking-wide text-gold-gradient">{title}</h1>
            <p className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">{subtitle}</p>
          </div>
        </div>

        {navComponent}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-950 p-4 sm:p-6 md:p-8 relative">
        {/* Absolute Background Logo in Center of Layout */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <Image
            src="/logo.jpg"
            alt="Manchester Technologies Watermark"
            width={450}
            height={450}
            className="opacity-[0.04] select-none"
          />
        </div>

        <div className="relative z-10 flex flex-col h-full min-w-0">
          {children}
        </div>
      </main>

      {/* RIGHT SIDEBAR (If provided, e.g. Intern Metrics) */}
      {rightSidebar}
    </div>
  );
}
