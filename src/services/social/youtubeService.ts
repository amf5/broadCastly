import axios from 'axios';
import { publishEvent } from '../../config/kafka/kafka.js';
import { logger } from '../../utils/logger.js';

export const fetchYouTubeComments = async (
  videoId: string,
  streamId: string,
  accessToken?: string
) => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/commentThreads`,
      {
        params: {
          part: 'snippet',
          videoId,
          key: process.env.YOUTUBE_API_KEY,
          maxResults: 100,
        },
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
      }
    );

    for (const item of response.data.items || []) {
      const comment = item.snippet.topLevelComment.snippet;

      await publishEvent('comments', {
        type: 'comment.created',
        payload: {
          streamId,
          userId: comment.authorChannelId?.value,
          username: comment.authorDisplayName,
          text: comment.textDisplay,
          platform: 'youtube',
        },
        timestamp: new Date().toISOString(),
      });
    }

    logger.info(`YouTube comments fetched: ${response.data.items?.length || 0}`);
  } catch (error) {
    logger.error('YouTube fetch error:', error);
  }
};