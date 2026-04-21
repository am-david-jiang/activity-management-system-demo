import { tool, ToolMessage, type ToolRuntime } from 'langchain';
import { z } from 'zod';
import { Logger } from '@nestjs/common';
import { Command } from '@langchain/langgraph';
import { generateConceptDirection } from '../concept-planner.agent';
import type { RequirementExtractorOutput } from '../requirement-extractor';

const logger = new Logger('ConceptPlannerTool');

type ConceptStepState = {
  requirementsResult?: RequirementExtractorOutput;
};

/**
 * State transition tool for the concept handoff step.
 */
export function createConceptPlannerTool() {
  return tool(
    async (
      {
        requirementsJson,
      }: {
        requirementsJson: string;
      },
      runtime: ToolRuntime<ConceptStepState>,
    ): Promise<Command> => {
      let requirementsResult = runtime.state.requirementsResult;

      if (requirementsJson) {
        try {
          requirementsResult = JSON.parse(
            requirementsJson,
          ) as RequirementExtractorOutput;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Invalid JSON';
          return new Command({
            update: {
              messages: [
                new ToolMessage({
                  content: `创意策划失败：requirementsJson 解析失败，${message}`,
                  tool_call_id: runtime.toolCallId,
                  name: 'concept_planner',
                }),
              ],
              currentStep: 'completed',
              finalError: `concept_planner failed: invalid requirementsJson: ${message}`,
            },
          });
        }
      }

      if (!requirementsResult) {
        return new Command({
          update: {
            messages: [
              new ToolMessage({
                content: '创意策划失败：缺少 requirementsResult 状态',
                tool_call_id: runtime.toolCallId,
                name: 'concept_planner',
              }),
            ],
            currentStep: 'completed',
            finalError: 'concept_planner failed: missing requirementsResult',
          },
        });
      }

      try {
        logger.log('Invoking concept_planner handoff');
        const direction = await generateConceptDirection(requirementsResult);

        return new Command({
          update: {
            messages: [
              new ToolMessage({
                content: '海报创意方向生成完成，已移交到提示词构建阶段',
                tool_call_id: runtime.toolCallId,
                name: 'concept_planner',
              }),
            ],
            conceptDirection: direction,
            currentStep: 'prompt',
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          `concept_planner handoff failed: ${message}`,
          error instanceof Error ? error.stack : undefined,
        );

        return new Command({
          update: {
            messages: [
              new ToolMessage({
                content: `海报创意方向生成失败：${message}`,
                tool_call_id: runtime.toolCallId,
                name: 'concept_planner',
              }),
            ],
            currentStep: 'completed',
            finalError: `concept_planner failed: ${message}`,
          },
        });
      }
    },
    {
      name: 'concept_planner',
      description:
        'Generate 1 best poster concept direction from requirements and hand off to the prompt building step.',
      schema: z.object({
        requirementsJson: z
          .string()
          .describe(
            'JSON string of poster requirements from requirement_extractor',
          ),
      }),
    },
  );
}
