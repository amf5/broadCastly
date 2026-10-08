import { Router } from 'express';
import * as donationController from '../controllers/donationController.js';
import { authenticateToken } from '../middleware/auth.js';
import { donationLimiter } from '../middleware/rateLimiter.js';

const DonationRouter = Router();

DonationRouter.post('/', authenticateToken, donationLimiter, donationController.createDonation);
DonationRouter.get('/my', authenticateToken, donationController.getMyDonations);
DonationRouter.get('/stream/:streamId', donationController.getDonationsByStream);
DonationRouter.get('/total/:streamId', donationController.getDonationTotal);

export default DonationRouter;