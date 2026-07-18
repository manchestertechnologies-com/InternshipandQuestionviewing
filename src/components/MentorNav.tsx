'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Users,
  ClipboardList,
  FileCheck,
  Megaphone,
  MessageSquare,
  LogOut,
  FileSpreadsheet,
  BookOpen,
  Video,
  Trophy
} from 'lucide-react';

export default function MentorNav() {
  const pathname = usePathname();

  const links = [
    { href: '/mentor', label: 'My Interns', icon: Users },
    { href: '/mentor/tasks', label: 'Daily Tasks', icon: ClipboardList },
    { href: '/mentor/projects', label: 'Domain-Based Projects', icon: BookOpen },
    { href: '/mentor/submissions', label: 'Weekly Reports', icon: FileSpreadsheet },
    { href: '/mentor/meetings', label: 'Meetings / Google Meet', icon: Video },
    { href: '/mentor/reviews', label: 'Question Reviews', icon: FileCheck },
    { href: '/mentor/chat', label: 'Messages', icon: MessageSquare },
    { href: '/mentor/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/mentor/leaderboard', label: 'Scores / Leaderboard', icon: Trophy },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto">
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/mentor' && pathname.startsWith(link.href));
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
        className="flex items-center gap-3 w-full px-4 py-3 mt-4 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors cursor-pointer border-0 text-left shrink-0"
      >
        <LogOut className="w-5 h-5 shrink-0" />
        <span>Log Out</span>
      </button>
    </div>
  );
}
