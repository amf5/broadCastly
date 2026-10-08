import { WebSocket } from 'ws';
import { WebSocketClient } from '../types.js';
import { roomsManager } from '../rooms.js';
import { logger } from '../../utils/logger.js';

export const handleConnection = (ws: WebSocket): WebSocketClient => {
  const client: WebSocketClient = {
    id: `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ws,
    isAuthenticated: false,
    connectedAt: new Date(),
    lastActivity: new Date(),
  };

  roomsManager.addClient(client);

  console.log(`🔌 WebSocket connected: ${client.id}`);
  logger.info(`WebSocket client connected: ${client.id}`);

  ws.send(JSON.stringify({
    type: 'connected',
    data: {
      clientId: client.id,
      isAuthenticated: false,
    },
    timestamp: new Date().toISOString(),
  }));

  return client;
};

export const handleDisconnect = (clientId: string): void => {
  roomsManager.removeClient(clientId);
  console.log(`🔌 WebSocket disconnected: ${clientId}`);
  logger.info(`WebSocket client disconnected: ${clientId}`);
};