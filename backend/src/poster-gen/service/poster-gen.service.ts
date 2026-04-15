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
  ConceptOptionsMessage,
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

  // Orchestrator agent instance (created lazily)
  private orchestrator: { agent: ReactAgent } | null = null;

  // Session state storage (in-memory for now)
  private sessions = new Map<string, OrchestratorState>();

  constructor(
    private readonly activityService: ActivityService,
    @InjectRepository(PosterGenerationLog)
    private readonly posterLogRepository: Repository<PosterGenerationLog>,
  ) {}

  /**
   * Initialize or get the orchestrator agent
   */
  private getOrchestrator() {
    if (!this.orchestrator) {
      this.orchestrator = createOrchestratorAgent(this.activityService);
    }
    return this.orchestrator;
  }

  /**
   * Start poster generation flow
   * Returns AsyncGenerator that yields WsMessage
   */
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
      yield this.createThinkingMessage('正在分析活动信息和需求...');

      // Invoke the orchestrator agent
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

      // Extract concept directions from the agent's response
      const directions = this.extractConceptDirections(result);

      if (!directions || directions.length === 0) {
        throw new Error('未能生成创意方向');
      }

      // Update session state
      state.conceptDirections = directions;
      state.currentPhase = 'selection';

      // Yield concept options to frontend
      yield {
        type: 'concept_options',
        directions,
        sessionId: sid,
        message: '请选择海报方向或进行修改',
      } as ConceptOptionsMessage;
    } catch (err) {
      this.logger.error(`Poster generation error: ${err}`);
      yield {
        type: 'error',
        message: err instanceof Error ? err.message : '生成失败',
      } as ErrorMessage;
      this.sessions.delete(sid);
    }
  }

  /**
   * Handle user selection and continue the workflow
   */
  async resumeWithSelection(
    sessionId: string,
    decision:
      | { type: 'select'; directionId: string }
      | { type: 'edit'; direction: ConceptDirection }
      | { type: 'request_new' },
    dto: GeneratePosterDto,
  ): Promise<AsyncGenerator<WsMessage, void, unknown>> {
    const state = this.sessions.get(sessionId);
    if (!state) {
      throw new Error('Session not found or expired');
    }

    const generator = async function* (): AsyncGenerator<
      WsMessage,
      void,
      unknown
    > {
      try {
        if (decision.type === 'request_new') {
          // Invoke orchestrator again to regenerate concepts
          const { agent } = this.getOrchestrator();

          yield this.createThinkingMessage('正在重新生成创意方向...');

          const result = await agent.invoke({
            messages: [
              {
                role: 'user',
                content: `请重新为活动 ${dto.activityId} 生成海报创意方案。需求：${dto.requirements}`,
              },
            ],
          });

          const directions = this.extractConceptDirections(result);

          if (!directions || directions.length === 0) {
            throw new Error('未能生成创意方向');
          }

          state.conceptDirections = directions;
          state.currentPhase = 'selection';

          yield {
            type: 'concept_options',
            directions,
            sessionId,
            message: '请选择海报方向或进行修改',
          } as ConceptOptionsMessage;
          return;
        }

        // Select or edit - confirm the direction
        let selectedDirection: ConceptDirection;

        if (decision.type === 'select') {
          const found = state.conceptDirections?.find(
            (d) => d.direction_id === decision.directionId,
          );
          if (!found) {
            throw new Error('Selected direction not found');
          }
          selectedDirection = found;
        } else {
          selectedDirection = decision.direction;
        }

        state.selectedDirection = selectedDirection;
        state.currentPhase = 'confirmed';

        // Image generation will be added in future phase
        yield {
          type: 'success',
          message: '方向已确认，图片生成功能即将上线',
          imageUrl: '',
          prompt: selectedDirection.image_prompt,
        } as SuccessMessage;
      } catch (err) {
        this.logger.error(`Resume with selection error: ${err}`);
        yield {
          type: 'error',
          message: err instanceof Error ? err.message : '处理失败',
        } as ErrorMessage;
      }
    }.bind(this)();

    return generator;
  }

  getSession(sessionId: string): OrchestratorState | undefined {
    return this.sessions.get(sessionId);
  }

  private createThinkingMessage(content: string): ThinkingMessage {
    return { type: 'thinking', content };
  }

  /**
   * Extract concept directions from the orchestrator agent's response
   */
  private extractConceptDirections(
    result: unknown,
  ): ConceptDirection[] | undefined {
    // The agent returns a result with structuredResponse or messages
    const response = result as {
      structuredResponse?: { directions?: ConceptDirection[] };
      messages?: Array<{ content: string }>;
    };

    // Try to get directions from structuredResponse first
    if (response.structuredResponse?.directions) {
      return response.structuredResponse.directions;
    }

    // Try to parse from messages (agent might have returned text with directions)
    if (response.messages && response.messages.length > 0) {
      const lastMessage = response.messages[response.messages.length - 1];
      if (lastMessage.content) {
        // Try to find JSON directions in the message
        const jsonMatch = lastMessage.content.match(
          /\{[\s\S]*"directions"[\s\S]*\}|\[[\s\S]*"direction_id"[\s\S]*\]/,
        );
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.directions) {
              return parsed.directions;
            }
            if (Array.isArray(parsed)) {
              return parsed;
            }
          } catch {
            // Not JSON, ignore
          }
        }
      }
    }

    return undefined;
  }
}
