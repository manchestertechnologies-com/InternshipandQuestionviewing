'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Check, CheckCheck, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Partner {
  id: string;
  name: string;
  role: string;
  email: string;
  extra: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  readStatus: boolean;
  createdAt: string;
}

export default function ChatComponent() {
  const { data: session } = useSession();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch partners
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await fetch('/api/chat/partners');
        if (res.ok) {
          const data = await res.json();
          setPartners(data);
          if (data.length > 0) {
            setSelectedPartner(data[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching chat partners:', err);
      } finally {
        setLoadingPartners(false);
      }
    };
    fetchPartners();
  }, []);

  // Fetch messages for selected partner
  const fetchMessages = async (partnerId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/messages?partnerId=${partnerId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedPartner) {
      fetchMessages(selectedPartner.id);

      // Start polling for new messages every 4 seconds
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(selectedPartner.id, true);
      }, 4000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [selectedPartner]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner || !content.trim() || sending) return;

    setSending(true);
    const messageContent = content.trim();
    setContent('');

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedPartner.id,
          content: messageContent,
        }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setContent(messageContent); // Restore on error
    } finally {
      setSending(false);
    }
  };

  if (loadingPartners) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-gold" />
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-brand-border text-center text-brand-muted italic h-[50vh] flex flex-col justify-center items-center">
        <User className="w-12 h-12 text-zinc-700 mb-4" />
        <p>No chat partners available. Interns must have an assigned Mentor to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-brand-border h-[75vh] flex overflow-hidden">
      {/* Partners List */}
      <div className="w-80 border-r border-brand-border flex flex-col h-full bg-black/40">
        <div className="p-4 border-b border-brand-border font-bold text-sm tracking-wider uppercase text-brand-gold">
          Conversations
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-brand-border/40">
          {partners.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPartner(p)}
              className={`w-full p-4 text-left flex items-start gap-3 transition-colors border-0 cursor-pointer ${
                selectedPartner?.id === p.id ? 'bg-white/5' : 'hover:bg-white/5 bg-transparent'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-brand-border text-brand-gold">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-white truncate">{p.name}</p>
                <p className="text-xs text-brand-muted truncate mt-0.5">{p.extra}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-zinc-950/20">
        {selectedPartner ? (
          <>
            {/* Active Header */}
            <div className="p-4 border-b border-brand-border bg-black/40 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-white text-base">{selectedPartner.name}</h3>
                <p className="text-xs text-brand-muted mt-0.5">{selectedPartner.email} • {selectedPartner.extra}</p>
              </div>
            </div>

            {/* Messages Scroll Box */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-brand-gold" />
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === session?.user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] p-3 rounded-2xl text-sm leading-relaxed ${
                        isOwn
                          ? 'bg-brand-gold text-black rounded-tr-none font-medium'
                          : 'bg-zinc-900 border border-brand-border text-white rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-60">
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOwn && (
                            msg.readStatus ? (
                              <CheckCheck className="w-3 h-3 text-blue-900" />
                            ) : (
                              <Check className="w-3 h-3 text-zinc-700" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-brand-border bg-black/40 flex gap-3 shrink-0">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-sm"
              />
              <button
                type="submit"
                disabled={sending || !content.trim()}
                className="p-2.5 rounded-lg bg-brand-gold hover:bg-brand-gold-hover text-black transition disabled:opacity-50 cursor-pointer border-0 flex items-center justify-center shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-brand-muted italic">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
