import { kafka } from '../../config/kafka/kafka.js';
import { roomsManager } from '../../websocket/rooms.js';
import { createComment } from '../../repositories/commentRepository.js';
import { logger } from '../../utils/logger.js';

const consumer = kafka.consumer({ groupId: 'comment-service-group' });

export const startCommentConsumer = async (): Promise<void> => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'comments', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value!.toString());
        const comment = event.payload;

        await createComment({
          streamId: comment.streamId,
          userId: comment.userId,
          username: comment.username,
          text: comment.text,
          platform: comment.platform,
        });

        roomsManager.broadcastToRoom(comment.streamId, {
          type: 'new-comment',
          data: comment,
          timestamp: new Date().toISOString(),
        });

        logger.info(`Comment broadcasted: ${comment.text}`);
      } catch (error) {
        logger.error('Error processing comment:', error);
      }
    },
  });

  console.log('✅ Comment Consumer started');
};