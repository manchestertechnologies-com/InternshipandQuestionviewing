'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      const role = session.user.role;
      if (role === 'ADMIN') router.push('/admin');
      else if (role === 'MENTOR') router.push('/mentor');
      else if (role === 'INTERN') router.push('/intern');
      else if (role === 'VIEWER') router.push('/viewer');
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password: password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Image
          src="/logo.jpg"
          alt="Manchester Technologies Logo"
          width={140}
          height={140}
          className="rounded-full border-2 border-brand-gold/30 shadow-lg shadow-brand-gold/10"
          priority
        />
        <h2 className="mt-6 text-center text-4xl font-extrabold tracking-tight text-gold-gradient">
          Manchester Technologies
        </h2>
        <p className="mt-2 text-center text-sm text-brand-muted uppercase tracking-wider font-semibold">
          Internship & Question viewing platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-2xl shadow-xl shadow-black/50">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-text">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black/60 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition duration-200 text-sm"
                  placeholder="name@gmail.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium text-brand-text">
                  Password
                </label>
                <div className="text-sm">
                  <Link
                    href="/auth/reset-password"
                    className="font-medium text-brand-gold hover:text-brand-gold-hover transition duration-150"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black/60 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition duration-200 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-black bg-brand-gold hover:bg-brand-gold-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold disabled:opacity-50 transition duration-250 cursor-pointer btn-gold"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
