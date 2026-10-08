import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { handleConnection, handleDisconnect } from './handlers/connection.js';
import { handleMessage } from './handlers/message.js';
import { roomsManager } from './rooms.js';
import { logger } from '../utils/logger.js';

export const createWebSocketServer = (server: HttpServer): WebSocketServer => {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 1024,
  });

  console.log('✅ WebSocket server running on /ws');
  logger.info('WebSocket server running on /ws');

  wss.on('connection', (ws: WebSocket) => {
    const client = handleConnection(ws);

    ws.on('message', (data: string) => {
      handleMessage(client, data.toString());
    });

    ws.on('close', () => {
      handleDisconnect(client.id);
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for ${client.id}:`, error);
    });
  });

  (wss as any).getStats = () => roomsManager.getStats();
  (wss as any).broadcastToRoom = (streamId: string, message: any) => {
    roomsManager.broadcastToRoom(streamId, message);
  };

  return wss;
};

export { roomsManager };
export default { createWebSocketServer, roomsManager };