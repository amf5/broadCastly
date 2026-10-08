import rateLimit from 'express-rate-limit';
import { Request } from 'express';

export const generalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: '⚠️ Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: '⚠️ Too many login attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: '⚠️ Too many registration attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: '⚠️ Too many password reset attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: '⚠️ Too many OTP attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const streamLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: '⚠️ Too many stream requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const donationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: '⚠️ Too many donation attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: '⚠️ Too many comments, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: '⚠️ Too many admin requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const createCustomLimiter = (
  windowMs: number,
  max: number,
  message?: string
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || '⚠️ Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return (req.user?.id || req.ip) as string;
    },
  });
};

export const userRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: '⚠️ You have exceeded the limit of 3 requests per hour. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req.user?.id || req.ip) as string;
  },
  skip: (req: Request) => {
    return req.user?.role === 'admin';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: '⚠️ You have exceeded the limit of 3 requests per hour. Please try again later.',
      retryAfter: Math.ceil(60 * 60),
    });
  },
});

export default {
  generalLimiter,
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  otpLimiter,
  streamLimiter,
  donationLimiter,
  commentLimiter,
  adminLimiter,
  createCustomLimiter,
  userRateLimiter,
};