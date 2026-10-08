import { Router } from 'express';
import crypto from 'crypto';
import { publishEvent } from '../config/kafka/kafka.js';
import { logger } from '../utils/logger.js';

const WebhookRouter = Router();

// ============================================================
// Verify Signature
// ============================================================
const verifySignature = (req: any): boolean => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.FACEBOOK_APP_SECRET!)
      .update(JSON.stringify(req.body))
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  } catch (error) {
    logger.error('Signature verification error:', error);
    return false;
  }
};

// ============================================================
// FACEBOOK WEBHOOK
// ============================================================

// Facebook Verification (GET)
WebhookRouter.get('/facebook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    logger.info('Facebook webhook verified');
    return res.status(200).send(challenge);
  }

  logger.warn('Facebook webhook verification failed');
  return res.sendStatus(403);
});

// Facebook Events (POST)
WebhookRouter.post('/facebook', async (req, res) => {
  try {
    if (!verifySignature(req)) {
      logger.warn('Invalid Facebook signature');
      return res.sendStatus(403);
    }

    const body = req.body;

    if (body.object === 'page') {
      for (const entry of body.entry ?? []) {
        for (const change of entry.changes ?? []) {
          if (change.field === 'feed' && change.value?.item === 'comment') {
            await publishEvent('comments', {
              type: 'comment.created',
              payload: {
                streamId: change.value.post_id,
                userId: change.value.from?.id,
                username: change.value.from?.name,
                text: change.value.message,
                platform: 'facebook',
              },
              timestamp: new Date().toISOString(),
            });

            logger.info(`Facebook comment published: ${change.value.message}`);
          }
        }
      }
    }

    return res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    logger.error('Facebook webhook error:', error);
    return res.sendStatus(500);
  }
});

// ============================================================
// INSTAGRAM WEBHOOK
// ============================================================

// Instagram Verification (GET)
WebhookRouter.get('/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    logger.info('Instagram webhook verified');
    return res.status(200).send(challenge);
  }

  logger.warn('Instagram webhook verification failed');
  return res.sendStatus(403);
});

// Instagram Events (POST)
WebhookRouter.post('/instagram', async (req, res) => {
  try {
    if (!verifySignature(req)) {
      logger.warn('Invalid Instagram signature');
      return res.sendStatus(403);
    }

    const body = req.body;

    logger.info('Instagram webhook received', { body });

    if (body.object === 'instagram') {
      for (const entry of body.entry ?? []) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'comments') {
              const value = change.value;

              await publishEvent('comments', {
                type: 'comment.created',
                payload: {
                  streamId: value.media?.id || value.id,
                  userId: value.from?.id,
                  username: value.from?.username,
                  text: value.text,
                  platform: 'instagram',
                },
                timestamp: new Date().toISOString(),
              });

              logger.info(`Instagram comment published: ${value.text}`);
            }
          }
        }
      }
    }

    return res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    logger.error('Instagram webhook error:', error);
    return res.sendStatus(500);
  }
});

export default WebhookRouter;