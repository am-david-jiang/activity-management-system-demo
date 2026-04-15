import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { ActivityService } from '../../../activity/activity.service';
import {
  createRequirementExtractorAgent,
  type RequirementExtractorOutput,
} from '../requirement-extractor';

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
      const agent = createRequirementExtractorAgent(activityService);

      const input = `活动ID: ${activityId}\n用户需求描述: ${userRequirements}`;

      const result = await agent.invoke({
        messages: [{ role: 'user', content: input }],
      });

      return JSON.stringify(
        result.structuredResponse as RequirementExtractorOutput,
      );
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
