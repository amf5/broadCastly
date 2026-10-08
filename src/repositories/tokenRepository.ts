import { IToken } from '../models/Token.js';
import { db, query } from '../config/database/mysql.js';
import { v4 as uuidv4 } from 'uuid';

export const createToken = async (
  userId: string,
  refreshToken: string
): Promise<IToken | null> => {
  await deleteTokenByUserId(userId);

  const id = uuidv4();

  await db.create('tokens', {
    id,
    user_id: userId,
    refresh_token: refreshToken,
  });

  return findTokenById(id);
};

export const findTokenById = async (id: string): Promise<IToken | null> => {
  return db.findOne<IToken>('tokens', { id });
};

export const findTokenByUserId = async (userId: string): Promise<IToken | null> => {
  return db.findOne<IToken>('tokens', { user_id: userId });
};

export const findTokenByRefreshToken = async (refreshToken: string): Promise<IToken | null> => {
  return db.findOne<IToken>('tokens', { refresh_token: refreshToken });
};

export const deleteTokenByUserId = async (userId: string): Promise<boolean> => {
  const result = await query<any>(`DELETE FROM tokens WHERE user_id = ?`, [userId]);
  return result.affectedRows > 0;
};

export const deleteTokenByRefreshToken = async (refreshToken: string): Promise<boolean> => {
  const result = await query<any>(`DELETE FROM tokens WHERE refresh_token = ?`, [refreshToken]);
  return result.affectedRows > 0;
};