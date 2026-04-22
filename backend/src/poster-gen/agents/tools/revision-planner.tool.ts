import { tool, ToolMessage, type ToolRuntime } from 'langchain';
import { z } from 'zod';
import { Logger } from '@nestjs/common';
import { Command } from '@langchain/langgraph';
import { generateRevisionConceptDirection } from '../revision-planner.agent';
import type { RequirementExtractorOutput } from '../requirement-extractor';
import type { ConceptDirection } from '../concept-planner.agent';

const logger = new Logger('RevisionPlannerTool');

type RevisionStepState = {
  requirementsResult?: RequirementExtractorOutput;
  revisionRequirements?: string;
  previousConceptDirection?: ConceptDirection;
  previousImagePrompt?: string;
  previousFinalImage?: {
    imageUrl: string;
    mimeType: string;
    filename: string;
  };
};

export function createRevisionPlannerTool() {
  return tool(
    async (
      {
        revisionRequirements,
      }: {
        revisionRequirements: string;
      },
      runtime: ToolRuntime<RevisionStepState>,
    ): Promise<Command> => {
      const resolvedRequirementsResult = runtime.state.requirementsResult;
      const resolvedRevisionRequirements =
        revisionRequirements ?? runtime.state.revisionRequirements;
      const resolvedPreviousConcept = runtime.state.previousConceptDirection;

      if (
        !resolvedRequirementsResult ||
        !resolvedRevisionRequirements ||
        !resolvedPreviousConcept
      ) {
        return new Command({
          update: {
            messages: [
              new ToolMessage({
                content:
                  '修改策划失败：缺少 requirementsResult、revisionRequirements 或 previousConceptDirection 状态',
                tool_call_id: runtime.toolCallId,
                name: 'revision_planner',
              }),
            ],
            currentStep: 'completed',
            finalError:
              'revision_planner failed: missing requirementsResult, revisionRequirements, or previousConceptDirection',
          },
        });
      }

      try {
        logger.log('Invoking revision_planner handoff');
        const direction = await generateRevisionConceptDirection({
          requirements: resolvedRequirementsResult,
          revisionRequirements: resolvedRevisionRequirements,
          previousConceptDirection: resolvedPreviousConcept,
          previousImagePrompt: runtime.state.previousImagePrompt,
          previousFinalImage: runtime.state.previousFinalImage,
        });

        return new Command({
          update: {
            messages: [
              new ToolMessage({
                content: '海报修改概念生成完成，已移交到提示词构建阶段',
                tool_call_id: runtime.toolCallId,
                name: 'revision_planner',
              }),
            ],
            revisionConceptDirection: direction,
            currentStep: 'prompt',
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          `revision_planner handoff failed: ${message}`,
          error instanceof Error ? error.stack : undefined,
        );

        return new Command({
          update: {
            messages: [
              new ToolMessage({
                content: `海报修改概念生成失败：${message}`,
                tool_call_id: runtime.toolCallId,
                name: 'revision_planner',
              }),
            ],
            currentStep: 'completed',
            finalError: `revision_planner failed: ${message}`,
          },
        });
      }
    },
    {
      name: 'revision_planner',
      description:
        'Generate a revised concept direction from prior poster state and user revision requirements, then hand off to prompt building.',
      schema: z.object({
        revisionRequirements: z
          .string()
          .describe('User feedback describing how the poster should be revised'),
      }),
    },
  );
}
