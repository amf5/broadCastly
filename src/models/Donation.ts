import { query } from '../config/database/mysql.js';
import { RowDataPacket } from 'mysql2';
import logger from '../utils/logger.js';

export interface IDonation extends RowDataPacket {
  id: string;
  stream_id: string;
  user_id: string | null;
  amount: number;
  currency: string;
  message: string | null;
  platform: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: Date;
}

export const createDonationsTable = async (): Promise<void> => {
  await query(`
    CREATE TABLE IF NOT EXISTS donations (
      id VARCHAR(36) PRIMARY KEY,
      stream_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36),
      amount DECIMAL(12,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'USD',
      message TEXT,
      platform VARCHAR(20) DEFAULT 'websocket',
      status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_stream_id (stream_id),
      INDEX idx_user_id (user_id),
      INDEX idx_created_at (created_at)
    )
  `);
   logger.info('✅ Donations table ready');
};