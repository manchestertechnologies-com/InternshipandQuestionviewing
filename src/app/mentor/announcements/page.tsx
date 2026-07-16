'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, RefreshCw, X, Tag, Clock } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  domain: string | null;
  createdAt: string;
}

export default function MentorAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [domain, setDomain] = useState('All');
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mentor/announcements');
      if (!res.ok) throw new Error('Failed to load announcements');
      const data = await res.json();
      setAnnouncements(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/mentor/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, domain }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create announcement');

      setSuccess('Announcement broadcasted successfully!');
      setTitle('');
      setContent('');
      setDomain('All');
      setShowModal(false);
      fetchAnnouncements();
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
          <h1 className="text-3xl font-bold text-gold-gradient">Domain Announcements</h1>
          <p className="text-zinc-400 text-sm mt-1">Broadcast important notifications to specific domains or groups</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 py-2.5 px-5 bg-brand-gold text-black hover:bg-brand-gold-hover font-semibold rounded-lg shadow-lg shadow-brand-gold/15 transition duration-200 cursor-pointer btn-gold shrink-0 border-0"
        >
          <Plus className="w-5 h-5" />
          <span>Broadcast Announcement</span>
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
        <div className="space-y-6">
          {announcements.map((item) => (
            <div key={item.id} className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="text-xs text-brand-muted mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 text-[10px] bg-white/5 border border-brand-border px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-brand-gold shrink-0">
                  <Tag className="w-3 h-3" />
                  Target: {item.domain || 'All Domains'}
                </span>
              </div>

              <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                {item.content}
              </p>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="py-12 text-center text-brand-muted italic glass-panel rounded-2xl border border-brand-border">
              No announcements broadcasted yet. Click the button to send one.
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
                <Megaphone className="w-5 h-5" />
                <h2 className="font-bold text-lg text-white">Broadcast Announcement</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-white transition cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                  placeholder="e.g. Urgent Update: Midterm Submission"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Announcement Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                  placeholder="Type details..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Target Domain / Specialization
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full text-sm bg-black border border-brand-border text-white px-3 py-2.5 rounded-lg focus:outline-none focus:border-brand-gold"
                >
                  <option value="All">All Domains (Entire Group)</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile App Development">Mobile App Development</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Database Development">Database Development</option>
                  <option value="Testing & QA">Testing & QA</option>
                  <option value="Full Stack Development">Full Stack Development</option>
                </select>
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
                  {submitting ? 'Broadcasting...' : 'Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
