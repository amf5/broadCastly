import { Request, Response } from 'express';
import * as authService from '../services/authService.js';
import logger from '../utils/logger.js';
import { findUserById } from '../repositories/index.js';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(422).json({
        success: false,
        message: 'Please provide username, email, and password',
      });
    }

    const result = await authService.register(username, email, password);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const result = await authService.login(email, password);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activate = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(422).json({
        success: false,
        message: 'Please provide email and OTP',
      });
    }

    const result = await authService.activateAccount(email, otp);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Activate error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resendCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(422).json({
        success: false,
        message: 'Please provide email',
      });
    }

    const result = await authService.resendCode(email);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Resend code error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(422).json({
        success: false,
        message: 'Please provide email',
      });
    }

    const result = await authService.forgotPassword(email);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendTokenOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(422).json({
        success: false,
        message: 'Please provide email and OTP',
      });
    }

    const result = await authService.sendTokenOTP(email, otp);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Send token OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const confirmOldPassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { oldPassword } = req.body;

    if (!oldPassword) {
      return res.status(422).json({
        success: false,
        message: 'Please provide old password',
      });
    }

    const result = await authService.confirmOldPassword(userId!, oldPassword);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Confirm old password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(422).json({
        success: false,
        message: 'Please provide new password',
      });
    }

    const result = await authService.changePassword(userId!, newPassword);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Change password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(422).json({
        success: false,
        message: 'Please provide refresh token',
      });
    }

    const result = await authService.getAccessToken(refreshToken);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const result = await authService.logout(userId!);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Logout error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await findUserById(userId!);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { password_hash, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch (error: any) {
    logger.error('Get me error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};