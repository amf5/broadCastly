import { IUser } from '../models/User.js';
import { db, query } from '../config/database/mysql.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export const createUser = async (data: {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin' | 'streamer';
}): Promise<IUser | null> => {
  const id = uuidv4();
  const password_hash = await bcrypt.hash(data.password, 10);

  await db.create('users', {
    id,
    username: data.username,
    email: data.email,
    password_hash,
    role: data.role || 'user',
  });

  return findById(id);
};

export const findById = async (id: string): Promise<IUser | null> => {
  return db.findOne<IUser>('users', { id });
};

export const findByEmail = async (email: string): Promise<IUser | null> => {
  return db.findOne<IUser>('users', { email });
};

export const findByUsername = async (username: string): Promise<IUser | null> => {
  return db.findOne<IUser>('users', { username });
};

export const findByIdWithKeys = async (
  id: string
): Promise<any | null> => {
  const user = await findById(id);

  if (!user) return null;

  let socialMediaKeys: unknown = user.social_media_keys;

  if (typeof socialMediaKeys === 'string') {
    try {
      socialMediaKeys = JSON.parse(socialMediaKeys);
    } catch (error) {
      socialMediaKeys = {};
    }
  }

  return {
    ...user,
    social_media_keys: socialMediaKeys || {},
  };
};

export const updateUser = async (
  id: string,
  data: {
    username?: string;
    email?: string;
    password?: string;
    role?: 'user' | 'admin' | 'streamer';
    avatar?: string;
    social_media_keys?: any;
    is_active?: boolean;
  }
): Promise<IUser | null> => {
  const updateData: any = {};

  if (data.username) updateData.username = data.username;
  if (data.email) updateData.email = data.email;
  if (data.role) updateData.role = data.role;
  if (data.avatar) updateData.avatar = data.avatar;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  if (data.password) {
    updateData.password_hash = await bcrypt.hash(data.password, 10);
  }

  if (data.social_media_keys) {
    updateData.social_media_keys = JSON.stringify(data.social_media_keys);
  }

  if (Object.keys(updateData).length === 0) {
    return findById(id);
  }

  await db.update('users', id, updateData);

  return findById(id);
};

export const updateLastLogin = async (id: string): Promise<void> => {
  await query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [id]);
};

export const deleteUser = async (id: string): Promise<boolean> => {
  return db.delete('users', id);
};

export const comparePassword = async (
  user: IUser,
  password: string
): Promise<boolean> => {
  return bcrypt.compare(password, user.password_hash);
};