import {
  findByStreamId,
  findByUserId,
  deleteComment,
  countByStreamId,
  countByUserId,
} from '../repositories/commentRepository.js';
import { logger } from '../utils/logger.js';

export const getCommentsByStream = async (streamId: string, limit: number = 50) => {
  const comments = await findByStreamId(streamId, limit);
  const count = await countByStreamId(streamId);

  return { status: 200, success: true, data: { comments, total: count } };
};

export const getUserComments = async (userId: string, limit: number = 50) => {
  const comments = await findByUserId(userId, limit);
  const count = await countByUserId(userId);

  return { status: 200, success: true, data: { comments, total: count } };
};

export const deleteUserComment = async (commentId: string) => {
  const deleted = await deleteComment(commentId);

  if (!deleted) {
    return { status: 404, success: false, message: 'Comment not found' };
  }

  logger.info(`Comment deleted: ${commentId}`);

  return { status: 200, success: true, message: 'Comment deleted' };
};