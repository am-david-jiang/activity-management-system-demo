import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../activity/activity.service';
import { PosterGenerationLog } from '../entities/poster-generation-log.entity';
import { GeneratePosterDto } from '../dto/generate-poster.dto';
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

  async *generatePoster(
    dto: GeneratePosterDto,
    _clientId: string,
    sessionId?: string,
  ): AsyncGenerator<WsMessage, void, unknown> {
    const sid = sessionId ?? randomUUID();
    let state = this.sessions.get(sid);

    if (!state) {
      state = {
        sessionId: sid,
        activityId: dto.activityId,
        userRequirements: dto.requirements,
        currentStep: 'requirements',
      };
      this.sessions.set(sid, state);
    }

    try {
      const { agent } = this.getOrchestrator();
      const config = {
        configurable: { thread_id: sid },
        streamMode: 'updates' as const,
      };

      const stream = await agent.stream(
        {
          activityId: state.activityId,
          userRequirements: state.userRequirements,
          currentStep: state.currentStep,
          messages: [
            {
              role: 'user',
              content: `请为活动 ${dto.activityId} 生成海报创意方案。需求：${dto.requirements}`,
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

        const messages = content.messages ?? [];
        for (const msg of messages) {
          if (content.structuredResponse) {
            finalResponse = content.structuredResponse;
            continue;
          }

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
      }

      if (!finalResponse) {
        yield {
          type: 'error',
          message: '未收到生成结果',
        } as ErrorMessage;
        this.sessions.delete(sid);
        return;
      }

      if (finalResponse.success) {
        state.currentStep = 'completed';
        state.finalImage = {
          imageUrl: finalResponse.imageUrl ?? '',
          mimeType: finalResponse.mimeType ?? 'image/png',
          filename:
            finalResponse.filename ??
            path.basename(finalResponse.imageUrl ?? 'poster.png'),
        };

        const filename =
          finalResponse.filename ??
          path.basename(finalResponse.imageUrl ?? 'poster.png');
        const mimeType =
          finalResponse.mimeType ??
          (filename.endsWith('.png') ? 'image/png' : 'image/jpeg');

        let buffer: ArrayBuffer | undefined;
        if (finalResponse.imageUrl && fs.existsSync(finalResponse.imageUrl)) {
          const imageBuffer = fs.readFileSync(finalResponse.imageUrl);
          buffer = imageBuffer.buffer.slice(
            imageBuffer.byteOffset,
            imageBuffer.byteOffset + imageBuffer.byteLength,
          );
        }

        yield {
          type: 'success',
          filename,
          mimeType,
          message: '海报生成成功',
          buffer,
        } as SuccessMessage;
      } else {
        state.currentStep = 'completed';
        state.finalError = finalResponse.error ?? '生成失败';
        this.sessions.delete(sid);
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
      this.sessions.delete(sid);
    }
  }

  getSession(sessionId: string): OrchestratorState | undefined {
    return this.sessions.get(sessionId);
  }
}
