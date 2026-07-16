'use client';

import React, { useState, useEffect } from 'react';
import { Users, Mail, Award, Edit, Star, RefreshCw, X, ShieldAlert } from 'lucide-react';

interface Intern {
  id: string;
  rollNo: number;
  name: string;
  phoneNumber: string | null;
  domain: string | null;
  group: string;
  collegeName: string | null;
  course: string | null;
  applicationID: string | null;
  status: string | null;
  totalPoints: number;
  mentorScore: number;
  progress: number;
  rank: number;
  user: {
    email: string;
  };
}

export default function MentorInterns() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [editIntern, setEditIntern] = useState<Intern | null>(null);
  const [scoreIntern, setScoreIntern] = useState<Intern | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [group, setGroup] = useState('');
  const [score, setScore] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mentor/interns');
      if (!res.ok) throw new Error('Failed to load interns');
      const data = await res.json();
      setInterns(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterns();
  }, []);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editIntern) return;
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/mentor/interns/${editIntern.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, domain, group }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update intern profile');

      setEditIntern(null);
      fetchInterns();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoreIntern) return;
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/mentor/interns/${scoreIntern.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit score');

      setScoreIntern(null);
      fetchInterns();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInterns = interns.filter((i) => {
    const term = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(term) ||
      i.user.email.toLowerCase().includes(term) ||
      (i.domain && i.domain.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">Assigned Interns</h1>
        <p className="text-zinc-400 text-sm mt-1">Mentor, monitor, score, and edit student profiles in your group</p>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {/* Search Filter */}
      <div className="glass-panel p-4 rounded-xl border border-brand-border flex items-center bg-black/40 w-full max-w-md">
        <Users className="w-5 h-5 text-brand-muted mr-3" />
        <input
          type="text"
          placeholder="Search by name, email, or domain..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-white placeholder-zinc-500 text-sm w-full focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-gold" />
        </div>
      ) : (
        <div className="space-y-10">
          {(() => {
            const internsByDomain: { [key: string]: Intern[] } = {};
            filteredInterns.forEach((intern) => {
              const dom = intern.domain || 'Web Development';
              if (!internsByDomain[dom]) {
                internsByDomain[dom] = [];
              }
              internsByDomain[dom].push(intern);
            });

            const activeDomains = Object.keys(internsByDomain).sort();

            if (activeDomains.length === 0) {
              return (
                <div className="py-12 text-center text-brand-muted italic">
                  No assigned interns found matching the criteria
                </div>
              );
            }

            return activeDomains.map((domName) => (
              <div key={domName} className="space-y-4">
                <h3 className="text-xl font-bold text-brand-gold border-b border-brand-border/40 pb-2 flex items-center justify-between">
                  <span>{domName}</span>
                  <span className="text-xs bg-white/5 text-brand-muted px-2.5 py-0.5 rounded-full font-medium">
                    {internsByDomain[domName].length} Interns
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {internsByDomain[domName].map((intern, idx) => (
                    <div key={intern.id} className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-between hover:border-brand-gold/30 transition duration-300 relative overflow-hidden group">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-brand-gold/10 text-brand-gold border border-brand-gold/30 px-2 py-0.5 rounded-md font-bold">
                              #{idx + 1}
                            </span>
                            <h3 className="font-bold text-white text-lg">{intern.name}</h3>
                          </div>
                          <span className="text-[10px] bg-white/5 border border-brand-border text-brand-muted px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                            Rank #{intern.rank || 'N/A'}
                          </span>
                        </div>
                        <p className="text-xs text-brand-gold font-semibold uppercase tracking-wider">Roll #{intern.rollNo}</p>

                        <div className="space-y-2 text-sm text-zinc-300">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-brand-muted" />
                            <span className="truncate">{intern.user.email}</span>
                          </div>
                        </div>

                        {/* Score Stats */}
                        <div className="grid grid-cols-2 gap-4 bg-black/40 border border-brand-border/60 p-3 rounded-lg text-xs text-center mt-2">
                          <div>
                            <p className="text-brand-muted uppercase font-bold">Total Points</p>
                            <p className="text-base font-bold text-white mt-0.5">{intern.totalPoints} pts</p>
                          </div>
                          <div>
                            <p className="text-brand-muted uppercase font-bold">Mentor Score</p>
                            <p className="text-base font-bold text-brand-gold mt-0.5">{intern.mentorScore || 'N/A'} / 10</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-6 pt-4 border-t border-brand-border flex gap-3">
                        <button
                          onClick={() => {
                            setEditIntern(intern);
                            setName(intern.name);
                            setEmail(intern.user.email);
                            setDomain(intern.domain || '');
                            setGroup(intern.group);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-brand-border rounded-lg text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit Profile</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setScoreIntern(intern);
                            setScore(intern.mentorScore || 5);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-900 border border-brand-border rounded-lg text-xs font-semibold text-brand-gold hover:bg-zinc-800 transition cursor-pointer"
                        >
                          <Star className="w-4 h-4" />
                          <span>Score Intern</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* Edit Profile Modal */}
      {editIntern && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-brand-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-brand-border flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-2 text-brand-gold">
                <Edit className="w-5 h-5" />
                <h2 className="font-bold text-lg text-white">Edit Intern Details</h2>
              </div>
              <button
                onClick={() => setEditIntern(null)}
                className="text-zinc-500 hover:text-white transition cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black/60 text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
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
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black/60 text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Domain / Specialization
                </label>
                <select
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black/60 text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                >
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

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Group Assignment
                </label>
                <input
                  type="text"
                  required
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black/60 text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditIntern(null)}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-zinc-900 border border-brand-border hover:bg-zinc-800 text-zinc-300 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-brand-gold hover:bg-brand-gold-hover text-black text-sm font-bold transition cursor-pointer btn-gold border-0"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Score Intern Modal */}
      {scoreIntern && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-brand-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-brand-border flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-2 text-brand-gold">
                <Star className="w-5 h-5" />
                <h2 className="font-bold text-lg text-white">Score Intern Performance</h2>
              </div>
              <button
                onClick={() => setScoreIntern(null)}
                className="text-zinc-500 hover:text-white transition cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScoreSubmit} className="p-6 space-y-6">
              <div className="text-center bg-zinc-900/60 p-4 rounded-xl border border-brand-border">
                <p className="text-zinc-400 text-sm">Rating performance for</p>
                <p className="text-white font-bold text-lg mt-1">{scoreIntern.name}</p>
                <p className="text-brand-gold text-2xl font-black mt-4">{score}/10</p>
                <p className="text-[10px] text-brand-muted uppercase font-bold tracking-widest mt-1">
                  {score >= 10 ? 'Excellent 🌟' : score >= 9 ? 'Very Good 👍' : score >= 8 ? 'Good 🙂' : 'Needs Work'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider">
                  Select Score (1–10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-gold focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-brand-muted font-bold px-1">
                  <span>1 (Poor)</span>
                  <span>5 (Average)</span>
                  <span>10 (Excellent)</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setScoreIntern(null)}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-zinc-900 border border-brand-border hover:bg-zinc-800 text-zinc-300 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-brand-gold hover:bg-brand-gold-hover text-black text-sm font-bold transition cursor-pointer btn-gold border-0"
                >
                  {submitting ? 'Submitting...' : 'Submit Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
