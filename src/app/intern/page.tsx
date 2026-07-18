'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, Bell, Check, RefreshCw, AlertCircle, X, Sparkles, Calendar, Video, Users, Phone, ShieldAlert, GraduationCap } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface Announcement {
  id: string;
  title: string;
  content: string;
  domain: string | null;
  createdAt: string;
}

interface Notification {
  id: string;
  content: string;
  type: string;
  createdAt: string;
}

interface Meeting {
  id: string;
  title: string;
  meetLink: string;
  date: string;
  time: string;
  meetingType: string;
  mentorName: string;
}

interface Profile {
  rollNo: number;
  name: string;
  phoneNumber: string | null;
  domain: string | null;
  duration: string | null;
  branch: string | null;
  group: string;
  course: string | null;
  status: string | null;
  mentor?: {
    name: string;
  };
}

export default function InternDashboard() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/intern/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard data');
      const data = await res.json();
      setNotifications(data.notifications);
      setAnnouncements(data.announcements);
      setProfile(data.profile);
      setMeetings(data.meetings || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDismissNotification = async (notifId: string) => {
    try {
      const res = await fetch('/api/intern/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notifId }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      }
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-brand-border relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="space-y-3 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-xs font-semibold uppercase tracking-wider border border-brand-gold/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Summer Intern 2026</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">
            Welcome Back, <span className="text-gold-gradient">{session?.user?.name || 'Intern'}</span>!
          </h1>
          <p className="text-zinc-400 text-sm max-w-md">
            Track daily tasks, submit weekly reports, schedule Google Meet reviews, and view standings.
          </p>
        </div>

        <div className="relative shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-full border border-brand-gold/20 overflow-hidden shadow-lg shadow-black/50 bg-black">
          <Image
            src="/logo.jpg"
            alt="Manchester Technologies logo"
            fill
            className="object-cover p-2 rounded-full"
            unoptimized
          />
        </div>
      </div>

      {/* Internship Info & Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Internship Duration & Info */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-between hover:border-brand-gold/20 transition duration-300">
          <div className="space-y-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-gold" />
              <span>Internship Profile</span>
            </h3>
            <p className="text-xs text-brand-muted">Your active internship parameters and duration.</p>
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span className="text-brand-muted">Roll Number:</span>
                <span className="text-white font-mono">#{profile?.rollNo || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span className="text-brand-muted">Phone Number:</span>
                <span className="text-white font-medium">{profile?.phoneNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span className="text-brand-muted">Domain:</span>
                <span className="text-white font-medium">{profile?.domain || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span className="text-brand-muted">Duration Batch:</span>
                <span className="text-white font-semibold text-brand-gold">{profile?.duration || 'N/A'}</span>
              </div>
              {profile?.course && (
                <div className="flex justify-between border-b border-brand-border/40 pb-2">
                  <span className="text-brand-muted">Course:</span>
                  <span className="text-white font-medium">{profile.course}</span>
                </div>
              )}
              {profile?.branch && (
                <div className="flex justify-between border-b border-brand-border/40 pb-2">
                  <span className="text-brand-muted">Branch / Specialization:</span>
                  <span className="text-white font-medium">{profile.branch}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span className="text-brand-muted">Group:</span>
                <span className="text-white font-medium">{profile?.group || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span className="text-brand-muted">Assigned Mentor:</span>
                <span className="text-white font-semibold text-brand-gold">{profile?.mentor?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-brand-muted">Internship Status:</span>
                <span className={`font-bold ${profile?.status === 'Active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {profile?.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 & 3: Upcoming Targeted Meetings */}
        {meetings.length > 0 ? (
          meetings.map((meeting) => (
            <div key={meeting.id} className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-between hover:border-brand-gold/20 transition duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 rounded-full blur-xl pointer-events-none" />
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Video className="w-5 h-5 text-brand-gold" />
                    <span>Upcoming Meeting</span>
                  </h3>
                  <span className="text-[9px] bg-brand-gold/10 border border-brand-gold/20 text-brand-gold px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    {meeting.meetingType}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white truncate">{meeting.title}</p>
                <div className="space-y-1.5 text-xs pt-1 text-zinc-300">
                  <p className="flex justify-between border-b border-brand-border/30 pb-1">
                    <span className="text-brand-muted">Date:</span>
                    <span className="text-white font-medium">{meeting.date}</span>
                  </p>
                  <p className="flex justify-between border-b border-brand-border/30 pb-1">
                    <span className="text-brand-muted">Time:</span>
                    <span className="text-white font-medium">{meeting.time}</span>
                  </p>
                  <p className="flex justify-between pb-0.5">
                    <span className="text-brand-muted">Host Mentor:</span>
                    <span className="text-white font-semibold">{meeting.mentorName}</span>
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <a
                  href={meeting.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-brand-gold text-black hover:bg-brand-gold-hover font-bold rounded-lg text-xs transition duration-200"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Google Meet</span>
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-center items-center hover:border-brand-gold/20 transition duration-300 relative overflow-hidden lg:col-span-2 text-center py-12 space-y-3">
            <Video className="w-12 h-12 text-zinc-600" />
            <p className="font-bold text-white text-base">No Scheduled Meetings</p>
            <p className="text-xs text-brand-muted max-w-xs">There are no Google Meet sessions scheduled for you by your mentor at the moment.</p>
          </div>
        )}

        {meetings.length === 1 && (
          <div className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-center items-center hover:border-brand-gold/20 transition duration-300 relative overflow-hidden text-center py-12 space-y-3">
            <Video className="w-8 h-8 text-zinc-600" />
            <p className="font-bold text-white text-sm">No More Meetings</p>
            <p className="text-xs text-brand-muted max-w-xs">You are up to date on all calendar schedules.</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {/* Announcements and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Announcements */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-brand-gold" />
              <span>Announcements</span>
            </h2>
          </div>

          <div className="space-y-4">
            {announcements.map((item) => (
              <div key={item.id} className="glass-panel p-6 rounded-2xl border border-brand-border space-y-3 hover:border-brand-gold/20 transition duration-300">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-bold text-white text-base">{item.title}</h3>
                  <span className="text-[9px] bg-brand-gold/10 border border-brand-gold/20 text-brand-gold px-2 py-0.5 rounded font-semibold uppercase tracking-wider shrink-0">
                    {item.domain || 'All Domains'}
                  </span>
                </div>
                <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </p>
                <p className="text-[10px] text-brand-muted">
                  {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="p-8 text-center text-brand-muted italic glass-panel rounded-2xl border border-brand-border">
                No active announcements for your domain
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Notifications */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-gold" />
              <span>Alert Notifications</span>
            </h2>
            {notifications.length > 0 && (
              <span className="bg-brand-gold text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                {notifications.length} New
              </span>
            )}
          </div>

          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif.id} className="p-4 bg-zinc-900/60 border border-brand-border rounded-xl flex items-start gap-3 justify-between">
                <div className="flex-1 text-xs leading-relaxed text-zinc-300">
                  <p>{notif.content}</p>
                  <span className="text-[9px] text-brand-muted block mt-1.5">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => handleDismissNotification(notif.id)}
                  className="text-zinc-500 hover:text-white p-0.5 hover:bg-white/5 rounded transition cursor-pointer border-0 bg-transparent shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="p-6 text-center text-brand-muted text-xs italic glass-panel rounded-xl border border-brand-border">
                You have no unread notifications
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
