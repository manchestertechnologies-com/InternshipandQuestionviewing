'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Video, Clock, Users, Plus, RefreshCw, X, FileText, CheckCircle, Info } from 'lucide-react';

interface Intern {
  id: string;
  name: string;
  rollNo: number;
  domain: string;
  duration: string;
}

interface Meeting {
  id: string;
  title: string;
  meetLink: string;
  date: string;
  time: string;
  meetingType: string;
  instructions: string | null;
  createdAt: string;
  targets: {
    id: string;
    intern: {
      name: string;
      rollNo: number;
    };
  }[];
}

export default function MentorMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [meetingType, setMeetingType] = useState('Daily Task Meeting');
  const [instructions, setInstructions] = useState('');
  
  const [scope, setScope] = useState<'ALL' | 'INDIVIDUALS' | 'FILTER'>('ALL');
  const [selectedInterns, setSelectedInterns] = useState<string[]>([]);
  const [targetDomain, setTargetDomain] = useState('Web Development');
  const [targetDuration, setTargetDuration] = useState('All');
  
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [meetingsRes, internsRes] = await Promise.all([
        fetch('/api/mentor/meetings'),
        fetch('/api/mentor/interns'),
      ]);

      if (!meetingsRes.ok || !internsRes.ok) throw new Error('Failed to load meetings data');

      const meetingsData = await meetingsRes.json();
      const internsData = await internsRes.json();

      setMeetings(meetingsData);
      setInterns(internsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckboxChange = (internId: string) => {
    setSelectedInterns((prev) =>
      prev.includes(internId)
        ? prev.filter((id) => id !== internId)
        : [...prev, internId]
    );
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (!title.trim()) throw new Error('Meeting Title is required');
      if (!meetLink.trim()) throw new Error('Google Meet Link is required');
      if (!meetLink.includes('meet.google.com/')) {
        throw new Error('Please enter a valid Google Meet link (e.g. meet.google.com/abc-defg-hij)');
      }
      if (!date) throw new Error('Date is required');
      if (!time) throw new Error('Time is required');

      const payload: any = {
        title: title.trim(),
        meetLink: meetLink.trim(),
        date,
        time,
        meetingType,
        instructions: instructions.trim(),
        scope,
      };

      if (scope === 'INDIVIDUALS') {
        payload.internIds = selectedInterns;
      } else if (scope === 'FILTER') {
        payload.targetDomain = targetDomain;
        payload.targetDuration = targetDuration;
      }

      const res = await fetch('/api/mentor/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save meeting');

      setSuccess('Google Meet link scheduled and notifications sent successfully!');
      setTitle('');
      setMeetLink('');
      setDate('');
      setTime('');
      setMeetingType('Daily Task Meeting');
      setInstructions('');
      setScope('ALL');
      setSelectedInterns([]);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter interns for matching lists in FILTER view preview
  const filteredPreview = interns.filter((i) => {
    const matchDom = i.domain?.toLowerCase() === targetDomain.toLowerCase();
    const matchDur = targetDuration === 'All' || i.duration?.toLowerCase() === targetDuration.toLowerCase();
    return matchDom && matchDur;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gold-gradient">Meetings / Google Meet</h1>
          <p className="text-zinc-400 text-sm mt-1">Schedule Google Meet video sessions and distribute links to specific target audiences</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 py-2.5 px-5 bg-brand-gold text-black hover:bg-brand-gold-hover font-semibold rounded-lg shadow-lg shadow-brand-gold/15 transition duration-200 cursor-pointer btn-gold shrink-0 border-0"
        >
          <Plus className="w-5 h-5" />
          <span>Schedule Meeting</span>
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
        <div className="grid grid-cols-1 gap-6">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4 hover:border-brand-gold/10 transition">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] bg-brand-gold/10 border border-brand-gold/20 text-brand-gold px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    {meeting.meetingType}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">{meeting.title}</h3>
                  <p className="text-xs text-brand-muted mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Scheduled on {meeting.date} at {meeting.time}</span>
                  </p>
                </div>

                <a
                  href={meeting.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 py-2 px-4 bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold font-semibold rounded-lg text-xs transition duration-200 border border-brand-gold/20 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Google Meet</span>
                </a>
              </div>

              {meeting.instructions && (
                <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {meeting.instructions}
                </p>
              )}

              {/* Targets details */}
              <div className="border-t border-brand-border pt-4">
                <p className="text-xs uppercase font-bold tracking-wider text-brand-gold mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Target Audience ({meeting.targets.length} Interns)</span>
                </p>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {meeting.targets.map((tgt) => (
                    <span key={tgt.id} className="text-[10px] bg-zinc-900 border border-brand-border px-2.5 py-1 rounded-full text-zinc-400">
                      {tgt.intern.name} (Roll #{tgt.intern.rollNo})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {meetings.length === 0 && (
            <div className="py-12 text-center text-brand-muted italic glass-panel rounded-2xl border border-brand-border">
              No meetings scheduled yet. Click "Schedule Meeting" to get started.
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-brand-border overflow-hidden shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-brand-border flex justify-between items-center bg-black/40 shrink-0">
              <div className="flex items-center gap-2 text-brand-gold">
                <Calendar className="w-5 h-5" />
                <h2 className="font-bold text-lg text-white">Schedule Google Meet</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-white transition cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                  placeholder="e.g. Weekly Sync-up on ML Models"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Google Meet Link *
                </label>
                <input
                  type="text"
                  required
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                  placeholder="e.g. meet.google.com/abc-defg-hij"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm text-zinc-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm text-zinc-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Meeting Type *
                </label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                  className="w-full text-sm bg-black border border-brand-border text-white px-3 py-2.5 rounded-lg focus:outline-none focus:border-brand-gold"
                >
                  <option value="Daily Task Meeting">Daily Task Meeting</option>
                  <option value="Weekly Project Review">Weekly Project Review</option>
                  <option value="Domain Meeting">Domain Meeting</option>
                  <option value="General Internship Meeting">General Internship Meeting</option>
                  <option value="One-to-One Meeting">One-to-One Meeting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Instructions / Message
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                  placeholder="Write message, agenda, or specific directions..."
                />
              </div>

              {/* Targeting Selection */}
              <div className="border-t border-brand-border pt-4">
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Target Audience Scope *
                </label>
                <div className="flex flex-wrap gap-4 mb-3">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="meetingScope"
                      checked={scope === 'ALL'}
                      onChange={() => setScope('ALL')}
                      className="accent-brand-gold"
                    />
                    <span>Entire Group</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="meetingScope"
                      checked={scope === 'FILTER'}
                      onChange={() => setScope('FILTER')}
                      className="accent-brand-gold"
                    />
                    <span>Domain / Duration Filter</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="meetingScope"
                      checked={scope === 'INDIVIDUALS'}
                      onChange={() => setScope('INDIVIDUALS')}
                      className="accent-brand-gold"
                    />
                    <span>Select Individuals</span>
                  </label>
                </div>

                {scope === 'INDIVIDUALS' && (
                  <div className="p-3 bg-black/60 border border-brand-border rounded-xl max-h-36 overflow-y-auto space-y-2 grid grid-cols-2 gap-1">
                    {interns.map((intern) => (
                      <label key={intern.id} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer hover:text-white transition truncate">
                        <input
                          type="checkbox"
                          checked={selectedInterns.includes(intern.id)}
                          onChange={() => handleCheckboxChange(intern.id)}
                          className="accent-brand-gold"
                        />
                        <span className="truncate">{intern.name} (#{intern.rollNo})</span>
                      </label>
                    ))}
                    {interns.length === 0 && (
                      <p className="text-zinc-500 text-xs italic col-span-2 text-center">No interns in your group</p>
                    )}
                  </div>
                )}

                {scope === 'FILTER' && (
                  <div className="space-y-3 bg-black/40 border border-brand-border p-3 rounded-xl">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-brand-muted uppercase tracking-wider mb-1">
                          Domain
                        </label>
                        <select
                          value={targetDomain}
                          onChange={(e) => setTargetDomain(e.target.value)}
                          className="w-full text-xs bg-zinc-950 border border-brand-border text-white px-2 py-1.5 rounded focus:outline-none focus:border-brand-gold"
                        >
                          <option value="Artificial Intelligence">Artificial Intelligence</option>
                          <option value="Machine Learning">Machine Learning</option>
                          <option value="Web Development">Web Development</option>
                          <option value="Full Stack Development">Full Stack Development</option>
                          <option value="Database Development">Database Development</option>
                          <option value="Mobile App Development">Mobile App Development</option>
                          <option value="Testing & QA">Testing & QA</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-brand-muted uppercase tracking-wider mb-1">
                          Duration Batch
                        </label>
                        <select
                          value={targetDuration}
                          onChange={(e) => setTargetDuration(e.target.value)}
                          className="w-full text-xs bg-zinc-950 border border-brand-border text-white px-2 py-1.5 rounded focus:outline-none focus:border-brand-gold"
                        >
                          <option value="All">All Durations</option>
                          <option value="30 Days">30 Days</option>
                          <option value="45 Days">45 Days</option>
                          <option value="60 Days">60 Days</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 text-[10px] text-brand-muted flex items-start gap-1">
                      <Info className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                      <span>
                        Targeting: <strong>{filteredPreview.length} interns</strong> matching domain "{targetDomain}" and duration "{targetDuration}".
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3 shrink-0">
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
                  {submitting ? 'Scheduling...' : 'Schedule Meet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
