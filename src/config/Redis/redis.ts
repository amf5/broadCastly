import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
import logger from '../../utils/logger.js';

dotenv.config();

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
}

export const redis = new Redis({ url, token });

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.set('health_check', 'ok', { ex: 10 });
    const result = await redis.get('health_check');

    if (result === 'ok') {
      console.log('✅ Upstash Redis connected');
      logger.info('Upstash Redis connected');
    }
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    logger.error('Redis connection error:', error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  console.log('✅ Redis ready');
  logger.info('Redis ready');
};

export default {
  redis,
  connectRedis,
  disconnectRedis,
};