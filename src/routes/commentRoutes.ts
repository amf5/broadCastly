import { Router } from 'express';
import * as commentController from '../controllers/commentController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { commentLimiter } from '../middleware/rateLimiter.js';

const CommentRouter = Router();

CommentRouter.get('/stream/:streamId', commentLimiter, commentController.getCommentsByStream);
CommentRouter.get('/my', authenticateToken, commentController.getMyComments);
CommentRouter.delete('/:commentId', authenticateToken, isAdmin, commentController.deleteComment);

export default CommentRouter;