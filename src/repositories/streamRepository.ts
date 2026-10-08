import { IStream } from '../models/Stream.js';
import { db, query } from '../config/database/mysql.js';
import { v4 as uuidv4 } from 'uuid';

export const createStream = async (data: {
  userId: string;
  title: string;
  description?: string;
  platforms?: any;
  streamKey?: string;
}): Promise<IStream | null> => {
  const id = uuidv4();
  const stream_key = data.streamKey || `${uuidv4()}-${Date.now()}`;

  await db.create('streams', {
    id,
    user_id: data.userId,
    title: data.title,
    description: data.description || null,
    stream_key,
    platforms: JSON.stringify(data.platforms || {}),
  });

  return findById(id);
};

export const findById = async (id: string): Promise<IStream | null> => {
  return db.findOne<IStream>('streams', { id });
};

export const findByStreamKey = async (streamKey: string): Promise<IStream | null> => {
  return db.findOne<IStream>('streams', { stream_key: streamKey });
};

export const findByUserId = async (userId: string): Promise<IStream[]> => {
  return query<IStream[]>(
    `SELECT * FROM streams WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
};

export const findByStatus = async (status: string): Promise<IStream[]> => {
  return query<IStream[]>(
    `SELECT * FROM streams WHERE status = ? ORDER BY created_at DESC`,
    [status]
  );
};

export const updateStream = async (
  id: string,
  data: { title?: string; description?: string; platforms?: any; status?: string }
): Promise<IStream | null> => {
  const updateData: any = {};

  if (data.title) updateData.title = data.title;
  if (data.description) updateData.description = data.description;
  if (data.status) updateData.status = data.status;

  if (data.platforms) {
    updateData.platforms = JSON.stringify(data.platforms);
  }

  if (Object.keys(updateData).length === 0) {
    return findById(id);
  }

  await db.update('streams', id, updateData);
  return findById(id);
};

export const startStream = async (id: string): Promise<void> => {
  await query(
    `UPDATE streams SET status = 'live', started_at = NOW() WHERE id = ?`,
    [id]
  );
};

export const endStream = async (id: string): Promise<void> => {
  await query(
    `UPDATE streams SET status = 'ended', ended_at = NOW() WHERE id = ?`,
    [id]
  );
};

export const incrementViewerCount = async (id: string): Promise<void> => {
  await query(`UPDATE streams SET viewer_count = viewer_count + 1 WHERE id = ?`, [id]);
};

export const decrementViewerCount = async (id: string): Promise<void> => {
  await query(`UPDATE streams SET viewer_count = viewer_count - 1 WHERE id = ?`, [id]);
};

export const updateTotalDonations = async (id: string): Promise<void> => {
  await query(
    `UPDATE streams SET total_donations = (
      SELECT COALESCE(SUM(amount), 0) FROM donations 
      WHERE stream_id = ? AND status = 'completed'
    ) WHERE id = ?`,
    [id, id]
  );
};

export const deleteStream = async (id: string): Promise<boolean> => {
  return db.delete('streams', id);
};