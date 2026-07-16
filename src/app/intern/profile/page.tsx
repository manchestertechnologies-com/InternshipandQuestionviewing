'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Award, Lock, ShieldCheck, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ProfileData {
  rollNo: number;
  name: string;
  phoneNumber: string | null;
  domain: string | null;
  group: string;
  collegeName: string | null;
  course: string | null;
  applicationID: string | null;
  status: string | null;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Password update form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/intern/dashboard');
      if (!res.ok) throw new Error('Failed to load profile details');
      const data = await res.json();
      setProfile(data.profile);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/intern/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
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
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">My Profile</h1>
        <p className="text-zinc-400 text-sm mt-1">Review your credentials and update security settings</p>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg text-sm text-center">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card details */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-brand-border space-y-6">
          <div className="flex items-center gap-4 border-b border-brand-border pb-4">
            <div className="p-3.5 bg-zinc-900 border border-brand-border rounded-2xl text-brand-gold">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
              <p className="text-xs text-brand-gold uppercase tracking-wider font-semibold">{profile?.domain || 'General'} • Roll #{profile?.rollNo}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="p-3 bg-black/40 border border-brand-border/60 rounded-xl">
              <p className="text-[10px] text-brand-muted uppercase font-bold">Email Address</p>
              <p className="text-white font-medium mt-1 truncate">{session?.user?.email}</p>
            </div>
            <div className="p-3 bg-black/40 border border-brand-border/60 rounded-xl">
              <p className="text-[10px] text-brand-muted uppercase font-bold">Phone Number</p>
              <p className="text-white font-medium mt-1">{profile?.phoneNumber || 'Not provided'}</p>
            </div>
            <div className="p-3 bg-black/40 border border-brand-border/60 rounded-xl">
              <p className="text-[10px] text-brand-muted uppercase font-bold">College Name</p>
              <p className="text-white font-medium mt-1 truncate">{profile?.collegeName || 'N/A'}</p>
            </div>
            <div className="p-3 bg-black/40 border border-brand-border/60 rounded-xl">
              <p className="text-[10px] text-brand-muted uppercase font-bold">Course / Degree</p>
              <p className="text-white font-medium mt-1">{profile?.course || 'N/A'}</p>
            </div>
            <div className="p-3 bg-black/40 border border-brand-border/60 rounded-xl">
              <p className="text-[10px] text-brand-muted uppercase font-bold">Application ID</p>
              <p className="text-white font-medium mt-1 font-mono">{profile?.applicationID || 'N/A'}</p>
            </div>
            <div className="p-3 bg-black/40 border border-brand-border/60 rounded-xl">
              <p className="text-[10px] text-brand-muted uppercase font-bold">Batch Group</p>
              <p className="text-white font-medium mt-1">{profile?.group}</p>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-6">
          <div className="border-b border-brand-border pb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand-gold" />
            <h2 className="font-bold text-base text-white">Update Password</h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-sm"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-sm"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-sm"
                placeholder="Re-type new password"
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full py-2.5 px-4 rounded-lg bg-brand-gold hover:bg-brand-gold-hover text-black text-sm font-bold transition duration-200 cursor-pointer btn-gold border-0"
            >
              {updating ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
