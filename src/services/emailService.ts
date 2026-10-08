import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (
  to: string,
  message: string,
  otp: string
): Promise<any> => {
  try {
    const body = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Your Verification Code</h2>
        <p>${message}</p>
        <div style="font-size: 32px; font-weight: bold; color: #2563eb;
                    padding: 15px; background: #eef4ff; border-radius: 8px;
                    text-align: center; letter-spacing: 8px;">
          ${otp}
        </div>
        <p style="color: #999; font-size: 13px; margin-top: 20px;">
          This code will expire in 5 minutes.
        </p>
      </div>
    `;

    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@live-stream.com',
      to,
      subject: '🔐 Your Verification Code',
      html: body,
    });

    if (result.messageId) {
      logger.info(`Email sent to ${to}`);
      return { success: true, messageId: result.messageId };
    }
  } catch (error) {
    logger.error('Email error:', error);
    return { success: false, error: (error as Error).message };
  }
};