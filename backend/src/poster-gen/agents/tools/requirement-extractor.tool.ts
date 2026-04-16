import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Logger } from '@nestjs/common';
import type { ActivityService } from '../../../activity/activity.service';
import {
  createRequirementExtractorAgent,
  type RequirementExtractorOutput,
} from '../requirement-extractor';

const logger = new Logger('RequirementExtractorTool');

/**
 * Tool wrapper for the requirement extractor sub-agent.
 * The supervisor agent uses this tool to extract poster requirements.
 */
export function createRequirementExtractorTool(
  activityService: ActivityService,
) {
  return tool(
    async ({
      activityId,
      userRequirements,
    }: {
      activityId: number;
      userRequirements: string;
    }): Promise<string> => {
      try {
        logger.log(
          `Invoking requirement_extractor tool with activityId: ${activityId}, userRequirements: ${userRequirements}`,
        );
        const agent = createRequirementExtractorAgent(activityService);

        const input = `活动ID: ${activityId}\n用户需求描述: ${userRequirements}`;

        const result = await agent.invoke({
          messages: [{ role: 'user', content: input }],
        });

        logger.log(
          `requirement_extractor tool returned: ${JSON.stringify(result.structuredResponse)}`,
        );
        return JSON.stringify(
          result.structuredResponse as RequirementExtractorOutput,
        );
      } catch (error) {
        logger.error(
          `requirement_extractor tool failed: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
        return JSON.stringify({
          error: `requirement_extractor failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    },
    {
      name: 'requirement_extractor',
      description:
        'Extract poster design requirements from activity info and user input. ' +
        'Input: activityId (number), userRequirements (string). ' +
        'Output: JSON with activity info and poster requirements (style, theme, language, color, size, visualConstraints).',
      schema: z.object({
        activityId: z.number().describe('Activity ID'),
        userRequirements: z
          .string()
          .describe('User requirements for poster design'),
      }),
    },
  );
}
