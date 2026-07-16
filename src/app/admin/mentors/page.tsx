'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Mail, Users, RefreshCw } from 'lucide-react';

interface Mentor {
  id: string;
  name: string;
  group: string;
  user: {
    email: string;
  };
  _count: {
    interns: number;
  };
}

export default function MentorsManagement() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/mentors');
      if (!res.ok) throw new Error('Failed to load mentors');
      const data = await res.json();
      setMentors(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">Mentors Management</h1>
        <p className="text-zinc-400 text-sm mt-1">Review active mentor credentials and group assignments</p>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-gold" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <div key={mentor.id} className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-between hover:border-brand-gold/40 transition duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 rounded-full blur-xl pointer-events-none group-hover:bg-brand-gold/10 transition-colors" />
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-gold/10 rounded-xl text-brand-gold border border-brand-gold/20">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{mentor.name}</h3>
                    <p className="text-xs text-brand-gold font-semibold uppercase tracking-wider">{mentor.group}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-zinc-300 text-sm">
                    <Mail className="w-4 h-4 text-brand-muted" />
                    <span className="truncate">{mentor.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300 text-sm">
                    <Users className="w-4 h-4 text-brand-muted" />
                    <span>{mentor._count.interns} Interns assigned</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-brand-border flex justify-end">
                <span className="text-[10px] text-brand-muted uppercase font-bold tracking-widest bg-white/5 px-2.5 py-1 rounded-full">
                  Status: Active
                </span>
              </div>
            </div>
          ))}
          {mentors.length === 0 && (
            <div className="col-span-full py-12 text-center text-brand-muted italic">
              No mentors loaded. Run database seed to initialize.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
