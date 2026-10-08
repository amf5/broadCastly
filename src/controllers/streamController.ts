import { Request, Response } from 'express';
import * as streamService from '../services/streamService.js';
import { publishEvent } from '../config/kafka/kafka.js';
import { logger } from '../utils/logger.js';

// ============================================================
// Start Stream (supports 3 modes: RTMP, Video Loop, Camera)
// ============================================================
export const startStream = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      platforms,
      streamKey,
      videoUrl,
      loopDuration,
      useCamera,
    } = req.body;

    const result = await streamService.startUserStream(userId, {
      title,
      platforms,
      streamKey,
      videoUrl,
      loopDuration,
      useCamera,
    });

    // Publish event to Kafka
    if (result.success) {
      await publishEvent('streams', {
        type: 'stream.started',
        payload: result.data,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Start stream error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Stop Stream
// ============================================================
export const stopStream = async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const result = await streamService.stopUserStream(streamId as string);

    if (result.success) {
      await publishEvent('streams', {
        type: 'stream.stopped',
        payload: { streamId },
        timestamp: new Date().toISOString(),
      });
    }

    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Stop stream error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Get My Streams
// ============================================================
export const getMyStreams = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await streamService.getUserStreams(userId);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Get my streams error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Get Stream by ID
// ============================================================
export const getStreamById = async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const result = await streamService.getStreamDetails(streamId as string);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Get stream error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Get Stream Stats
// ============================================================
export const getStreamStats = async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const result = await streamService.getStreamStats(streamId as string) ;
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Get stream stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Update Stream
// ============================================================
export const updateStream = async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const result = await streamService.updateStreamDetails(streamId as string, req.body);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Update stream error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Delete Stream
// ============================================================
export const deleteStream = async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const result = await streamService.deleteUserStream(streamId as string);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Delete stream error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};