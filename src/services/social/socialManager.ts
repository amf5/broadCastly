import { fetchYouTubeComments } from './youtubeService.js';
import { fetchFacebookComments } from './facebookService.js';
import { fetchInstagramComments } from './instagramService.js';
import { logger } from '../../utils/logger.js';

const activeIntervals: Map<string, NodeJS.Timeout[]> = new Map();

export const startSocialListeners = async (
  streamId: string,
  userKeys: any
) => {
  try {
    const intervals: NodeJS.Timeout[] = [];

    // YouTube
    if (userKeys.youtube?.videoId) {
      const intervalId = setInterval(() => {
        fetchYouTubeComments(
          userKeys.youtube.videoId,
          streamId,
          userKeys.youtube.accessToken
        );
      }, 10000);
      intervals.push(intervalId);
      logger.info(`YouTube listener started: ${streamId}`);
    }

    // Facebook
    if (userKeys.facebook?.postId) {
      const intervalId = setInterval(() => {
        fetchFacebookComments(
          userKeys.facebook.postId,
          streamId,
          userKeys.facebook.accessToken
        );
      }, 10000);
      intervals.push(intervalId);
      logger.info(`Facebook listener started: ${streamId}`);
    }

    // Instagram
    if (userKeys.instagram?.mediaId) {
      const intervalId = setInterval(() => {
        fetchInstagramComments(
          userKeys.instagram.mediaId,
          streamId,
          userKeys.instagram.accessToken
        );
      }, 10000);
      intervals.push(intervalId);
      logger.info(`Instagram listener started: ${streamId}`);
    }

    activeIntervals.set(streamId, intervals);
  } catch (error) {
    logger.error('Social listeners error:', error);
  }
};

export const stopSocialListeners = (streamId: string) => {
  const intervals = activeIntervals.get(streamId);

  if (intervals) {
    intervals.forEach((id) => clearInterval(id));
    activeIntervals.delete(streamId);
    logger.info(`Social listeners stopped: ${streamId}`);
  }
};