import { Request, Response } from 'express';
import * as analyticsService from '../services/analyticsService.js';
import { logger } from '../utils/logger.js';

export const getOverview = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await analyticsService.getAnalyticsOverview(userId);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Get overview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};