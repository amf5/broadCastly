import { Router } from 'express';
import * as socialAuthController from '../controllers/socialAuthController.js';
import { authenticateToken } from '../middleware/auth.js';

const SocialAuthRouter = Router();

// ✅ YouTube
SocialAuthRouter.get(
  '/youtube',
  authenticateToken,
  socialAuthController.getYouTubeAuthUrl
);
SocialAuthRouter.get(
  '/youtube/callback',
  socialAuthController.handleYouTubeCallback
);

// ✅ Facebook
SocialAuthRouter.get(
  '/facebook',
  authenticateToken,
  socialAuthController.getFacebookAuthUrl
);
SocialAuthRouter.get(
  '/facebook/callback',
  socialAuthController.handleFacebookCallback
);

// ✅ Instagram
SocialAuthRouter.get(
  '/instagram',
  authenticateToken,
  socialAuthController.getInstagramAuthUrl
);
SocialAuthRouter.get(
  '/instagram/callback',
  socialAuthController.handleInstagramCallback
);

export default SocialAuthRouter;
