import { query } from '../config/database/mysql.js';
import { RowDataPacket } from 'mysql2';
import logger from '../utils/logger.js';

export interface IToken extends RowDataPacket {
  id: string;
  user_id: string;
  refresh_token: string;
  created_at: Date;
}

export const createTokensTable = async (): Promise<void> => {
  await query(`
    CREATE TABLE IF NOT EXISTS tokens (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      refresh_token TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_refresh_token (refresh_token(255))
    )
  `);
  logger.info('✅ Tokens table created');
};