'use client';

import React from 'react';
import ChatComponent from '@/components/ChatComponent';

export default function MentorChatPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">Intern Chat</h1>
        <p className="text-zinc-400 text-sm mt-1">One-to-one secure messaging with your assigned interns</p>
      </div>

      <ChatComponent />
    </div>
  );
}
