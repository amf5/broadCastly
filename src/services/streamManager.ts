import ffmpeg from 'fluent-ffmpeg';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';

interface StreamConfig {
  streamId: string;
  userId: string;
  streamKey?: string;
  platforms: {
    youtube?: string;
    facebook?: string;
    instagram?: string;
  };
  title: string;
  videoUrl?: string;
  loopDuration?: number;
}

interface StreamInfo {
  streamId: string;
  userId: string;
  title: string;
  status: 'starting' | 'live' | 'stopping' | 'ended' | 'error';
  startedAt: Date;
  platforms: string[];
}

class StreamManager extends EventEmitter {
  private activeStreams: Map<string, ffmpeg.FfmpegCommand> = new Map();
  private streamInfo: Map<string, StreamInfo> = new Map();
  private loopTimers: Map<string, NodeJS.Timeout> = new Map();

  // ============================================================
  // Build platform URLs
  // ============================================================
  private getPlatformUrls(platforms: any) {
    return {
      youtube: platforms.youtube
        ? `rtmp://a.rtmp.youtube.com/live2/${platforms.youtube}`
        : null,
      facebook: platforms.facebook
        ? `rtmps://live-api-s.facebook.com:443/rtmp/${platforms.facebook}`
        : null,
      instagram: platforms.instagram
        ? `rtmp://live-upload.instagram.com:443/rtmp/${platforms.instagram}`
        : null,
    };
  }

  // ============================================================
  // 1. RTMP from OBS (default)
  // ============================================================
  async startSimulcast(config: StreamConfig): Promise<StreamInfo> {
    const { streamId, streamKey, platforms, userId, title } = config;

    const urls = this.getPlatformUrls(platforms);
    const outputs: string[] = [];
    const activePlatforms: string[] = [];

    for (const [p, url] of Object.entries(urls)) {
      if (url) {
        outputs.push(url);
        activePlatforms.push(p);
      }
    }

    if (outputs.length === 0) throw new Error('No platforms configured');

    const info: StreamInfo = {
      streamId,
      userId,
      title,
      status: 'starting',
      startedAt: new Date(),
      platforms: activePlatforms,
    };
    this.streamInfo.set(streamId, info);

    const command = ffmpeg()
      .input(`rtmp://localhost:1935/live/${streamKey}`)
      .inputOptions(['-re', '-thread_queue_size 512'])
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset veryfast',
        '-tune zerolatency',
        '-maxrate 3000k',
        '-bufsize 6000k',
        '-pix_fmt yuv420p',
        '-g 60',
        '-f flv',
      ]);

    outputs.forEach((o) => command.output(o));

    command
      .on('start', () => {
        logger.info(`Stream ${streamId} started`);
        info.status = 'live';
      })
      .on('error', (err) => {
        logger.error(`Stream ${streamId} error:`, err);
        info.status = 'error';
        this.activeStreams.delete(streamId);
      })
      .on('end', () => {
        logger.info(`Stream ${streamId} ended`);
        info.status = 'ended';
        this.activeStreams.delete(streamId);
      });

    command.run();
    this.activeStreams.set(streamId, command);
    return info;
  }

  // ============================================================
  // 2. Video Loop (recorded video repeated)
  // ============================================================
  async startVideoLoop(config: StreamConfig): Promise<StreamInfo> {
    const { streamId, videoUrl, loopDuration, platforms, userId, title } = config;

    if (!videoUrl) throw new Error('Video URL is required');

    const urls = this.getPlatformUrls(platforms);
    const outputs: string[] = [];
    const activePlatforms: string[] = [];

    for (const [p, url] of Object.entries(urls)) {
      if (url) {
        outputs.push(url);
        activePlatforms.push(p);
      }
    }

    if (outputs.length === 0) throw new Error('No platforms configured');

    const info: StreamInfo = {
      streamId,
      userId,
      title,
      status: 'starting',
      startedAt: new Date(),
      platforms: activePlatforms,
    };
    this.streamInfo.set(streamId, info);

    // ✅ -stream_loop -1 for infinite loop
    const command = ffmpeg()
      .input(videoUrl)
      .inputOptions(['-re', '-stream_loop -1', '-fflags', '+genpts'])
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset veryfast',
        '-tune zerolatency',
        '-maxrate 3000k',
        '-bufsize 6000k',
        '-pix_fmt yuv420p',
        '-g 60',
        '-f flv',
      ]);

    outputs.forEach((o) => command.output(o));

    command
      .on('start', () => {
        logger.info(`Video loop ${streamId} started`);
        info.status = 'live';
      })
      .on('error', (err) => {
        logger.error(`Video loop ${streamId} error:`, err);
        info.status = 'error';
        this.activeStreams.delete(streamId);
      })
      .on('end', () => {
        logger.info(`Video loop ${streamId} ended`);
        info.status = 'ended';
        this.activeStreams.delete(streamId);
      });

    command.run();
    this.activeStreams.set(streamId, command);

    // ✅ Auto-stop after loopDuration minutes
    if (loopDuration && loopDuration > 0) {
      const timer = setTimeout(() => {
        this.stopStream(streamId);
        logger.info(`Video loop ${streamId} auto-stopped after ${loopDuration} min`);
      }, loopDuration * 60 * 1000);

      this.loopTimers.set(streamId, timer);
    }

    return info;
  }

  // ============================================================
  // 3. Camera Stream
  // ============================================================
  async startCameraStream(config: StreamConfig): Promise<StreamInfo> {
    const { streamId, platforms, userId, title } = config;

    const urls = this.getPlatformUrls(platforms);
    const activePlatforms: string[] = [];

    for (const [p, url] of Object.entries(urls)) {
      if (url) activePlatforms.push(p);
    }

    if (activePlatforms.length === 0) throw new Error('No platforms configured');

    const info: StreamInfo = {
      streamId,
      userId,
      title,
      status: 'live',
      startedAt: new Date(),
      platforms: activePlatforms,
    };
    this.streamInfo.set(streamId, info);

    // ⚠️ Camera mode: Actual streaming happens on frontend via WebRTC
    // Backend just stores session info
    logger.info(`Camera stream ${streamId} initialized`);

    return info;
  }

  // ============================================================
  // Stop Stream
  // ============================================================
  stopStream(streamId: string): void {
    const command = this.activeStreams.get(streamId);
    if (command) {
      command.kill('SIGTERM');
      this.activeStreams.delete(streamId);
    }

    // Clear auto-stop timer
    const timer = this.loopTimers.get(streamId);
    if (timer) {
      clearTimeout(timer);
      this.loopTimers.delete(streamId);
    }

    this.streamInfo.delete(streamId);
  }

  getStreamInfo(streamId: string): StreamInfo | null {
    return this.streamInfo.get(streamId) || null;
  }

  getAllActiveStreams(): string[] {
    return Array.from(this.activeStreams.keys());
  }
}

export const streamManager = new StreamManager();