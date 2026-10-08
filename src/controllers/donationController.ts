import { Request, Response } from 'express';
import * as donationService from '../services/donationService.js';
import { logger } from '../utils/logger.js';
import { publishEvent } from '../config/kafka/kafka.js';

export const createDonation = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await donationService.createUserDonation(userId, req.body);
     if (result.success) {
      await publishEvent('donations', {
        type: 'donation.received',
        payload: result.data,
        timestamp: new Date().toISOString(),
      });
    }
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Create donation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDonationsByStream = async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const result = await donationService.getDonationsByStream(streamId as string);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Get donations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyDonations = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await donationService.getUserDonations(userId);
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Get my donations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDonationTotal = async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const result = await donationService.getStreamDonationTotal(streamId as string) ;
    res.status(result.status).json(result);
  } catch (error: any) {
    logger.error('Get donation total error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};