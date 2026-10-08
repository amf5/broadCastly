// @ts-ignore
import NodeMediaServer from 'node-media-server';
import { findByStreamKey } from '../repositories/streamRepository.js';
import { logger } from '../utils/logger.js';

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8000,
    allow_origin: '*',
    mediaroot: './media',
  },
};

const nms = new NodeMediaServer(config);

nms.on('prePublish', async (id: string, StreamPath: string) => {
  try {
    const streamKey = StreamPath.split('/').pop();

    if (!streamKey) {
      console.log(`❌ No stream key provided`);
      return;
    }

    const stream = await findByStreamKey(streamKey);

    if (!stream) {
      console.log(`❌ Invalid stream key: ${streamKey}`);
      const session = (nms as any).getSession(id);
      if (session) session.reject();
      return;
    }

    console.log(`✅ Stream starting: ${StreamPath} for user: ${stream.user_id}`);
    logger.info(`Stream starting: ${StreamPath} for user: ${stream.user_id}`);
  } catch (error) {
    console.error('❌ Error in prePublish:', error);
    logger.error('Error in prePublish:', error);
  }
});

nms.on('donePublish', (id: string, StreamPath: string) => {
  console.log(`📺 Stream ended: ${StreamPath}`);
  logger.info(`Stream ended: ${StreamPath}`);
});

nms.on('prePlay', (id: string, StreamPath: string) => {
  console.log(`👀 Viewer watching: ${StreamPath}`);
});

export const startRTMPServer = (): void => {
  nms.run();
  console.log('✅ RTMP Server running on port 1935');
  console.log('✅ HTTP Server running on port 8000');
  logger.info('RTMP Server running on port 1935');
};

export default nms;