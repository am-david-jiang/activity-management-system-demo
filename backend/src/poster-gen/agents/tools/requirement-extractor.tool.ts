import { tool, ToolMessage, type ToolRuntime } from 'langchain';
import { z } from 'zod';
import { Logger } from '@nestjs/common';
import { Command } from '@langchain/langgraph';
import type { ActivityService } from '../../../activity/activity.service';
import {
  createRequirementExtractorAgent,
  RequirementExtractorSchema,
} from '../requirement-extractor';

const logger = new Logger('RequirementExtractorTool');

type RequirementStepState = {
  activityId?: number;
  userRequirements?: string;
};

/**
 * State transition tool for the requirements handoff step.
 */
export function createRequirementExtractorTool(
  activityService: ActivityService,
) {
  return tool(
    async (
      {
        activityId,
        userRequirements,
      }: {
        activityId: number;
        userRequirements: string;
      },
      runtime: ToolRuntime<RequirementStepState>,
    ): Promise<Command> => {
      const resolvedActivityId = activityId ?? runtime.state.activityId;
      const resolvedUserRequirements =
        userRequirements ?? runtime.state.userRequirements;

      if (resolvedActivityId == null || !resolvedUserRequirements) {
        return new Command({
          update: {
            messages: [
              new ToolMessage({
                content:
                  '需求提取失败：缺少 activityId 或 userRequirements 状态',
                tool_call_id: runtime.toolCallId,
                name: 'requirement_extractor',
              }),
            ],
            currentStep: 'completed',
            finalError:
              'requirement_extractor failed: missing activityId or userRequirements',
          },
        });
      }

      try {
        logger.log(
          `Invoking requirement_extractor handoff with activityId: ${resolvedActivityId}`,
        );
        const agent = createRequirementExtractorAgent(activityService);
        const input = `活动ID: ${resolvedActivityId}\n用户需求描述: ${resolvedUserRequirements}`;

        const result = await agent.invoke({
          messages: [{ role: 'user', content: input }],
        });

        const requirements = RequirementExtractorSchema.parse(
          result.structuredResponse,
        );

        return new Command({
          update: {
            messages: [
              new ToolMessage({
                content: '海报需求提取完成，已移交到创意策划阶段',
                tool_call_id: runtime.toolCallId,
                name: 'requirement_extractor',
              }),
            ],
            requirementsResult: requirements,
            currentStep: 'concept',
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          `requirement_extractor handoff failed: ${message}`,
          error instanceof Error ? error.stack : undefined,
        );

        return new Command({
          update: {
            messages: [
              new ToolMessage({
                content: `海报需求提取失败：${message}`,
                tool_call_id: runtime.toolCallId,
                name: 'requirement_extractor',
              }),
            ],
            currentStep: 'completed',
            finalError: `requirement_extractor failed: ${message}`,
          },
        });
      }
    },
    {
      name: 'requirement_extractor',
      description:
        'Extract poster design requirements from activity info and user input, then hand off to the concept planning step.',
      schema: z.object({
        activityId: z.number().describe('Activity ID'),
        userRequirements: z
          .string()
          .describe('User requirements for poster design'),
      }),
    },
  );
}
