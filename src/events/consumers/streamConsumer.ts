import { kafka } from '../../config/kafka/kafka.js';
import {
  findByStreamKey,
  startStream,
  endStream,
} from '../../repositories/streamRepository.js';
import { logger } from '../../utils/logger.js';

const consumer = kafka.consumer({ groupId: 'stream-service-group' });

export const startStreamConsumer = async (): Promise<void> => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'streams', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value!.toString());
        const { type, payload } = event;

        if (type === 'stream.started') {
          const stream = await findByStreamKey(payload.streamKey);
          if (stream) {
            await startStream(stream.id);
          }
        }

        if (type === 'stream.stopped') {
          const stream = await findByStreamKey(payload.streamKey);
          if (stream) {
            await endStream(stream.id);
          }
        }

        logger.info(`Stream event processed: ${type}`);
      } catch (error) {
        logger.error('Error processing stream event:', error);
      }
    },
  });

  console.log('✅ Stream Consumer started');
};