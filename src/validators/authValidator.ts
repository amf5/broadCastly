import { z } from 'zod';

// ============================================================
// Register
// ============================================================
export const registerSchema = z.object({
  username: z
    .string({ error: 'Username is required' })
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

  email: z
    .string({ error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase(),

  password: z
    .string({ error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),
});

// ============================================================
// Login
// ============================================================
export const loginSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase(),

  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required'),
});

// ============================================================
// Activate Account
// ============================================================
export const activateSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase(),

  otp: z
    .string({ error: 'OTP is required' })
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must be numbers only'),
});

// ============================================================
// Resend Code
// ============================================================
export const resendCodeSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase(),
});

// ============================================================
// Forgot Password
// ============================================================
export const forgotPasswordSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase(),
});

// ============================================================
// Send Token OTP
// ============================================================
export const sendTokenOTPSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase(),

  otp: z
    .string({ error: 'OTP is required' })
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must be numbers only'),
});

// ============================================================
// Confirm Old Password
// ============================================================
export const confirmOldPasswordSchema = z.object({
  oldPassword: z
    .string({ error: 'Old password is required' })
    .min(1, 'Old password is required'),
});

// ============================================================
// Change Password
// ============================================================
export const changePasswordSchema = z.object({
  newPassword: z
    .string({ error: 'New password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),
});

// ============================================================
// Refresh Token
// ============================================================
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ error: 'Refresh token is required' })
    .min(1, 'Refresh token is required'),
});

// ============================================================
// Types
// ============================================================
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ActivateInput = z.infer<typeof activateSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;