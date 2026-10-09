import { Request, Response } from 'express';
import axios from 'axios';
import { findById, updateUser } from '../repositories/userRepository.js';
import { logger } from '../utils/logger.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================================
// YOUTUBE
// ============================================================
export const getYouTubeAuthUrl = (req: Request, res: Response) => {
  const userId = req.user!.id;
  logger.info(`YouTube auth URL for user: ${userId}`);

  const params = new URLSearchParams({
    client_id: process.env.YOUTUBE_CLIENT_ID!,
    redirect_uri: process.env.YOUTUBE_REDIRECT_URI!,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state: userId,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return res.json({ success: true, url: authUrl });
};

export const handleYouTubeCallback = async (req: Request, res: Response) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.redirect(
        `${FRONTEND_URL}/social-accounts?error=missing_params`
      );
    }

    // 1. Exchange code for tokens
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      redirect_uri: process.env.YOUTUBE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token } = tokenRes.data;

    // 2. Get channel info
    const channelRes = await axios.get(
      'https://www.googleapis.com/youtube/v3/channels',
      {
        params: { part: 'id,snippet', mine: true },
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const channelId = channelRes.data.items?.[0]?.id;

    // 3. Save to DB
    const user = await findById(userId as string);
    if (!user) {
      return res.redirect(
        `${FRONTEND_URL}/social-accounts?error=user_not_found`
      );
    }

    const existingKeys = user.social_media_keys
      ? JSON.parse(user.social_media_keys as any)
      : {};

    existingKeys.youtube = {
      ...existingKeys.youtube,
      accessToken: access_token,
      refreshToken: refresh_token,
      channelId,
    };

    await updateUser(userId as string, { social_media_keys: existingKeys });

    logger.info(`YouTube connected: ${userId}`);

    res.redirect(
      `${FRONTEND_URL}/social-accounts?success=true&platform=youtube`
    );
  } catch (error: any) {
    logger.error('YouTube OAuth error:', error);
    res.redirect(`${FRONTEND_URL}/social-accounts?error=youtube_failed`);
  }
};

// ============================================================
// FACEBOOK
// ============================================================
export const getFacebookAuthUrl = (req: Request, res: Response) => {
  const userId = req.user!.id;
  logger.info(`Facebook auth URL for user: ${userId}`);

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: process.env.FACEBOOK_REDIRECT_URI!,
    state: userId,
    scope: 'pages_read_engagement',
    response_type: 'code',
  });

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;

  return res.json({ success: true, url: authUrl });
};

export const handleFacebookCallback = async (req: Request, res: Response) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.redirect(
        `${FRONTEND_URL}/social-accounts?error=missing_params`
      );
    }

    // 1. Exchange code for user access token
    const tokenRes = await axios.get(
      'https://graph.facebook.com/v18.0/oauth/access_token',
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
          code,
        },
      }
    );

    const userAccessToken = tokenRes.data.access_token;

    // 2. Get user's pages
    const pagesRes = await axios.get(
      'https://graph.facebook.com/v18.0/me/accounts',
      {
        params: { access_token: userAccessToken },
      }
    );

    const page = pagesRes.data.data?.[0];
    if (!page) {
      return res.redirect(`${FRONTEND_URL}/social-accounts?error=no_pages`);
    }

    const pageAccessToken = page.access_token;

    // 3. Save to DB
    const user = await findById(userId as string);
    if (!user) {
      return res.redirect(
        `${FRONTEND_URL}/social-accounts?error=user_not_found`
      );
    }

    const existingKeys = user.social_media_keys
      ? JSON.parse(user.social_media_keys as any)
      : {};

    existingKeys.facebook = {
      ...existingKeys.facebook,
      accessToken: pageAccessToken,
      pageId: page.id,
      pageName: page.name,
    };

    await updateUser(userId as string, { social_media_keys: existingKeys });

    logger.info(`Facebook connected: ${userId}`);

    res.redirect(
      `${FRONTEND_URL}/social-accounts?success=true&platform=facebook`
    );
  } catch (error: any) {
    logger.error('Facebook OAuth error:', error);
    res.redirect(`${FRONTEND_URL}/social-accounts?error=facebook_failed`);
  }
};

// ============================================================
// INSTAGRAM
// ============================================================
export const getInstagramAuthUrl = (req: Request, res: Response) => {
  const userId = req.user!.id;
  logger.info(`Instagram auth URL for user: ${userId}`);

  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
    state: userId,
    scope: [
      'instagram_business_basic',
      'instagram_business_manage_comments',
      'instagram_business_manage_messages',
    ].join(','),
    response_type: 'code',
  });

  const authUrl = `https://api.instagram.com/oauth/authorize?${params.toString()}`;

  return res.json({ success: true, url: authUrl });
};

export const handleInstagramCallback = async (
  req: Request,
  res: Response
) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.redirect(
        `${FRONTEND_URL}/social-accounts?error=missing_params`
      );
    }

    // 1. Exchange code for access token
    const tokenRes = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID!,
        client_secret: process.env.INSTAGRAM_APP_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
        code: code as string,
      })
    );

    const accessToken = tokenRes.data.access_token;
    const igUserId = tokenRes.data.user_id;

    // 2. Save to DB
    const user = await findById(userId as string);
    if (!user) {
      return res.redirect(
        `${FRONTEND_URL}/social-accounts?error=user_not_found`
      );
    }

    const existingKeys = user.social_media_keys
      ? JSON.parse(user.social_media_keys as any)
      : {};

    existingKeys.instagram = {
      ...existingKeys.instagram,
      accessToken,
      igUserId,
    };

    await updateUser(userId as string, { social_media_keys: existingKeys });

    logger.info(`Instagram connected: ${userId}`);

    res.redirect(
      `${FRONTEND_URL}/social-accounts?success=true&platform=instagram`
    );
  } catch (error: any) {
    logger.error('Instagram OAuth error:', error);
    res.redirect(`${FRONTEND_URL}/social-accounts?error=instagram_failed`);
  }
};
