import { Comment, IComment } from '../models/Comment.js';

export const createComment = async (data: {
  streamId: string;
  userId: string;
  username: string;
  text: string;
  platform: 'youtube' | 'facebook' | 'instagram' | 'websocket';
  isDonation?: boolean;
  amount?: number;
}): Promise<IComment> => {
  const comment = new Comment({
    streamId: data.streamId,
    userId: data.userId,
    username: data.username,
    text: data.text,
    platform: data.platform,
    isDonation: data.isDonation || false,
    amount: data.amount || 0,
    timestamp: new Date(),
  });

  return comment.save();
};

export const findById = async (id: string): Promise<IComment | null> => {
  return Comment.findOne({ id });
};

export const findByStreamId = async (
  streamId: string,
  limit: number = 50
): Promise<IComment[]> => {
  return Comment.find({ streamId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

export const findByUserId = async (
  userId: string,
  limit: number = 50
): Promise<IComment[]> => {
  return Comment.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

export const findByPlatform = async (
  platform: 'youtube' | 'facebook' | 'instagram' | 'websocket',
  limit: number = 50
): Promise<IComment[]> => {
  return Comment.find({ platform })
    .sort({ timestamp: -1 })
    .limit(limit);
};

export const countByStreamId = async (streamId: string): Promise<number> => {
  return Comment.countDocuments({ streamId });
};

export const countByUserId = async (userId: string): Promise<number> => {
  return Comment.countDocuments({ userId });
};

export const deleteComment = async (id: string): Promise<boolean> => {
  const result = await Comment.deleteOne({ id });
  return result.deletedCount > 0;
};

export const deleteByStreamId = async (streamId: string): Promise<void> => {
  await Comment.deleteMany({ streamId });
};

export const deleteByUserId = async (userId: string): Promise<void> => {
  await Comment.deleteMany({ userId });
};