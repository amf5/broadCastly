import { admin } from './kafka.js';
import { logger } from '../../utils/logger.js';

export const TOPICS = {
  COMMENTS: 'comments',
  DONATIONS: 'donations',
  STREAMS: 'streams',
  NOTIFICATIONS: 'notifications',
  DEAD_LETTER: 'dead-letter',
} as const;

export const createTopics = async (): Promise<void> => {
  try {
    const topics = Object.values(TOPICS);
    
    await admin.createTopics({
      topics: topics.map((topic) => ({
        topic,
        numPartitions: 2,
        replicationFactor: 1,
      })),
    });

    console.log('✅ Topics created:', topics.join(', '));
    logger.info('Topics created successfully');
  } catch (error) {
    if ((error as any).type === 'TOPIC_ALREADY_EXISTS') {
      console.log('ℹ️ Topics already exist');
    } else {
      logger.error('Error creating topics:', error);
      throw error;
    }
  }
};