'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Download, RefreshCw, FileText, ExternalLink } from 'lucide-react';

interface ProblemStatement {
  id: string;
  title: string;
  fileUrl: string;
  group: string;
  uploadedBy: string;
  createdAt: string;
}

export default function ProblemStatementsPage() {
  const [statements, setStatements] = useState<ProblemStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatements = async () => {
    try {
      const res = await fetch('/api/intern/problem-statements');
      if (!res.ok) throw new Error('Failed to load problem statements');
      const data = await res.json();
      setStatements(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">Problem Statement Module</h1>
        <p className="text-zinc-400 text-sm mt-1">Review the core problem statement documentation assigned to your group</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {statements.map((ps) => (
            <div key={ps.id} className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-between hover:border-brand-gold/30 transition duration-300 relative overflow-hidden group">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-zinc-900 border border-brand-border rounded-xl text-brand-gold">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{ps.title}</h3>
                    <p className="text-xs text-brand-muted mt-0.5">Uploaded by {ps.uploadedBy}</p>
                  </div>
                </div>

                <div className="bg-black/40 border border-brand-border/60 p-3.5 rounded-xl text-xs space-y-1.5 text-zinc-300">
                  <div>Group target: <span className="text-white font-medium">{ps.group}</span></div>
                  <div>Release date: <span className="text-white font-medium">{new Date(ps.createdAt).toLocaleDateString()}</span></div>
                </div>
              </div>

              {/* View / Download */}
              <div className="mt-6 pt-4 border-t border-brand-border flex gap-3">
                <a
                  href={ps.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-brand-border hover:bg-zinc-900 rounded-lg text-xs font-semibold text-zinc-300 transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Online</span>
                </a>
                
                <a
                  href={ps.fileUrl}
                  download
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-900 border border-brand-border hover:bg-zinc-800 rounded-lg text-xs font-semibold text-brand-gold transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          ))}
          
          {statements.length === 0 && (
            <div className="col-span-full py-12 text-center text-brand-muted italic glass-panel rounded-2xl border border-brand-border">
              No problem statements uploaded for your group yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
