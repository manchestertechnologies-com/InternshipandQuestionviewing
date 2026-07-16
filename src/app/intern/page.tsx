'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, Bell, Check, RefreshCw, AlertCircle, X, Sparkles, Calendar, Video, Users } from 'lucide-react';
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

export default function InternDashboard() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/intern/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard data');
      const data = await res.json();
      setNotifications(data.notifications);
      setAnnouncements(data.announcements);
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
            Track daily tasks, submit weekly reports, log questions, and keep tabs on the leaderboards.
          </p>
        </div>

        <div className="relative shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-full border border-brand-gold/20 overflow-hidden shadow-lg shadow-black/50 bg-black">
          <Image
            src="/logo.jpg"
            alt="Manchester Technologies logo"
            fill
            className="object-cover p-2 rounded-full"
          />
        </div>
      </div>

      {/* Internship Info & Weekly Classes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Internship Duration & Info */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-between hover:border-brand-gold/20 transition duration-300">
          <div className="space-y-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-gold" />
              <span>Internship Details</span>
            </h3>
            <p className="text-xs text-brand-muted">Your active internship parameters and duration.</p>
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span className="text-brand-muted">Domain:</span>
                <span className="text-white font-medium">{session?.user?.domain || 'Web Development'}</span>
              </div>
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span className="text-brand-muted">Group:</span>
                <span className="text-white font-medium">{session?.user?.group || 'Group 1'}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-brand-muted">Duration:</span>
                <span className="text-brand-gold font-bold">12 Weeks (Summer 2026)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Domain-Based Class */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-between hover:border-brand-gold/20 transition duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Video className="w-5 h-5 text-brand-gold" />
              <span>Weekly Domain Class</span>
            </h3>
            <p className="text-xs text-brand-muted">Specially catered for <strong className="text-white">{session?.user?.domain || 'Web Development'}</strong>.</p>
            <div className="space-y-1 text-xs pt-2">
              <p className="text-white font-semibold">Google Meet Session</p>
              <p className="text-brand-muted">Every Wednesday at 6:00 PM</p>
            </div>
          </div>
          <div className="mt-4">
            <a
              href="https://meet.google.com/abc-defg-hij"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold font-semibold rounded-lg text-xs transition duration-200 border border-brand-gold/20"
            >
              <Video className="w-4 h-4" />
              <span>Join Domain Class</span>
            </a>
          </div>
        </div>

        {/* Card 3: General Class */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-between hover:border-brand-gold/20 transition duration-300 relative overflow-hidden">
          <div className="space-y-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-gold" />
              <span>Weekly General Class</span>
            </h3>
            <p className="text-xs text-brand-muted">Common classes where core concepts & skills are taught.</p>
            <div className="space-y-1 text-xs pt-2">
              <p className="text-white font-semibold">Google Meet Session (All)</p>
              <p className="text-brand-muted">Every Saturday at 4:00 PM</p>
            </div>
          </div>
          <div className="mt-4">
            <a
              href="https://meet.google.com/xyz-qprs-tuv"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg text-xs transition duration-200 border border-brand-border"
            >
              <Users className="w-4 h-4" />
              <span>Join General Class</span>
            </a>
          </div>
        </div>
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
