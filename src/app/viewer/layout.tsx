import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import React from 'react';
import Image from 'next/image';

export default async function ViewerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'VIEWER') {
    redirect('/');
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Header bar */}
      <header className="p-4 border-b border-brand-border flex justify-between items-center bg-black shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="Manchester Technologies"
            width={35}
            height={35}
            className="rounded-full border border-brand-gold/30"
          />
          <div>
            <h1 className="font-bold text-sm tracking-wide text-gold-gradient">Manchester Technologies</h1>
            <p className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">Question Repository Viewer</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white">{session.user.name}</p>
            <p className="text-[9px] text-brand-muted font-mono">{session.user.email}</p>
          </div>
        </div>
      </header>

      {/* Main viewer container */}
      <main className="flex-1 overflow-y-auto bg-zinc-950 relative">
        {children}
      </main>
    </div>
  );
}
