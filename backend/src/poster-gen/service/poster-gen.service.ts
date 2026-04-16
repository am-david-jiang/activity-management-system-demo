import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ActivityService } from '../../activity/activity.service';
import { PosterGenerationLog } from '../entities/poster-generation-log.entity';
import { GeneratePosterDto } from '../dto/generate-poster.dto';
import { WsMessage, SuccessMessage, ErrorMessage } from '../dto/ws-message.dto';
import {
  createOrchestratorAgent,
  OrchestratorResponse,
  type OrchestratorState,
} from '../agents/orchestrator.agent';
import type { ReactAgent } from 'langchain';
import type { PosterGenGateway } from '../gateway/poster-gen.gateway';

@Injectable()
export class PosterGenService {
  private readonly logger = new Logger(PosterGenService.name);

  private orchestrator: { agent: ReactAgent } | null = null;

  private sessions = new Map<string, OrchestratorState>();

  constructor(
    private readonly activityService: ActivityService,
    @InjectRepository(PosterGenerationLog)
    private readonly posterLogRepository: Repository<PosterGenerationLog>,
  ) {}

  private getOrchestrator() {
    if (!this.orchestrator) {
      this.orchestrator = createOrchestratorAgent(this.activityService);
    }
    return this.orchestrator;
  }

  async *generatePoster(
    dto: GeneratePosterDto,
    clientId: string,
    gateway: PosterGenGateway,
    sessionId?: string,
  ): AsyncGenerator<WsMessage, void, unknown> {
    const sid = sessionId ?? uuidv4();
    let state = this.sessions.get(sid);

    if (!state) {
      state = {
        sessionId: sid,
        activityId: dto.activityId,
        userRequirements: dto.requirements,
        currentPhase: 'requirements',
      };
      this.sessions.set(sid, state);
    }

    try {
      const { agent } = this.getOrchestrator();
      const config = { configurable: { thread_id: '6' } };
      const result = await agent.invoke(
        {
          messages: [
            {
              role: 'user',
              content: `请为活动 ${dto.activityId} 生成海报创意方案。需求：${dto.requirements}`,
            },
          ],
        },
        config,
      );

      this.logger.debug(`Orchestrator result: ${JSON.stringify(result)}`);

      const response = result.structuredResponse as OrchestratorResponse;

      if (response.success) {
        state.currentPhase = 'confirmed';

        if (response.imageUrl && fs.existsSync(response.imageUrl)) {
          const imageBuffer = fs.readFileSync(response.imageUrl);
          const filename = path.basename(response.imageUrl);
          const mimeType = filename.endsWith('.png')
            ? 'image/png'
            : 'image/jpeg';
          gateway.emitImageBinary(clientId, imageBuffer, filename, mimeType);
        }

        yield {
          type: 'success',
          imageUrl: response.imageUrl ?? '',
          message: '海报生成成功',
        } as SuccessMessage;
      } else {
        this.sessions.delete(sid);
        yield {
          type: 'error',
          message: response.error ?? '生成失败',
        } as ErrorMessage;
      }
    } catch (err) {
      this.logger.error(`Poster generation error: ${err}`);
      yield {
        type: 'error',
        message: err instanceof Error ? err.message : '生成失败',
      } as ErrorMessage;
      this.sessions.delete(sid);
    }
  }

  getSession(sessionId: string): OrchestratorState | undefined {
    return this.sessions.get(sessionId);
  }
}
