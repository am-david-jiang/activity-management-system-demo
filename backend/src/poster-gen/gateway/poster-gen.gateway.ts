import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PosterGenService } from '../service/poster-gen.service';
import { GeneratePosterDto } from '../dto/generate-poster.dto';
import { WsMessage } from '../dto/ws-message.dto';

@WebSocketGateway({
  namespace: '/poster-gen',
  cors: {
    origin: '*',
  },
})
export class PosterGenGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, Socket>();

  constructor(private readonly posterGenService: PosterGenService) {}

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('generate')
  async handleGenerate(
    @MessageBody() data: GeneratePosterDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!data.activityId || !data.requirements) {
      client.emit('error', {
        type: 'error',
        message: 'activityId and requirements are required',
      } as WsMessage);
      return;
    }

    if (data.requirements.length > 500) {
      client.emit('error', {
        type: 'error',
        message: 'Requirements cannot exceed 500 characters',
      } as WsMessage);
      return;
    }

    const dto: GeneratePosterDto = {
      activityId: Number(data.activityId),
      requirements: data.requirements,
    };

    try {
      for await (const message of this.posterGenService.generatePoster(
        dto,
        client.id,
      )) {
        if (
          message.type === 'success' &&
          'buffer' in message &&
          message.buffer
        ) {
          const { buffer, ...metadata } = message;
          client.emit('success', metadata);
          client.emit('success_buffer', buffer);
        } else {
          client.emit(message.type, message);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Internal server error';
      client.emit('error', {
        type: 'error',
        message: errorMessage,
      } as WsMessage);
    }
  }
}
