import axios from 'axios';
import { publishEvent } from '../../config/kafka/kafka.js';
import { logger } from '../../utils/logger.js';

export const fetchInstagramComments = async (
  mediaId: string,
  streamId: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(
      `https://graph.instagram.com/${mediaId}/comments`,
      {
        params: {
          access_token: accessToken,
          fields: 'from,text,timestamp',
        },
      }
    );

    for (const comment of response.data.data || []) {
      await publishEvent('comments', {
        type: 'comment.created',
        payload: {
          streamId,
          userId: comment.from?.id,
          username: comment.from?.username,
          text: comment.text,
          platform: 'instagram',
        },
        timestamp: new Date().toISOString(),
      });
    }

    logger.info(`Instagram comments fetched: ${response.data.data?.length || 0}`);
  } catch (error) {
    logger.error('Instagram fetch error:', error);
  }
};