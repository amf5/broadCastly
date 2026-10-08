import { query } from '../config/database/mysql.js';
import { RowDataPacket } from 'mysql2';
import logger from '../utils/logger.js';

export interface IStream extends RowDataPacket {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  stream_key: string;
  platforms: string;
  status: 'scheduled' | 'live' | 'ended' | 'error';
  started_at: Date | null;
  ended_at: Date | null;
  viewer_count: number;
  total_donations: number;
  created_at: Date;
  updated_at: Date;
}

export const createStreamsTable = async (): Promise<void> => {
  await query(`
    CREATE TABLE IF NOT EXISTS streams (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      stream_key VARCHAR(255) UNIQUE NOT NULL,
      platforms JSON,
      status ENUM('scheduled', 'live', 'ended', 'error') DEFAULT 'scheduled',
      started_at TIMESTAMP NULL,
      ended_at TIMESTAMP NULL,
      viewer_count INT DEFAULT 0,
      total_donations DECIMAL(12,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_stream_key (stream_key)
    )
  `);
  logger.info('✅ Streams table ready');
};