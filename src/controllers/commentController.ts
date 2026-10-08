import { Request, Response } from 'express';
import * as commentService from '../services/commentService.js';
import { logger } from '../utils/logger.js';

export const getCommentsByStream = async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await commentService.getCommentsByStream(streamId as string, limit);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Get comments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyComments = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await commentService.getUserComments(userId, limit);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Get my comments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const result = await commentService.deleteUserComment(commentId as string);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};