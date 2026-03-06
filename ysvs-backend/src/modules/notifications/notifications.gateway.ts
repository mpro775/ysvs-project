import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Server, Socket } from 'socket.io';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../common/decorators/roles.decorator';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NotificationEvent } from './interfaces/notification-event.interface';

interface SocketAuthPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
@WebSocketGateway({
  namespace: '/admin-notifications',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new UnauthorizedException('Missing authentication token');
      }

      const secret = this.configService.get<string>('jwt.secret');
      if (!secret) {
        throw new UnauthorizedException('JWT secret is not configured');
      }

      const payload = await this.jwtService.verifyAsync<SocketAuthPayload>(token, {
        secret,
      });

      const user = await this.userModel
        .findById(payload.sub)
        .select('email role isActive')
        .lean()
        .exec();

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const isAdmin =
        user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

      if (!user.isActive || !isAdmin) {
        throw new UnauthorizedException('Unauthorized websocket connection');
      }

      client.data.user = {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
      };
      client.join('admins:all');

      client.emit('notifications:connected', {
        connected: true,
        room: 'admins:all',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn(
        `Rejected websocket connection for client ${client.id}: ${(error as Error).message}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    client.leave('admins:all');
  }

  emitToAdmins(event: NotificationEvent): void {
    this.server.to('admins:all').emit('notifications:new', event);
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim();
    }

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
      return authorization.slice(7).trim();
    }

    return null;
  }
}
