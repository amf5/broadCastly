import {
  createDonation,
  findByStreamId,
  findByUserId,
  getTotalByStream,
  getTotalByUser,
  countByStream,
} from '../repositories/donationRepository.js';
import { logger } from '../utils/logger.js';

export const createUserDonation = async (
  userId: string,
  data: { streamId: string; amount: number; message?: string; platform?: string }
) => {
  const { streamId, amount, message, platform } = data;

  if (!streamId || !amount) {
    return { status: 422, success: false, message: 'StreamId and amount required' };
  }

  const donation = await createDonation({
    streamId,
    userId,
    amount,
    message,
    platform,
  });

  logger.info(`Donation created: $${amount} by ${userId}`);

  return { status: 201, success: true, data: donation };
};

export const getDonationsByStream = async (streamId: string) => {
  const donations = await findByStreamId(streamId);
  return { status: 200, success: true, data: donations };
};

export const getUserDonations = async (userId: string) => {
  const donations = await findByUserId(userId);
  const total = await getTotalByUser(userId);

  return { status: 200, success: true, data: { donations, total } };
};

export const getStreamDonationTotal = async (streamId: string) => {
  const total = await getTotalByStream(streamId);
  const count = await countByStream(streamId);

  return { status: 200, success: true, data: { total, count } };
};