import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface StreamStatus {
  isLive: boolean;
  provider?: string;
  embedUrl?: string;
  titleAr?: string;
  titleEn?: string;
  viewerCount?: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/stream',
})
export class StreamingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(StreamingGateway.name);
  private connectedClients: Map<string, Socket> = new Map();
  private viewerCount: number = 0;

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);
    this.viewerCount++;
    this.logger.log(`Client connected: ${client.id}. Total viewers: ${this.viewerCount}`);

    // Broadcast updated viewer count
    this.broadcastViewerCount();
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.viewerCount = Math.max(0, this.viewerCount - 1);
    this.logger.log(`Client disconnected: ${client.id}. Total viewers: ${this.viewerCount}`);

    // Broadcast updated viewer count
    this.broadcastViewerCount();
  }

  @SubscribeMessage('viewer:join')
  handleViewerJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId?: string },
  ) {
    this.logger.log(`Viewer joined: ${client.id}`);
    
    // Send current status to the new viewer
    client.emit('stream:status', {
      viewerCount: this.viewerCount,
    });

    return { success: true };
  }

  @SubscribeMessage('viewer:leave')
  handleViewerLeave(@ConnectedSocket() client: Socket) {
    this.logger.log(`Viewer left: ${client.id}`);
    return { success: true };
  }

  @SubscribeMessage('stream:ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('stream:pong', { timestamp: Date.now() });
    return { success: true };
  }

  // Methods called by StreamingService

  broadcastStreamStarted(status: StreamStatus) {
    this.server.emit('stream:started', status);
    this.logger.log('Broadcast: Stream started');
  }

  broadcastStreamEnded() {
    this.server.emit('stream:ended', { isLive: false });
    this.logger.log('Broadcast: Stream ended');
  }

  broadcastStreamStatus(status: StreamStatus) {
    this.server.emit('stream:status', status);
  }

  broadcastViewerCount() {
    this.server.emit('stream:viewers', { count: this.viewerCount });
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
