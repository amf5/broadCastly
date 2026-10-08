import { WebSocket } from 'ws';
import { WebSocketClient } from './types.js';

class RoomsManager {
  private rooms: Map<string, Set<string>> = new Map();
  private clients: Map<string, WebSocketClient> = new Map();

  // Add client
  addClient(client: WebSocketClient): void {
    this.clients.set(client.id, client);
  }

  // Remove client
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client?.streamId) {
      this.leaveRoom(clientId, client.streamId);
    }
    this.clients.delete(clientId);
  }

  // Get client by ID
  getClient(clientId: string): WebSocketClient | undefined {
    return this.clients.get(clientId);
  }

  // Get client by userId
  getClientByUserId(userId: string): WebSocketClient | undefined {
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        return client;
      }
    }
    return undefined;
  }

  // Join room
  joinRoom(clientId: string, streamId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Leave previous room if any
    if (client.streamId && client.streamId !== streamId) {
      this.leaveRoom(clientId, client.streamId);
    }

    client.streamId = streamId;

    if (!this.rooms.has(streamId)) {
      this.rooms.set(streamId, new Set());
    }
    this.rooms.get(streamId)!.add(clientId);
  }

  // Leave room
  leaveRoom(clientId: string, streamId: string): void {
    const room = this.rooms.get(streamId);
    if (room) {
      room.delete(clientId);
      if (room.size === 0) {
        this.rooms.delete(streamId);
      }
    }

    const client = this.clients.get(clientId);
    if (client) {
      client.streamId = undefined;
    }
  }

  // Get room clients
  getRoomClients(streamId: string): WebSocketClient[] {
    const room = this.rooms.get(streamId);
    if (!room) return [];

    const clients: WebSocketClient[] = [];
    for (const clientId of room) {
      const client = this.clients.get(clientId);
      if (client) clients.push(client);
    }
    return clients;
  }

  // Broadcast to room
  broadcastToRoom(
    streamId: string,
    message: any,
    excludeClientId?: string
  ): void {
    const clients = this.getRoomClients(streamId);
    const data = JSON.stringify(message);

    for (const client of clients) {
      if (
        client.id !== excludeClientId &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(data);
      }
    }
  }

  // Broadcast to all clients
  broadcastToAll(message: any, excludeClientId?: string): void {
    const data = JSON.stringify(message);

    for (const client of this.clients.values()) {
      if (
        client.id !== excludeClientId &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(data);
      }
    }
  }

  // Broadcast to authenticated clients only
  broadcastToAuthenticated(message: any, excludeClientId?: string): void {
    const data = JSON.stringify(message);

    for (const client of this.clients.values()) {
      if (
        client.isAuthenticated &&
        client.id !== excludeClientId &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(data);
      }
    }
  }

  // Get stats
  getStats() {
    const authenticatedCount = Array.from(this.clients.values()).filter(
      (c) => c.isAuthenticated
    ).length;

    return {
      totalClients: this.clients.size,
      authenticatedClients: authenticatedCount,
      anonymousClients: this.clients.size - authenticatedCount,
      totalRooms: this.rooms.size,
      rooms: Array.from(this.rooms.entries()).map(([streamId, clients]) => ({
        streamId,
        clients: clients.size,
      })),
    };
  }
}

export const roomsManager = new RoomsManager();