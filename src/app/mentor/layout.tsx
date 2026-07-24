import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import React from 'react';
import MentorNav from '@/components/MentorNav';
import ResponsiveLayoutWrapper from '@/components/ResponsiveLayoutWrapper';

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'MENTOR') {
    redirect('/');
  }

  return (
    <ResponsiveLayoutWrapper
      title="Manchester Tech"
      subtitle={session.user.group || 'Mentor Portal'}
      navComponent={<MentorNav />}
    >
      {children}
    </ResponsiveLayoutWrapper>
  );
}
