'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  FolderLock,
  LogOut,
  Database
} from 'lucide-react';

export default function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/students', label: 'Interns Management', icon: Users },
    { href: '/admin/mentors', label: 'Mentors Management', icon: ShieldAlert },
    { href: '/admin/viewers', label: 'Viewer Accounts', icon: FolderLock },
    { href: '/admin/questions', label: 'Question Repository', icon: Database },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between p-4">
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-gold text-black font-semibold shadow shadow-brand-gold/20'
                  : 'text-brand-text hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors cursor-pointer border-0 text-left"
      >
        <LogOut className="w-5 h-5 shrink-0" />
        <span>Log Out</span>
      </button>
    </div>
  );
}
