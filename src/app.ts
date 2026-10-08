

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import {
  healthCheckMySQL,
  getPoolStats,
} from './config/database/mysql.js';

import { healthCheckMongoDB } from './config/database/mongodb.js';

import { logger } from './utils/logger.js';
import AuthRouter from './routes/authRoutes.js';
import { authenticateToken, isAdmin } from './middleware/auth.js';
import UserRouter from './routes/userRoutes.js';
import StreamRouter from './routes/streamRoutes.js';
import CommentRouter from './routes/commentRoutes.js';
import DonationRouter from './routes/donationRoutes.js';
import AnalyticsRouter from './routes/analyticsRoutes.js';
import WebhookRouter from './routes/webhookRoutes.js';
import SocialAuthRouter from './routes/socialAuthRoutes.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use("/BroadCastly",AuthRouter);
app.use('/BroadCastly/user', UserRouter);
app.use('/BroadCastly/streams', StreamRouter);
app.use('/BroadCastly/comments', CommentRouter);
app.use('/BroadCastly/donations', DonationRouter);
app.use('/BroadCastly/analytics', AnalyticsRouter);
app.use('/webhooks', WebhookRouter);
app.use('/BroadCastly/auth', SocialAuthRouter);


app.get('/', (req, res) => {
  res.json({
    message: '🚀 Live Stream Platform API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (req, res) => {
  try {
    const mysqlHealth = await healthCheckMySQL();
    const mongoHealth = await healthCheckMongoDB();
    const poolStats = getPoolStats();

    const health = {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: { mysql: mysqlHealth, mongodb: mongoHealth },
      pool: poolStats,
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV,
    };

    const isHealthy = mysqlHealth.status && mongoHealth.status;
    res.status(isHealthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/pool-stats',authenticateToken,isAdmin, (req, res) => {
  res.json({
    success: true,
    data: getPoolStats(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/test/db', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { query } = await import('./config/database/mysql.js');
    const result = await query(
      'SELECT 1 as test, NOW() as time, DATABASE() as db_name, VERSION() as version'
    );
    res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: (error as Error).message,
    });
  }
});


app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export { app };
export default app;