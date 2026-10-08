import {
  createStream,
  findByUserId,
  findById,
  startStream,
  endStream,
  deleteStream,
  updateStream,
} from '../repositories/streamRepository.js';
import { findByIdWithKeys } from '../repositories/userRepository.js';
import { findByStreamId as findCommentsByStream } from '../repositories/commentRepository.js';
import {
  findByStreamId as findDonationsByStream,
  getTotalByStream,
} from '../repositories/donationRepository.js';
import { streamManager } from './streamManager.js';
import {
  startSocialListeners,
  stopSocialListeners,
} from './social/socialManager.js';
import { logger } from '../utils/logger.js';

// ============================================================
// Start Stream (3 modes: RTMP, Video Loop, Camera)
// ============================================================
export const startUserStream = async (
  userId: string,
  data: {
    title: string;
    description?: string;
    platforms?: string[];
    streamKey: string;
    videoUrl?: string;
    loopDuration?: number;
    useCamera?: boolean;
  }
) => {
  const {
    title,
    description,
    platforms,
    streamKey,
    videoUrl,
    loopDuration,
    useCamera,
  } = data;

  if (!title) {
    return {
      status: 422,
      success: false,
      message: 'Title is required',
    };
  }

  // 1. Get user keys
  const user = await findByIdWithKeys(userId);
  if (!user) {
    return { status: 404, success: false, message: 'User not found' };
  }

  const userKeys = user.social_media_keys || {};

  // 2. Prepare platforms
  const streamPlatforms: any = {};

  if (platforms?.includes('youtube') && userKeys.youtube?.streamKey)
    streamPlatforms.youtube = userKeys.youtube.streamKey;
  if (platforms?.includes('facebook') && userKeys.facebook?.streamKey)
    streamPlatforms.facebook = userKeys.facebook.streamKey;
  if (platforms?.includes('instagram') && userKeys.instagram?.streamKey)
    streamPlatforms.instagram = userKeys.instagram.streamKey;

  if (Object.keys(streamPlatforms).length === 0) {
    return {
      status: 422,
      success: false,
      message: 'No platforms configured. Please add your stream keys first.',
    };
  }

  // 3. Create stream record
  const stream = await createStream({
    userId,
    title,
    description,
    platforms: streamPlatforms,
    streamKey: streamKey || `camera_${Date.now()}`,
  });

  if (!stream) {
    return {
      status: 500,
      success: false,
      message: 'Failed to create stream',
    };
  }

  // 4. Update status
  await startStream(stream.id);

  // 5. Start based on mode
  let streamInfo;

  if (useCamera) {
    streamInfo = await streamManager.startCameraStream({
      streamId: stream.id,
      userId,
      platforms: streamPlatforms,
      title,
    });
  } else if (videoUrl) {
    streamInfo = await streamManager.startVideoLoop({
      streamId: stream.id,
      userId,
      videoUrl,
      loopDuration: loopDuration || 60,
      platforms: streamPlatforms,
      title,
    });
  } else {
    if (!streamKey) {
      return {
        status: 422,
        success: false,
        message: 'Stream Key is required',
      };
    }

    streamInfo = await streamManager.startSimulcast({
      streamId: stream.id,
      userId,
      streamKey,
      platforms: streamPlatforms,
      title,
    });
  }

  // 6. Start social listeners
  await startSocialListeners(stream.id, userKeys);

  logger.info(`Stream started by user: ${userId}`);

  return {
    status: 201,
    success: true,
    message: 'Stream started',
    data: { stream, streamInfo },
  };
};

// ============================================================
// Stop Stream
// ============================================================
export const stopUserStream = async (streamId: string) => {
  streamManager.stopStream(streamId);
  stopSocialListeners(streamId);
  await endStream(streamId);

  logger.info(`Stream stopped: ${streamId}`);

  return { status: 200, success: true, message: 'Stream stopped' };
};

// ============================================================
// Get User Streams
// ============================================================
export const getUserStreams = async (userId: string) => {
  const streams = await findByUserId(userId);
  return { status: 200, success: true, data: streams };
};

// ============================================================
// Get Stream Details
// ============================================================
export const getStreamDetails = async (streamId: string) => {
  const stream = await findById(streamId);
  if (!stream) {
    return { status: 404, success: false, message: 'Stream not found' };
  }
  return { status: 200, success: true, data: stream };
};

// ============================================================
// Get Stream Stats
// ============================================================
export const getStreamStats = async (streamId: string) => {
  const comments = await findCommentsByStream(streamId, 1000);
  const donations = await findDonationsByStream(streamId);
  const totalDonations = await getTotalByStream(streamId);

  return {
    status: 200,
    success: true,
    data: {
      commentsCount: comments.length,
      donationsCount: donations.length,
      totalDonations,
    },
  };
};

// ============================================================
// Update Stream
// ============================================================
export const updateStreamDetails = async (
  streamId: string,
  data: { title?: string; description?: string }
) => {
  const stream = await updateStream(streamId, data);
  if (!stream) {
    return { status: 404, success: false, message: 'Stream not found' };
  }
  return { status: 200, success: true, message: 'Stream updated', data: stream };
};

// ============================================================
// Delete Stream
// ============================================================
export const deleteUserStream = async (streamId: string) => {
  const deleted = await deleteStream(streamId);
  if (!deleted) {
    return { status: 404, success: false, message: 'Stream not found' };
  }
  return { status: 200, success: true, message: 'Stream deleted' };
};