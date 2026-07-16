import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Clean up old tokens and save new one
    await prisma.$transaction([
      prisma.otpToken.deleteMany({
        where: { userId: user.id },
      }),
      prisma.otpToken.create({
        data: {
          userId: user.id,
          token: otp,
          expiresAt,
        },
      }),
    ]);

    // Send email
    await sendOtpEmail(user.email, otp);

    console.log(`[AUDIT] Password reset OTP requested for user ID: ${user.id} (${user.email}) at ${new Date().toISOString()}`);

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (err: any) {
    console.error('[AUDIT] Failed to request password reset OTP:', err);
    return NextResponse.json({ error: 'Failed to process request: ' + err.message }, { status: 500 });
  }
}
