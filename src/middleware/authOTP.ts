import { Request, Response, NextFunction } from 'express';
import { verifyOTPToken } from '../utils/token.js';
import { findUserById } from '../repositories/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export const authenticateTokenOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = verifyOTPToken(token);

    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role || 'user',
    };

    next();
  } catch (error: any) {
    if (error.message?.includes('expired')) {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please try again.',
      });
    }

    return res.status(403).json({
      success: false,
      message: error.message || 'Invalid or expired token',
    });
  }
};