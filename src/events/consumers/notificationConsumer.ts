import { kafka } from '../../config/kafka/kafka.js';
import { roomsManager } from '../../websocket/rooms.js';
import { logger } from '../../utils/logger.js';

const consumer = kafka.consumer({ groupId: 'notification-service-group' });

export const startNotificationConsumer = async (): Promise<void> => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'notifications', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value!.toString());
        const notification = event.payload;

        if (notification.userId) {
          const client = roomsManager.getClientByUserId(notification.userId);
          if (client) {
            client.ws.send(JSON.stringify({
              type: 'notification',
              data: notification,
              timestamp: new Date().toISOString(),
            }));
          }
        }

        logger.info(`Notification sent to user: ${notification.userId}`);
      } catch (error) {
        logger.error('Error processing notification:', error);
      }
    },
  });

  console.log('✅ Notification Consumer started');
};