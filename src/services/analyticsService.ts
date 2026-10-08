import { findByUserId as findStreamsByUser } from '../repositories/streamRepository.js';
import { findByUserId as findCommentsByUser } from '../repositories/commentRepository.js';
import {
  findByUserId as findDonationsByUser,
  getTotalByUser,
} from '../repositories/donationRepository.js';

export const getAnalyticsOverview = async (userId: string) => {
  const streams = await findStreamsByUser(userId);
  const comments = await findCommentsByUser(userId, 10000);
  const donations = await findDonationsByUser(userId);
  const totalDonations = await getTotalByUser(userId);

  const totalViewers = streams.reduce((sum, s) => sum + (s.viewer_count || 0), 0);

  return {
    status: 200,
    success: true,
    data: {
      totalStreams: streams.length,
      totalViewers,
      totalDonations,
      totalComments: comments.length,
      totalDonationCount: donations.length,
      avgViewersPerStream: streams.length > 0 ? Math.round(totalViewers / streams.length) : 0,
    },
  };
};