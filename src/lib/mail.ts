import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // 587 uses STARTTLS
  auth: {
    user: process.env.SMTP_EMAIL || 'manchesterTechnologiesss@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'upnp fpna meed hhdy',
  },
});

export async function sendOtpEmail(email: string, otp: string) {
  const mailOptions = {
    from: `"Manchester Technologies" <${process.env.SMTP_EMAIL || 'manchesterTechnologiesss@gmail.com'}>`,
    to: email,
    subject: 'Manchester Technologies - Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #c5a85c; text-align: center; font-weight: bold; margin-bottom: 5px;">Manchester Technologies</h2>
        <p style="text-align: center; font-style: italic; color: #777; margin-top: 0; font-size: 12px;">INNOVATE. DEVELOP. DOMINATE.</p>
        <h3 style="color: #333333; text-align: center;">Password Reset Request</h3>
        <p style="font-size: 16px; color: #555555; line-height: 1.5;">
          You have requested to reset your password. Use the following 6-digit One-Time Password (OTP) to proceed:
        </p>
        <div style="background-color: #f7f7f7; border: 1px dashed #c5a85c; padding: 15px; text-align: center; margin: 20px 0; border-radius: 4px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111111;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #888888; text-align: center;">
          This OTP is valid for 10 minutes. If you did not make this request, please ignore this email.
        </p>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
        <p style="font-size: 12px; color: #aaaaaa; text-align: center;">
          Manchester Technologies © 2026. All rights reserved.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
