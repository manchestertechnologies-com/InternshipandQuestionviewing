import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import React from 'react';
import AdminNav from '@/components/AdminNav';
import ResponsiveLayoutWrapper from '@/components/ResponsiveLayoutWrapper';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <ResponsiveLayoutWrapper
      title="Manchester Tech"
      subtitle="Admin Portal"
      navComponent={<AdminNav />}
    >
      {children}
    </ResponsiveLayoutWrapper>
  );
}
