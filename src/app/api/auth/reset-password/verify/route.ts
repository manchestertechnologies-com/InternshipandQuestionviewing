import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Email, OTP, and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find token
    const otpToken = await prisma.otpToken.findFirst({
      where: {
        userId: user.id,
        token: otp.trim(),
      },
    });

    if (!otpToken) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    // Check expiry
    if (new Date() > otpToken.expiresAt) {
      // Delete expired token
      await prisma.otpToken.delete({ where: { id: otpToken.id } });
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clean up token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.otpToken.delete({
        where: { id: otpToken.id },
      }),
    ]);

    console.log(`[AUDIT] Password reset SUCCESSFUL for user ID: ${user.id} (${user.email}) at ${new Date().toISOString()}`);

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    console.error('[AUDIT] Failed to verify OTP and reset password:', err);
    return NextResponse.json({ error: 'Failed to reset password: ' + err.message }, { status: 500 });
  }
}
