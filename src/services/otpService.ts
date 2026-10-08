import { redis } from '../config/Redis/redis.js';
import logger from '../utils/logger.js';

const OTP_TTL = 300; // 5 دقايق

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const saveOTP = async (email: string, otp: string): Promise<void> => {
  await redis.set(`otp:${email}`, otp, { ex: OTP_TTL });
  logger.info(`OTP saved for ${email}`);
};

export const getOTP = async (email: string): Promise<string | null> => {
  return redis.get<string>(`otp:${email}`);
};

export const deleteOTP = async (email: string): Promise<void> => {
  await redis.del(`otp:${email}`);
  logger.info(`OTP deleted for ${email}`);
};