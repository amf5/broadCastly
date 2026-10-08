import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const AnalyticsRouter = Router();

AnalyticsRouter.get('/overview', authenticateToken, analyticsController.getOverview);

export default AnalyticsRouter;