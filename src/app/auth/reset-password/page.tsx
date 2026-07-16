'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP and Reset
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request OTP');
      }

      setMessage('A 6-digit OTP has been sent to your email.');
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Image
          src="/logo.jpg"
          alt="Manchester Technologies Logo"
          width={100}
          height={100}
          className="rounded-full border-2 border-brand-gold/30 shadow-lg shadow-brand-gold/10"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gold-gradient">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-brand-muted">
          Manchester Technologies Authentication
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-2xl shadow-xl shadow-black/50">
          {error && (
            <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center mb-6">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg text-sm text-center mb-6">
              {message}
            </div>
          )}

          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleRequestOtp}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-brand-text">
                  Enter your Gmail ID
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black/60 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition duration-200 text-sm"
                    placeholder="student@gmail.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-black bg-brand-gold hover:bg-brand-gold-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold disabled:opacity-50 transition duration-250 cursor-pointer btn-gold"
                >
                  {loading ? 'Sending OTP...' : 'Send Reset OTP'}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-brand-text">
                  Enter 6-Digit OTP
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black/60 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition duration-200 text-sm text-center font-bold tracking-widest text-lg"
                    placeholder="000000"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-brand-text">
                  Enter New Password
                </label>
                <div className="mt-1">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                  {loading ? 'Updating Password...' : 'Verify OTP & Reset Password'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-brand-gold hover:text-brand-gold-hover font-medium underline"
                >
                  Resend OTP Code
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm font-medium text-brand-text hover:text-brand-gold transition duration-150"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
