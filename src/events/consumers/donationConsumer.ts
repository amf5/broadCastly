import { kafka } from '../../config/kafka/kafka.js';
import { roomsManager } from '../../websocket/rooms.js';
import { createDonation } from '../../repositories/donationRepository.js';
import { logger } from '../../utils/logger.js';

const consumer = kafka.consumer({ groupId: 'donation-service-group' });

export const startDonationConsumer = async (): Promise<void> => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'donations', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value!.toString());
        const donation = event.payload;

        await createDonation({
          streamId: donation.streamId,
          userId: donation.userId,
          amount: donation.amount,
          message: donation.message,
          platform: donation.platform,
        });

        roomsManager.broadcastToRoom(donation.streamId, {
          type: 'new-donation',
          data: donation,
          timestamp: new Date().toISOString(),
        });

        logger.info(`Donation broadcasted: $${donation.amount}`);
      } catch (error) {
        logger.error('Error processing donation:', error);
      }
    },
  });

  console.log('✅ Donation Consumer started');
};