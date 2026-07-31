'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, MessageSquare, Volume2, VolumeX, CheckCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  content: string;
  type: string;
  readStatus: boolean;
  createdAt: string;
}

interface ToastNotification extends Notification {
  senderName: string;
  preview: string;
  isMessage: boolean;
  toastId: string; // unique key for React list
}

// ─── Web Audio Beep ────────────────────────────────────────────────────────────
function playNotificationBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // Ignore — browser may block autoplay
  }
}

// ─── Parse notification content into sender + preview ─────────────────────────
function parseMessageNotification(content: string): { senderName: string; preview: string } {
  // Pattern: "New message from <Name>: "<preview>""
  const match = content.match(/^New message from (.+?): "(.+)"$/);
  if (match) {
    return { senderName: match[1], preview: match[2] };
  }
  return { senderName: 'Someone', preview: content };
}

// ─── Single Toast Card ─────────────────────────────────────────────────────────
function ToastCard({
  toast,
  onDismiss,
  onOpenChat,
}: {
  toast: ToastNotification;
  onDismiss: (toastId: string) => void;
  onOpenChat: () => void;
}) {
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const AUTO_DISMISS_MS = 5000;

  useEffect(() => {
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        onDismiss(toast.toastId);
      }
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [toast.toastId, onDismiss]);

  return (
    <div
      className="relative w-80 rounded-xl border border-zinc-700/80 bg-zinc-900/95 shadow-2xl shadow-black/60 backdrop-blur-md overflow-hidden animate-in slide-in-from-right-full duration-300"
      style={{ animationFillMode: 'both' }}
    >
      {/* Progress bar */}
      <div
        className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-75"
        style={{ width: `${progress}%` }}
      />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              New Message
            </span>
          </div>
          <button
            onClick={() => onDismiss(toast.toastId)}
            className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition border-0 bg-transparent cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sender */}
        <p className="text-sm font-bold text-white mb-0.5">From: {toast.senderName}</p>

        {/* Message preview */}
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-3">
          &ldquo;{toast.preview}&rdquo;
        </p>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              onDismiss(toast.toastId);
              onOpenChat();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition cursor-pointer border-0"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Open Chat
          </button>
          <button
            onClick={() => onDismiss(toast.toastId)}
            className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Notification System ──────────────────────────────────────────────────
export default function NotificationSystem() {
  const { data: session } = useSession();
  const router = useRouter();

  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showBellPanel, setShowBellPanel] = useState(false);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const soundEnabledRef = useRef(soundEnabled);

  // Keep ref in sync with state so interval callback always has latest value
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const chatRoute = session?.user?.role === 'MENTOR' ? '/mentor/chat' : '/intern/messages';

  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  const openChat = useCallback(() => {
    router.push(chatRoute);
    setShowBellPanel(false);
  }, [chatRoute, router]);

  const markAllRead = useCallback(async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setUnreadCount(0);
      setAllNotifications([]);
      seenIdsRef.current = new Set(); // reset seen so re-appearing items get noticed
    } catch {
      // ignore
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data: Notification[] = await res.json();

      setUnreadCount(data.length);
      setAllNotifications(data);

      // Find genuinely NEW notifications (not seen in previous polls)
      const newOnes = data.filter((n) => !seenIdsRef.current.has(n.id));

      if (newOnes.length > 0) {
        // Play sound once per batch
        if (soundEnabledRef.current) {
          playNotificationBeep();
        }

        // Convert to toasts (only MESSAGE type get a rich toast)
        const messageToasts: ToastNotification[] = newOnes
          .filter((n) => n.type === 'MESSAGE')
          .map((n) => {
            const { senderName, preview } = parseMessageNotification(n.content);
            return {
              ...n,
              senderName,
              preview,
              isMessage: true,
              toastId: `toast-${n.id}-${Date.now()}`,
            };
          });

        if (messageToasts.length > 0) {
          setToasts((prev) => [...prev, ...messageToasts].slice(-5)); // max 5 toasts visible
        }

        // Mark all new IDs as seen
        newOnes.forEach((n) => seenIdsRef.current.add(n.id));
      }
    } catch {
      // ignore poll errors silently
    }
  }, [session]);

  // Start polling when session is ready
  useEffect(() => {
    if (!session?.user) return;

    // Initial fetch (but don't show toasts for existing notifications on load)
    const initFetch = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const data: Notification[] = await res.json();
        setUnreadCount(data.length);
        setAllNotifications(data);
        // Mark existing as "seen" so we don't toast them on load
        data.forEach((n) => seenIdsRef.current.add(n.id));
      } catch {
        // ignore
      }
    };

    initFetch();

    // Poll every 4 seconds
    pollRef.current = setInterval(fetchNotifications, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [session, fetchNotifications]);

  if (!session?.user) return null;

  return (
    <>
      {/* ── Toast stack (fixed, top-right) ─────────────────────────── */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.toastId} className="pointer-events-auto">
            <ToastCard
              toast={toast}
              onDismiss={dismissToast}
              onOpenChat={openChat}
            />
          </div>
        ))}
      </div>

      {/* ── Bell button + panel (fixed, top-right area) ───────────── */}
      <div className="fixed top-4 right-4 z-[9990] flex items-start gap-3">
        {/* Spacer so bell doesn't overlap toasts */}
        <div />
      </div>

      {/* Bell icon — shown in bottom-right so it doesn't overlap toasts */}
      <div className="fixed bottom-6 right-6 z-[9980] flex flex-col items-end gap-3">
        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled((s) => !s)}
          title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
          className="p-2 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer backdrop-blur-sm"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Bell button */}
        <button
          onClick={() => setShowBellPanel((v) => !v)}
          className="relative p-3 rounded-full bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer backdrop-blur-sm shadow-xl"
        >
          <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-amber-400' : 'text-zinc-400'}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-extrabold flex items-center justify-center animate-bounce shadow-md shadow-amber-500/40">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Bell panel — notification list */}
        {showBellPanel && (
          <div className="absolute bottom-16 right-0 w-80 rounded-xl bg-zinc-950 border border-zinc-700/80 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowBellPanel(false)}
                  className="p-1 text-zinc-500 hover:text-white bg-transparent border-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-800/60">
              {allNotifications.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm italic">
                  No new notifications
                </div>
              ) : (
                allNotifications.map((n) => {
                  const { senderName, preview } = parseMessageNotification(n.content);
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (n.type === 'MESSAGE') {
                          openChat();
                          markAllRead();
                        }
                        setShowBellPanel(false);
                      }}
                      className="w-full text-left p-3 hover:bg-zinc-800/60 transition cursor-pointer border-0 bg-transparent"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/20 shrink-0 mt-0.5">
                          <MessageSquare className="w-3 h-3 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            From: {senderName}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
                            &ldquo;{preview}&rdquo;
                          </p>
                          <p className="text-[9px] text-zinc-600 mt-1">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {allNotifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/60">
                <button
                  onClick={() => {
                    openChat();
                    setShowBellPanel(false);
                  }}
                  className="w-full py-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold text-center border-0 bg-transparent cursor-pointer transition"
                >
                  Open Chat →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
