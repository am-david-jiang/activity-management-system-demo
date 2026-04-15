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
import {
  GeneratePosterDto,
  UserSelectDecisionDto,
  UserEditDecisionDto,
  UserRequestNewDecisionDto,
} from '../dto/generate-poster.dto';
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
  private clientSessionMap = new Map<string, string>(); // clientId -> sessionId

  constructor(private readonly posterGenService: PosterGenService) {}

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.clientSessionMap.delete(client.id);
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
      for await (const message of this.posterGenService.generatePoster(dto)) {
        client.emit(message.type, message);

        // Store session ID for concept selection
        if (message.type === 'concept_options') {
          this.clientSessionMap.set(client.id, message.sessionId);
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

  @SubscribeMessage('select_concept')
  async handleSelectConcept(
    @MessageBody() data: UserSelectDecisionDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const session = this.posterGenService.getSession(data.sessionId);
      if (!session) {
        client.emit('error', {
          type: 'error',
          message: 'Session not found or expired. Please start a new generation.',
        } as WsMessage);
        return;
      }

      const generator = await this.posterGenService.resumeWithSelection(
        data.sessionId,
        { type: 'select', directionId: data.directionId },
        { activityId: session.requirementsResult?.activity?.name ? 0 : 0, requirements: '' },
      );
      for await (const message of generator) {
        client.emit(message.type, message);
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

  @SubscribeMessage('edit_concept')
  async handleEditConcept(
    @MessageBody() data: UserEditDecisionDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const session = this.posterGenService.getSession(data.sessionId);
      if (!session) {
        client.emit('error', {
          type: 'error',
          message: 'Session not found or expired. Please start a new generation.',
        } as WsMessage);
        return;
      }

      const generator = await this.posterGenService.resumeWithSelection(
        data.sessionId,
        { type: 'edit', direction: data.direction },
        { activityId: 0, requirements: '' },
      );
      for await (const message of generator) {
        client.emit(message.type, message);
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

  @SubscribeMessage('request_new_concepts')
  async handleRequestNewConcepts(
    @MessageBody() data: UserRequestNewDecisionDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const session = this.posterGenService.getSession(data.sessionId);
      if (!session) {
        client.emit('error', {
          type: 'error',
          message: 'Session not found or expired. Please start a new generation.',
        } as WsMessage);
        return;
      }

      const generator = await this.posterGenService.resumeWithSelection(
        data.sessionId,
        { type: 'request_new' },
        { activityId: 0, requirements: '' },
      );
      for await (const message of generator) {
        client.emit(message.type, message);
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
