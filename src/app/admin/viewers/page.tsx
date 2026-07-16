'use client';

import React, { useState, useEffect } from 'react';
import { Eye, FolderLock, Plus, RefreshCw, X, Shield, Lock } from 'lucide-react';

interface Viewer {
  id: string;
  name: string;
  user: {
    email: string;
  };
}

export default function ViewersManagement() {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchViewers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/viewers');
      if (!res.ok) throw new Error('Failed to load viewer accounts');
      const data = await res.json();
      setViewers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViewers();
  }, []);

  const handleCreateViewer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/viewers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create viewer account');

      setSuccess('Viewer account created successfully!');
      setName('');
      setEmail('');
      setPassword('');
      setShowModal(false);
      fetchViewers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gold-gradient">Viewer Accounts</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage guest viewer access to the question repository</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 py-2.5 px-5 bg-brand-gold text-black hover:bg-brand-gold-hover font-semibold rounded-lg shadow-lg shadow-brand-gold/15 transition duration-200 cursor-pointer btn-gold shrink-0 border-0"
        >
          <Plus className="w-5 h-5" />
          <span>Create Viewer Account</span>
        </button>
      </div>

      {success && (
        <div className="bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg text-sm text-center">
          {success}
        </div>
      )}

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {viewers.map((viewer) => (
            <div key={viewer.id} className="glass-panel p-6 rounded-2xl border border-brand-border flex items-center justify-between hover:border-brand-gold/30 transition duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-900 rounded-xl text-brand-gold border border-brand-border">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{viewer.name}</h3>
                  <p className="text-xs text-brand-muted mt-1">{viewer.user.email}</p>
                </div>
              </div>
              <span className="text-[10px] text-brand-muted uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/10">
                View Only
              </span>
            </div>
          ))}
          {viewers.length === 0 && (
            <div className="col-span-full py-12 text-center text-brand-muted italic">
              No guest viewer accounts created yet
            </div>
          )}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-brand-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-brand-border flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-2 text-brand-gold">
                <FolderLock className="w-5 h-5" />
                <h2 className="font-bold text-lg text-white">New Viewer Account</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-white transition cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateViewer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black/60 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition duration-200 text-sm"
                  placeholder="Professor / Partner Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black/60 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition duration-200 text-sm"
                  placeholder="viewer@institution.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black/60 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition duration-200 text-sm"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-zinc-900 border border-brand-border hover:bg-zinc-800 text-zinc-300 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-brand-gold hover:bg-brand-gold-hover text-black text-sm font-bold transition cursor-pointer btn-gold border-0"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
