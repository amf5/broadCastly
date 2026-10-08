import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_SECRET = process.env.JWT_SECRET || 'access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const OTP_SECRET = process.env.JWT_OTP_SECRET || 'otp-secret';

export interface TokenPayload {
  id: string;
  role?: string;
}

export const createAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
};

export const createRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
};

export const createTokenOTP = (payload: TokenPayload): string => {
  return jwt.sign(payload, OTP_SECRET, { expiresIn: '5m' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
};

export const verifyOTPToken = (token: string): TokenPayload => {
  return jwt.verify(token, OTP_SECRET) as TokenPayload;
};