import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import React from 'react';
import Image from 'next/image';
import AdminNav from '@/components/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-brand-border flex flex-col h-full shrink-0">
        <div className="p-6 border-b border-brand-border flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="Manchester Technologies"
            width={40}
            height={40}
            className="rounded-full border border-brand-gold/30"
          />
          <div>
            <h1 className="font-bold text-sm tracking-wide text-gold-gradient">Manchester Tech</h1>
            <p className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">Admin Portal</p>
          </div>
        </div>
        
        {/* Navigation Component */}
        <AdminNav />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-950 p-8">
        {children}
      </main>
    </div>
  );
}
