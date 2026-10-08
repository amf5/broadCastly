import { Request, Response } from 'express';
import * as userService from '../services/userService.js';
import { logger } from '../utils/logger.js';

// Get profile
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await userService.getUserProfile(userId);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Get me error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update profile
export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { username, avatar } = req.body;

    const result = await userService.updateUserProfile(userId, {
      username,
     
      avatar,
    });

    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Update me error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get social keys
export const getSocialKeys = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await userService.getUserSocialKeys(userId);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Get social keys error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update social keys
export const updateSocialKeys = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { social_media_keys } = req.body;

    const result = await userService.updateUserSocialKeys(userId, social_media_keys);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Update social keys error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete account
export const deleteMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await userService.deleteUserAccount(userId);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Delete me error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};