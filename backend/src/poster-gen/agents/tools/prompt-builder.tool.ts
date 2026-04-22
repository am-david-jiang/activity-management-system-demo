import { tool, ToolMessage, type ToolRuntime } from 'langchain';
import { z } from 'zod';
import { Logger } from '@nestjs/common';
import { Command } from '@langchain/langgraph';
import { generatePrompt } from '../prompt-builder.agent';
import type { RequirementExtractorOutput } from '../requirement-extractor';
import type { ConceptDirection } from '../concept-planner.agent';

const logger = new Logger('PromptBuilderTool');

type PromptStepState = {
  requirementsResult?: RequirementExtractorOutput;
  conceptDirection?: ConceptDirection;
  revisionConceptDirection?: ConceptDirection;
  revisionRequirements?: string;
  previousImagePrompt?: string;
};

/**
 * State transition tool for the prompt handoff step.
 */
export function createPromptBuilderTool() {
  return tool(
    async (
      {
        requirementsJson,
        directionJson,
      }: {
        requirementsJson: string;
        directionJson: string;
      },
      runtime: ToolRuntime<PromptStepState>,
    ): Promise<Command> => {
      let requirementsResult = runtime.state.requirementsResult;
      let conceptDirection =
        runtime.state.revisionConceptDirection ?? runtime.state.conceptDirection;

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
                  content: `提示词构建失败：requirementsJson 解析失败，${message}`,
                  tool_call_id: runtime.toolCallId,
                  name: 'prompt_builder',
                }),
              ],
              currentStep: 'completed',
              finalError: `prompt_builder failed: invalid requirementsJson: ${message}`,
            },
          });
        }
      }

      if (directionJson) {
        try {
          conceptDirection = JSON.parse(directionJson) as ConceptDirection;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Invalid JSON';
          return new Command({
            update: {
              messages: [
                new ToolMessage({
                  content: `提示词构建失败：directionJson 解析失败，${message}`,
                  tool_call_id: runtime.toolCallId,
                  name: 'prompt_builder',
                }),
              ],
              currentStep: 'completed',
              finalError: `prompt_builder failed: invalid directionJson: ${message}`,
            },
          });
        }
      }

      if (!requirementsResult || !conceptDirection) {
        return new Command({
          update: {
            messages: [
              new ToolMessage({
                content:
                  '提示词构建失败：缺少 requirementsResult 或 conceptDirection 状态',
                tool_call_id: runtime.toolCallId,
                name: 'prompt_builder',
              }),
            ],
            currentStep: 'completed',
            finalError:
              'prompt_builder failed: missing requirementsResult or conceptDirection',
          },
        });
      }

      try {
        logger.log('Invoking prompt_builder handoff');
        const prompt = await generatePrompt(
          requirementsResult,
          conceptDirection,
          runtime.state.revisionRequirements
            ? {
                revisionRequirements: runtime.state.revisionRequirements,
                previousConceptDirection: runtime.state.conceptDirection,
                previousImagePrompt: runtime.state.previousImagePrompt,
              }
            : undefined,
        );

        return new Command({
          update: {
            messages: [
              new ToolMessage({
                content: '图像提示词生成完成，已移交到海报出图阶段',
                tool_call_id: runtime.toolCallId,
                name: 'prompt_builder',
              }),
            ],
            imagePrompt: prompt,
            currentStep: 'image',
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          `prompt_builder handoff failed: ${message}`,
          error instanceof Error ? error.stack : undefined,
        );

        return new Command({
          update: {
            messages: [
              new ToolMessage({
                content: `图像提示词生成失败：${message}`,
                tool_call_id: runtime.toolCallId,
                name: 'prompt_builder',
              }),
            ],
            currentStep: 'completed',
            finalError: `prompt_builder failed: ${message}`,
          },
        });
      }
    },
    {
      name: 'prompt_builder',
      description:
        'Generate detailed image generation prompt from requirements and concept direction, then hand off to image generation.',
      schema: z.object({
        requirementsJson: z
          .string()
          .describe(
            'JSON string of poster requirements from requirement_extractor',
          ),
        directionJson: z
          .string()
          .describe('JSON string of concept direction from concept_planner'),
      }),
    },
  );
}
