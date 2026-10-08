import { Router } from 'express';
import * as streamController from '../controllers/streamController.js';
import { authenticateToken, isStreamer } from '../middleware/auth.js';
import { streamLimiter } from '../middleware/rateLimiter.js';

const StreamRouter = Router();

StreamRouter.post('/start', authenticateToken, isStreamer, streamLimiter, streamController.startStream);
StreamRouter.post('/:streamId/stop', authenticateToken, isStreamer, streamController.stopStream);
StreamRouter.get('/my', authenticateToken, streamController.getMyStreams);
StreamRouter.get('/:streamId', streamController.getStreamById);
StreamRouter.get('/:streamId/stats', streamController.getStreamStats);
StreamRouter.put('/:streamId', authenticateToken, isStreamer, streamController.updateStream);
StreamRouter.delete('/:streamId', authenticateToken, isStreamer, streamController.deleteStream);

export default StreamRouter;