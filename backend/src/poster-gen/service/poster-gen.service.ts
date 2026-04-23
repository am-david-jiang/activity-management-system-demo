import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../activity/activity.service';
import { PosterGenerationLog } from '../entities/poster-generation-log.entity';
import { GeneratePosterDto, RevisePosterDto } from '../dto/generate-poster.dto';
import {
  WsMessage,
  SuccessMessage,
  ErrorMessage,
  ToolCallMessage,
} from '../dto/ws-message.dto';
import {
  createOrchestratorAgent,
  OrchestratorResponse,
  type OrchestratorState,
} from '../agents/orchestrator.agent';
import { AIMessage, ToolMessage } from 'langchain';

@Injectable()
export class PosterGenService {
  private readonly logger = new Logger(PosterGenService.name);

  private orchestrator: ReturnType<typeof createOrchestratorAgent> | null =
    null;

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

  private mergeSessionState(
    state: OrchestratorState,
    values: Partial<OrchestratorState> | undefined,
  ): void {
    if (!values || typeof values !== 'object') {
      return;
    }

    const fields: Array<keyof OrchestratorState> = [
      'activityId',
      'userRequirements',
      'currentStep',
      'revisionRequirements',
      'requirementsResult',
      'conceptDirection',
      'revisionConceptDirection',
      'imagePrompt',
      'previousImagePrompt',
      'previousConceptDirection',
      'previousFinalImage',
      'finalImage',
      'finalError',
    ];

    const mutableState = state as Record<
      keyof OrchestratorState,
      OrchestratorState[keyof OrchestratorState]
    >;
    const typedValues = values as Partial<
      Record<
        keyof OrchestratorState,
        OrchestratorState[keyof OrchestratorState]
      >
    >;

    for (const field of fields) {
      const value = typedValues[field];
      if (value !== undefined) {
        mutableState[field] = value;
      }
    }
  }

  private async syncSessionStateFromThread(
    state: OrchestratorState,
    threadId: string,
  ): Promise<void> {
    try {
      const { agent } = this.getOrchestrator();
      const statefulAgent = agent as {
        getState: (config: {
          configurable: { thread_id: string };
        }) => Promise<{ values?: Partial<OrchestratorState> }>;
      };
      const snapshot = await statefulAgent.getState({
        configurable: { thread_id: threadId },
      });

      this.mergeSessionState(state, snapshot.values);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown state sync error';
      this.logger.warn(
        `Failed to sync poster session state for thread ${threadId}: ${message}`,
      );
    }
  }

  private async *runPosterFlow(
    dto: { activityId: number; requirementsText: string },
    state: OrchestratorState,
    threadId: string,
  ): AsyncGenerator<WsMessage, void, unknown> {
    try {
      const { agent } = this.getOrchestrator();
      const config = {
        configurable: { thread_id: threadId },
        streamMode: 'updates' as const,
      };

      const stream = await agent.stream(
        {
          activityId: state.activityId,
          userRequirements: state.userRequirements,
          revisionRequirements: state.revisionRequirements,
          requirementsResult: state.requirementsResult,
          conceptDirection: state.conceptDirection,
          revisionConceptDirection: state.revisionConceptDirection,
          previousImagePrompt: state.previousImagePrompt,
          previousConceptDirection: state.previousConceptDirection,
          previousFinalImage: state.previousFinalImage,
          imagePrompt: state.imagePrompt,
          finalImage: state.finalImage,
          finalError: state.finalError,
          currentStep: state.currentStep,
          messages: [
            {
              role: 'user',
              content: dto.requirementsText,
            },
          ],
        },
        config,
      );

      let finalResponse: OrchestratorResponse | null = null;

      for await (const chunk of stream) {
        const entries = Object.entries(chunk);
        const [, rawContent] = entries[0];
        const content = rawContent as {
          messages?: unknown[];
          structuredResponse?: OrchestratorResponse;
        };

        if (content.structuredResponse) {
          finalResponse = content.structuredResponse;
        }

        const messages = content.messages ?? [];
        const msg = messages.pop();
        if (msg instanceof ToolMessage) {
          const name = msg.name;
          yield {
            type: 'generating',
            content: `工具 ${name} 执行完成`,
          } as { type: 'generating'; content: string };
        } else {
          const toolCalls = (msg as AIMessage).tool_calls ?? [];
          for (const toolCall of toolCalls) {
            yield {
              type: 'tool_call',
              toolName: toolCall.name ?? 'unknown',
              input: toolCall.args as Record<string, unknown>,
            } as ToolCallMessage;
          }
        }
      }

      await this.syncSessionStateFromThread(state, threadId);

      if (!finalResponse) {
        yield {
          type: 'error',
          message: '未收到生成结果',
        } as ErrorMessage;
        return;
      }

      if (finalResponse.success) {
        state.currentStep = 'completed';
        if (!state.finalImage) {
          state.finalImage = {
            imageUrl: finalResponse.imageUrl ?? '',
            mimeType: finalResponse.mimeType ?? 'image/png',
            filename:
              finalResponse.filename ??
              path.basename(finalResponse.imageUrl ?? 'poster.png'),
          };
        }

        const imageUrl =
          state.finalImage.imageUrl || finalResponse.imageUrl || '';
        const filename =
          state.finalImage.filename ||
          finalResponse.filename ||
          path.basename(imageUrl || 'poster.png');
        const mimeType =
          state.finalImage.mimeType ||
          finalResponse.mimeType ||
          (filename.endsWith('.png') ? 'image/png' : 'image/jpeg');

        let buffer: ArrayBuffer | undefined;
        if (imageUrl && fs.existsSync(imageUrl)) {
          const imageBuffer = fs.readFileSync(imageUrl);
          buffer = imageBuffer.buffer.slice(
            imageBuffer.byteOffset,
            imageBuffer.byteOffset + imageBuffer.byteLength,
          );
        }

        yield {
          type: 'success',
          sessionId: state.sessionId,
          filename,
          mimeType,
          message: '海报生成成功',
          buffer,
        } as SuccessMessage;
      } else {
        state.currentStep = 'completed';
        state.finalError = finalResponse.error ?? '生成失败';
        yield {
          type: 'error',
          message: finalResponse.error ?? '生成失败',
        } as ErrorMessage;
      }
    } catch (err) {
      this.logger.error(`Poster generation error: ${err}`);
      yield {
        type: 'error',
        message: err instanceof Error ? err.message : '生成失败',
      } as ErrorMessage;
    }
  }

  async *generatePoster(
    dto: GeneratePosterDto,
    _clientId: string,
    sessionId?: string,
  ): AsyncGenerator<WsMessage, void, unknown> {
    const sid = sessionId ?? randomUUID();
    const state: OrchestratorState = {
      sessionId: sid,
      activityId: dto.activityId,
      userRequirements: dto.requirements,
      currentStep: 'requirements',
    };
    this.sessions.set(sid, state);

    yield* this.runPosterFlow(
      {
        activityId: dto.activityId,
        requirementsText: `请为活动 ${dto.activityId} 生成海报创意方案。需求：${dto.requirements}`,
      },
      state,
      sid,
    );
  }

  async *revisePoster(
    dto: RevisePosterDto,
    _clientId: string,
  ): AsyncGenerator<WsMessage, void, unknown> {
    const state = this.sessions.get(dto.sessionId);

    if (!state) {
      yield {
        type: 'error',
        message: '未找到对应会话，请先完成一次海报生成',
      } as ErrorMessage;
      return;
    }

    if (
      !state.requirementsResult ||
      !state.conceptDirection ||
      !state.imagePrompt ||
      !state.finalImage
    ) {
      yield {
        type: 'error',
        message: '当前会话缺少可用于修改的历史生成结果',
      } as ErrorMessage;
      return;
    }

    state.previousConceptDirection = state.conceptDirection;
    state.previousImagePrompt = state.imagePrompt;
    state.previousFinalImage = state.finalImage;
    state.revisionRequirements = dto.revisionRequirements;
    state.revisionConceptDirection = undefined;
    state.imagePrompt = undefined;
    state.finalImage = undefined;
    state.finalError = undefined;
    state.currentStep = 'revision';

    yield* this.runPosterFlow(
      {
        activityId: state.activityId,
        requirementsText: `请根据上一轮海报结果和以下修改意见重新生成活动 ${state.activityId} 的海报。修改意见：${dto.revisionRequirements}`,
      },
      state,
      dto.sessionId,
    );
  }

  getSession(sessionId: string): OrchestratorState | undefined {
    return this.sessions.get(sessionId);
  }
}
