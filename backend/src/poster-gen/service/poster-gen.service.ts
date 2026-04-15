import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ActivityService } from '../../activity/activity.service';
import { PosterGenerationLog } from '../entities/poster-generation-log.entity';
import { GeneratePosterDto } from '../dto/generate-poster.dto';
import {
  WsMessage,
  SuccessMessage,
  ErrorMessage,
  ThinkingMessage,
} from '../dto/ws-message.dto';
import {
  createOrchestratorAgent,
  type OrchestratorState,
} from '../agents/orchestrator.agent';
import type { ConceptDirection } from '../agents/concept-planner.agent';
import type { ReactAgent } from 'langchain';

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

      state.currentPhase = 'confirmed';

      yield {
        type: 'success',
        message: '海报创意方案已生成，图片生成功能即将上线',
        imageUrl: '',
        prompt: 'Success',
      } as SuccessMessage;
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

  private createThinkingMessage(content: string): ThinkingMessage {
    return { type: 'thinking', content };
  }

  private extractConceptDirection(
    result: unknown,
  ): ConceptDirection | undefined {
    const response = result as {
      structuredResponse?: { direction?: ConceptDirection };
      messages?: Array<{ content: string }>;
    };

    if (response.structuredResponse?.direction) {
      return response.structuredResponse.direction;
    }

    if (response.messages && response.messages.length > 0) {
      const lastMessage = response.messages[response.messages.length - 1];
      if (lastMessage.content) {
        const jsonMatch = lastMessage.content.match(
          /\{[\s\S]*"direction"[\s\S]*\}/,
        );
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]) as {
              direction?: ConceptDirection;
            };
            if (parsed.direction) {
              return parsed.direction;
            }
          } catch {
            // ignore
          }
        }
      }
    }

    return undefined;
  }
}
