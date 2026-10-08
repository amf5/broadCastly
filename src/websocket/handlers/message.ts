import { WebSocketClient, WSMessage } from '../types.js';
import { roomsManager } from '../rooms.js';
import { producer } from '../../config/kafka/kafka.js';
import { verifyAccessToken } from '../../utils/token.js';
import { logger } from '../../utils/logger.js';

export const handleMessage = async (
  client: WebSocketClient,
  rawData: string
): Promise<void> => {
  try {
    const message: WSMessage = JSON.parse(rawData);
    client.lastActivity = new Date();

    switch (message.type) {
      case 'ping':
        client.ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString(),
        }));
        break;

      case 'authenticate':
        await handleAuthenticate(client, message);
        break;

      case 'join-stream':
        if (message.payload?.streamId) {
          roomsManager.joinRoom(client.id, message.payload.streamId);
          client.ws.send(JSON.stringify({
            type: 'joined-stream',
            data: { streamId: message.payload.streamId },
            timestamp: new Date().toISOString(),
          }));
        }
        break;

      case 'leave-stream':
        if (client.streamId) {
          roomsManager.leaveRoom(client.id, client.streamId);
        }
        break;

      case 'comment':
        if (!client.isAuthenticated) {
          return sendError(client.ws, 'Please login to comment');
        }
        await handleComment(client, message);
        break;

      case 'donation':
        if (!client.isAuthenticated) {
          return sendError(client.ws, 'Please login to donate');
        }
        await handleDonation(client, message);
        break;

      case 'start-stream':
        if (!client.isAuthenticated) {
          return sendError(client.ws, 'Please login to start stream');
        }
        await handleStartStream(client, message);
        break;

      case 'stop-stream':
        if (!client.isAuthenticated) {
          return sendError(client.ws, 'Please login to stop stream');
        }
        await handleStopStream(client, message);
        break;

      default:
        logger.warn(`Unknown message type: ${message.type}`);
    }
  } catch (error) {
    logger.error('WebSocket message error:', error);
  }
};

// ============================================================
// 1. Authenticate
// ============================================================
const handleAuthenticate = async (
  client: WebSocketClient,
  message: WSMessage
): Promise<void> => {
  try {
    const token = message.payload?.token;

    if (!token) {
      return sendError(client.ws, 'Token is required');
    }

    const decoded = verifyAccessToken(token);

    client.userId = decoded.id;
    client.role = decoded.role || 'user';
    client.isAuthenticated = true;

    client.ws.send(JSON.stringify({
      type: 'authenticated',
      data: {
        userId: client.userId,
        role: client.role,
      },
      timestamp: new Date().toISOString(),
    }));

    console.log(`🔑 WebSocket authenticated: ${client.id} -> User: ${client.userId}`);
    logger.info(`WebSocket authenticated: ${client.id}`);
  } catch (error: any) {
    client.isAuthenticated = false;
    sendError(client.ws, 'Invalid or expired token');
    logger.error('WebSocket auth error:', error);
  }
};

// ============================================================
// 2. Comment
// ============================================================
const handleComment = async (
  client: WebSocketClient,
  message: WSMessage
): Promise<void> => {
  if (!client.streamId) {
    return sendError(client.ws, 'Please join a stream first');
  }

  const comment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId: client.userId!,
    username: client.username || 'User',
    streamId: client.streamId,
    text: message.payload?.text || '',
    platform: 'websocket',
    timestamp: new Date().toISOString(),
  };

  await producer.send({
    topic: 'comments',
    messages: [{
      key: comment.streamId,
      value: JSON.stringify({ type: 'comment.created', payload: comment }),
    }],
  });

  logger.info(`💬 Comment sent to Kafka: ${comment.text}`);
};

// ============================================================
// 3. Donation
// ============================================================
const handleDonation = async (
  client: WebSocketClient,
  message: WSMessage
): Promise<void> => {
  if (!client.streamId) {
    return sendError(client.ws, 'Please join a stream first');
  }

  const donation = {
    id: `don_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId: client.userId!,
    username: client.username || 'User',
    streamId: client.streamId,
    amount: message.payload?.amount || 0,
    message: message.payload?.message || '',
    platform: 'websocket',
    timestamp: new Date().toISOString(),
  };

  await producer.send({
    topic: 'donations',
    messages: [{
      key: donation.streamId,
      value: JSON.stringify({ type: 'donation.received', payload: donation }),
    }],
  });

  logger.info(`💰 Donation sent to Kafka: $${donation.amount}`);
};

// ============================================================
// 4. Start Stream
// ============================================================
const handleStartStream = async (
  client: WebSocketClient,
  message: WSMessage
): Promise<void> => {
  const streamKey = message.payload?.streamKey;
  const platforms = message.payload?.platforms;

  if (!streamKey) {
    return sendError(client.ws, 'Stream key is required');
  }

  await producer.send({
    topic: 'streams',
    messages: [{
      key: client.userId!,
      value: JSON.stringify({
        type: 'stream.started',
        payload: {
          userId: client.userId,
          streamKey,
          platforms: platforms || {},
          timestamp: new Date().toISOString(),
        },
      }),
    }],
  });

  client.ws.send(JSON.stringify({
    type: 'stream-started',
    data: { streamKey },
    timestamp: new Date().toISOString(),
  }));

  logger.info(`🎬 Stream started by user: ${client.userId}`);
};

// ============================================================
// 5. Stop Stream
// ============================================================
const handleStopStream = async (
  client: WebSocketClient,
  message: WSMessage
): Promise<void> => {
  await producer.send({
    topic: 'streams',
    messages: [{
      key: client.userId!,
      value: JSON.stringify({
        type: 'stream.stopped',
        payload: {
          userId: client.userId,
          timestamp: new Date().toISOString(),
        },
      }),
    }],
  });

  client.ws.send(JSON.stringify({
    type: 'stream-stopped',
    timestamp: new Date().toISOString(),
  }));

  logger.info(`🎬 Stream stopped by user: ${client.userId}`);
};

// ============================================================
// 6. Send Error
// ============================================================
const sendError = (ws: any, message: string): void => {
  ws.send(JSON.stringify({
    type: 'error',
    message,
    timestamp: new Date().toISOString(),
  }));
};