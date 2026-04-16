import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Logger } from '@nestjs/common';
import {
  createPromptBuilderAgent,
  type PromptBuilderOutput,
} from '../prompt-builder.agent';
import {
  RequirementExtractorSchema,
  type RequirementExtractorOutput,
} from '../requirement-extractor';
import {
  ConceptDirectionSchema,
  type ConceptDirection,
} from '../concept-planner.agent';

const logger = new Logger('PromptBuilderTool');

/**
 * Tool wrapper for the prompt builder sub-agent.
 * Generates image generation prompts from requirements and concept direction.
 */
export function createPromptBuilderTool() {
  return tool(
    async ({
      requirementsJson,
      directionJson,
    }: {
      requirementsJson: string;
      directionJson: string;
    }): Promise<string> => {
      logger.log(
        `Invoking prompt_builder tool with requirementsJson: ${requirementsJson}, directionJson: ${directionJson}`,
      );
      let requirements: RequirementExtractorOutput;
      let direction: ConceptDirection;

      try {
        requirements = RequirementExtractorSchema.parse(
          JSON.parse(requirementsJson),
        );
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Invalid requirements: ${error.message}`);
        }
        if (error instanceof SyntaxError) {
          throw new Error(`Invalid JSON string: ${error.message}`);
        }
        throw new Error(
          `Failed to parse requirements: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }

      try {
        direction = ConceptDirectionSchema.parse(JSON.parse(directionJson));
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Invalid direction: ${error.message}`);
        }
        if (error instanceof SyntaxError) {
          throw new Error(`Invalid JSON string: ${error.message}`);
        }
        throw new Error(
          `Failed to parse direction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }

      try {
        const agent = createPromptBuilderAgent();

        const input = `Please generate an image generation prompt based on the following information:

## Activity Information
- Activity Name: ${requirements.activity.name}
- Start Date: ${requirements.activity.startDate}
- End Date: ${requirements.activity.endDate}
- Events:
${requirements.activity.events.map((e) => `  - ${e.name}: ${e.description} (${e.datetime}, ${e.location})`).join('\n')}

## Poster Requirements
- Style: ${requirements.poster.style}
- Theme: ${requirements.poster.theme}
- Language: ${requirements.poster.language}
- Color: ${requirements.poster.color}
- Size: ${requirements.poster.size}
- Visual Constraints: ${requirements.poster.visualConstraints.join(', ')}

## Concept Direction
- Style: ${direction.style}
- Color Palette:
  - Primary: ${direction.color_palette.primary}
  - Secondary: ${direction.color_palette.secondary}
  - Accent: ${direction.color_palette.accent}
- Visual Elements: ${direction.visual_elements.join(', ')}
- Layout Hints: ${direction.layout_hints}
- Title Concept: ${direction.title_concept}`;

        const result = await agent.invoke({
          messages: [{ role: 'user', content: input }],
        });

        const output = (result.structuredResponse as PromptBuilderOutput)
          .prompt;

        logger.log(`prompt_builder tool returned prompt: ${output}`);
        return JSON.stringify({ prompt: output });
      } catch (error) {
        logger.error(
          `prompt_builder tool failed: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
        return JSON.stringify({
          error: `prompt_builder failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    },
    {
      name: 'prompt_builder',
      description:
        'Generate detailed image generation prompt from requirements and concept direction. ' +
        'Input: requirementsJson (string), directionJson (string). ' +
        'Output: JSON with prompt (string) for image generation.',
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
