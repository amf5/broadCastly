import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const UserRouter = Router();

UserRouter.get('/me', authenticateToken, userController.getMe);
UserRouter.put('/me', authenticateToken, userController.updateMe);
UserRouter.delete('/me', authenticateToken, userController.deleteMe);

UserRouter.put('/me/social-keys', authenticateToken, userController.updateSocialKeys);
UserRouter.get('/me/social-keys', authenticateToken, userController.getSocialKeys);
export default UserRouter;