import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  createConceptPlannerAgent,
  type ConceptDirection,
} from '../concept-planner.agent';
import type { RequirementExtractorOutput } from '../requirement-extractor';

/**
 * Tool wrapper for the concept planner sub-agent.
 * Generates poster concept directions from requirements.
 */
export function createConceptPlannerTool() {
  return tool(
    async ({
      requirementsJson,
    }: {
      requirementsJson: string;
    }): Promise<string> => {
      const requirements: RequirementExtractorOutput = JSON.parse(requirementsJson);

      const input = `请基于以下活动信息生成海报创意方向：

活动名称：${requirements.activity.name}
活动时间：${requirements.activity.startDate} 至 ${requirements.activity.endDate}

活动事件：
${requirements.activity.events.map((e) => `- ${e.name}: ${e.description}`).join('\n')}

海报风格偏好：${requirements.poster.style}
主题色调：${requirements.poster.theme}
语言：${requirements.poster.language}
颜色要求：${requirements.poster.color}
尺寸：${requirements.poster.size}
视觉约束：${requirements.poster.visualConstraints.join('、')}`;

      const agent = createConceptPlannerAgent();

      const result = await agent.invoke({
        messages: [{ role: 'user', content: input }],
      });

      const directions = (
        result.structuredResponse as { directions: ConceptDirection[] }
      ).directions;

      return JSON.stringify({ directions });
    },
    {
      name: 'concept_planner',
      description:
        'Generate 2-4 differentiated poster concept directions from requirements. ' +
        'Input: requirementsJson (string) - JSON string of poster requirements. ' +
        'Output: JSON with array of concept directions containing style, color_palette, visual_elements, layout_hints, title_concept, image_prompt.',
      schema: z.object({
        requirementsJson: z.string().describe('JSON string of poster requirements from requirement_extractor'),
      }),
    },
  );
}
