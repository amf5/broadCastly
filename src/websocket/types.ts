import { WebSocket } from 'ws';

export interface WebSocketClient {
  id: string;
  ws: WebSocket;
  userId?: string;
  username?: string;
  role?: string;
  streamId?: string;
  isAuthenticated: boolean;
  connectedAt: Date;
  lastActivity: Date;
}

export interface WSMessage {
  type:
    | 'ping'
    | 'authenticate'
    | 'join-stream'
    | 'leave-stream'
    | 'comment'
    | 'donation'
    | 'start-stream'
    | 'stop-stream';
  payload?: any;
}

export interface WSResponse {
  type: string;
  data?: any;
  message?: string;
  timestamp: string;
}