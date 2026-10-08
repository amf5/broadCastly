import {
  findById,
  updateUser,
  deleteUser,
  findByIdWithKeys,
} from '../repositories/userRepository.js';
import { logger } from '../utils/logger.js';

// Get user profile
export const getUserProfile = async (userId: string) => {
  const user = await findById(userId);

  if (!user) {
    return { status: 404, success: false, message: 'User not found' };
  }

  const { password_hash, ...safeUser } = user;

  return { status: 200, success: true, data: safeUser };
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  data: { username?: string;  avatar?: string }
) => {
  const user = await updateUser(userId, data);

  if (!user) {
    return { status: 404, success: false, message: 'User not found' };
  }

  const { password_hash, ...safeUser } = user;

  logger.info(`User profile updated: ${userId}`);

  return { status: 200, success: true, message: 'Profile updated', data: safeUser };
};

// Update social media keys
export const updateUserSocialKeys = async (
  userId: string,
  socialMediaKeys: any
) => {
  const user = await updateUser(userId, { social_media_keys: socialMediaKeys });

  if (!user) {
    return { status: 404, success: false, message: 'User not found' };
  }

  logger.info(`Social keys updated: ${userId}`);

  return { status: 200, success: true, message: 'Social keys updated' };
};

// Get social media keys
export const getUserSocialKeys = async (userId: string) => {
  const user = await findByIdWithKeys(userId);

  if (!user) {
    return { status: 404, success: false, message: 'User not found' };
  }

  return {
    status: 200,
    success: true,
    data: user.social_media_keys || {},
  };
};

// Delete user account
export const deleteUserAccount = async (userId: string) => {
  const deleted = await deleteUser(userId);

  if (!deleted) {
    return { status: 404, success: false, message: 'User not found' };
  }

  logger.info(`User account deleted: ${userId}`);

  return { status: 200, success: true, message: 'Account deleted' };
};