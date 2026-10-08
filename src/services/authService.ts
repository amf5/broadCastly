
import {
  createUser,
  findByEmail,
  findById,
  updateLastLogin,
  comparePassword,
  updateUser,
} from '../repositories/userRepository.js';

import {
  createToken,
  findTokenByRefreshToken,
  deleteTokenByUserId,
} from '../repositories/tokenRepository.js';

import {
  createAccessToken,
  createRefreshToken,
  createTokenOTP,
  verifyRefreshToken,
} from '../utils/token.js';

import {
  generateOTP,
  saveOTP,
  getOTP,
  deleteOTP,
} from './otpService.js';

import { sendEmail } from './emailService.js';
import logger from '../utils/logger.js';
import { Console } from 'winston/lib/winston/transports/index.js';

// ============================================================
// 1. Login
// ============================================================
export const login = async (email: string, password: string) => {
  const user = await findByEmail(email);
  if (!user) {
    return { status: 404, success: false, message: 'User not found' };
  }

  if (!user.is_active) {
     const existingOTP = await getOTP(email);
     if (existingOTP) {
    return {
      status: 403,
      success: false,
      message: 'Account not activated. Check your email for the OTP.',
    };
  }
     const otp = generateOTP();
  console.log('OTP:', otp);

  await saveOTP(email, otp);
  await sendEmail(email, 'activate your account', otp);
    return { status: 403, success: false, message: 'Account not activated,check your gmail to acctivate your account' };
  }

  const isMatch = await comparePassword(user, password);
  if (!isMatch) {
    return { status: 401, success: false, message: 'Bad credentials' };
  }

  const accessToken = createAccessToken({ id: user.id, role: user.role });
  const refreshToken = createRefreshToken({ id: user.id, role: user.role });

  await updateLastLogin(user.id);
  await createToken(user.id, refreshToken);

  logger.info(`User logged in: ${user.email}`);

  return {
    status: 200,
    success: true,
    message: 'Logged in successfully',
    data: {
      accessToken,
      refreshToken,
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
};

// ============================================================
// 2. Register
// ============================================================
export const register = async (
  username: string,
  email: string,
  password: string
) => {
  const existingUser = await findByEmail(email);
  if (existingUser) {
    return {
      status: 401,
      success: false,
      message: 'Account already exists with this email',
    };
  }

  const user = await createUser({ username, email, password });

  const otp = generateOTP();
  console.log('OTP:', otp);

  await saveOTP(email, otp);
  await sendEmail(email, 'activate your account', otp);

  logger.info(`User registered: ${email}`);

  return {
    status: 201,
    success: true,
    message: 'Registered! Check your email to activate your account',
    data: { id: user?.id, email },
  };
};

// ============================================================
// 3. Activate Account
// ============================================================
export const activateAccount = async (email: string, otp: string) => {
  const user = await findByEmail(email);
  if (!user) {
    return { status: 404, success: false, message: 'User not found' };
  }

  if (!otp) {
    return { status: 422, success: false, message: 'Enter the code' };
  }

  const savedOtp = await getOTP(email);
  if (!savedOtp) {
    return { status: 403, success: false, message: 'Resend another code' };
  }
const otpNumber = Number(otp);
  if (Number(savedOtp) !== otpNumber) {
    return { status: 400, success: false, message: 'Invalid code' };
  }

  await updateUser(user.id, { is_active: true });
  await deleteOTP(email);

  const accessToken = createAccessToken({ id: user.id, role: user.role });
  const refreshToken = createRefreshToken({ id: user.id, role: user.role });
  await createToken(user.id, refreshToken);

  logger.info(`Account activated: ${email}`);

  return {
    status: 200,
    success: true,
    message: 'Account activated successfully',
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      accessToken,
      refreshToken,
    },
  };
};

// ============================================================
// 4. Resend Code
// ============================================================
export const resendCode = async (email: string) => {
  const user = await findByEmail(email);
  if (!user) {
    return { status: 403, success: false, message: 'No account with this email' };
  }

  const otp = generateOTP();
  await saveOTP(email, otp);
  await sendEmail(email, 'activate your account', otp);

  logger.info(`OTP resent to ${email}`);

  return { status: 200, success: true, message: 'Code resent! Check your email' };
};

// ============================================================
// 5. Send OTP Token (for password change)
// ============================================================
export const sendTokenOTP = async (email: string, otp: string) => {
  const user = await findByEmail(email);
  if (!user) {
    return { status: 404, success: false, message: 'User not found' };
  }

  const savedOtp = await getOTP(email);
  if (!savedOtp) {
    return { status: 403, success: false, message: 'Resend another code' };
  }
  const otpNumber = Number(otp);

   if (Number(savedOtp) !== otpNumber) {
    return { status: 400, success: false, message: 'Invalid code' };
  }

  const token = createTokenOTP({ id: user.id, role: user.role });

  return { status: 200, success: true, message: 'Token created', token };
};

// ============================================================
// 6. Forgot Password
// ============================================================
export const forgotPassword = async (email: string) => {
  const user = await findByEmail(email);
  if (!user) {
    return { status: 404, success: false, message: 'User not found' };
  }

  const otp = generateOTP();
  await saveOTP(email, otp);
  await sendEmail(email, 'reset your password', otp);
  await deleteTokenByUserId(user.id);

  logger.info(`Password reset requested: ${email}`);

  return { status: 200, success: true, message: 'OTP sent to your email' };
};

// ============================================================
// 7. Get Access Token (refresh)
// ============================================================
export const getAccessToken = async (refreshToken: string) => {
  const token = await findTokenByRefreshToken(refreshToken);
  if (!token) {
    return { status: 404, success: false, message: 'Refresh token not found' };
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const accessToken = createAccessToken({ id: decoded.id, role: decoded.role });
    return { status: 200, success: true, accessToken };
  } catch {
    return { status: 400, success: false, message: 'Invalid token' };
  }
};

// ============================================================
// 8. Logout
// ============================================================
export const logout = async (userId: string) => {
  const deleted = await deleteTokenByUserId(userId);
  if (!deleted) {
    return { status: 404, success: false, message: 'Token not found' };
  }

  logger.info(`User logged out: ${userId}`);

  return { status: 200, success: true, message: 'Logged out successfully' };
};

// ============================================================
// 9. Confirm Old Password
// ============================================================
export const confirmOldPassword = async (userId: string, oldPassword: string) => {
  const user = await findById(userId);
  if (!user) {
    return { status: 404, success: false, message: 'User not found' };
  }

  const isMatch = await comparePassword(user, oldPassword);
  await deleteTokenByUserId(userId);

  if (!isMatch) {
    return { status: 401, success: false, message: 'Bad credentials' };
  }

  const token = createTokenOTP({ id: user.id, role: user.role });
  return { status: 200, success: true, message: 'Confirmed', token };
};

// ============================================================
// 10. Change Password
// ============================================================
export const changePassword = async (userId: string, newPassword: string) => {
  const user = await findById(userId);
  if (!user) {
    return { status: 404, success: false, message: 'User not found' };
  }

  if (!newPassword) {
    return { status: 422, success: false, message: 'Enter new password' };
  }

  await updateUser(user.id, { password: newPassword });

  const accessToken = createAccessToken({ id: user.id, role: user.role });
  const refreshToken = createRefreshToken({ id: user.id, role: user.role });
  await createToken(user.id, refreshToken);

  logger.info(`Password changed: ${user.email}`);

  return {
    status: 200,
    success: true,
    message: 'Password changed successfully',
    data: { accessToken, refreshToken, id: user.id },
  };
};