import axios from 'axios';
import { publishEvent } from '../../config/kafka/kafka.js';
import { logger } from '../../utils/logger.js';

export const fetchFacebookComments = async (
  postId: string,
  streamId: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${postId}/comments`,
      {
        params: {
          access_token: accessToken,
          fields: 'from,message,created_time',
        },
      }
    );

    for (const comment of response.data.data || []) {
      await publishEvent('comments', {
        type: 'comment.created',
        payload: {
          streamId,
          userId: comment.from?.id,
          username: comment.from?.name,
          text: comment.message,
          platform: 'facebook',
        },
        timestamp: new Date().toISOString(),
      });
    }

    logger.info(`Facebook comments fetched: ${response.data.data?.length || 0}`);
  } catch (error) {
    logger.error('Facebook fetch error:', error);
  }
};