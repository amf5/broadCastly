import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authenticateTokenOTP } from '../middleware/authOTP.js';
import { validate } from '../middleware/validate.js';
import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  otpLimiter,
} from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  activateSchema,
  resendCodeSchema,
  forgotPasswordSchema,
  sendTokenOTPSchema,
  confirmOldPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
} from '../validators/authValidator.js';

const AuthRouter = Router();


AuthRouter.post(
  '/register',
  registerLimiter,
  validate(registerSchema),
  authController.register
);

AuthRouter.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  authController.login
);

AuthRouter.post(
  '/activate',
  otpLimiter,
  validate(activateSchema),
  authController.activate
);

AuthRouter.post(
  '/resend-code',
  otpLimiter,
  validate(resendCodeSchema),
  authController.resendCode
);

AuthRouter.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

AuthRouter.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  authController.refreshToken
);

AuthRouter.get('/me', authenticateToken, authController.getMe);

AuthRouter.post('/logout', authenticateToken, authController.logout);

AuthRouter.post(
  '/confirm-old-password',
  authenticateToken,
  validate(confirmOldPasswordSchema),
  authController.confirmOldPassword
);


AuthRouter.post(
  '/send-token-otp',
 
  validate(sendTokenOTPSchema),
  authController.sendTokenOTP
);

AuthRouter.post(
  '/change-password',
  authenticateTokenOTP,
  validate(changePasswordSchema),
  authController.changePassword
);

export default AuthRouter;