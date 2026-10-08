import { IDonation } from '../models/Donation.js';
import { db, query } from '../config/database/mysql.js';
import { v4 as uuidv4 } from 'uuid';

export const createDonation = async (data: {
  streamId: string;
  userId?: string;
  amount: number;
  currency?: string;
  message?: string;
  platform?: string;
}): Promise<IDonation | null> => {
  const id = uuidv4();

  await db.create('donations', {
    id,
    stream_id: data.streamId,
    user_id: data.userId || null,
    amount: data.amount,
    currency: data.currency || 'USD',
    message: data.message || null,
    platform: data.platform || 'websocket',
  });

  return findById(id);
};

export const findById = async (id: string): Promise<IDonation | null> => {
  return db.findOne<IDonation>('donations', { id });
};

export const findByStreamId = async (streamId: string): Promise<IDonation[]> => {
  return query<IDonation[]>(
    `SELECT * FROM donations WHERE stream_id = ? ORDER BY created_at DESC`,
    [streamId]
  );
};

export const findByUserId = async (userId: string): Promise<IDonation[]> => {
  return query<IDonation[]>(
    `SELECT * FROM donations WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
};

export const updateDonationStatus = async (
  id: string,
  status: 'pending' | 'completed' | 'failed'
): Promise<void> => {
  await query(`UPDATE donations SET status = ? WHERE id = ?`, [status, id]);
};

export const getTotalByStream = async (streamId: string): Promise<number> => {
  const rows = await query<any[]>(
    `SELECT SUM(amount) as total FROM donations 
     WHERE stream_id = ? AND status = 'completed'`,
    [streamId]
  );
  return Number(rows[0]?.total || 0);
};

export const getTotalByUser = async (userId: string): Promise<number> => {
  const rows = await query<any[]>(
    `SELECT SUM(amount) as total FROM donations 
     WHERE user_id = ? AND status = 'completed'`,
    [userId]
  );
  return Number(rows[0]?.total || 0);
};

export const countByStream = async (streamId: string): Promise<number> => {
  const rows = await query<any[]>(
    `SELECT COUNT(*) as total FROM donations WHERE stream_id = ?`,
    [streamId]
  );
  return Number(rows[0]?.total || 0);
};

export const deleteDonation = async (id: string): Promise<boolean> => {
  return db.delete('donations', id);
};