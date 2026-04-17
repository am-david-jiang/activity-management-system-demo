import { createAgent } from 'langchain';
import { z } from 'zod';
import type { RequirementExtractorOutput } from './requirement-extractor';
import type { ConceptDirection } from './concept-planner.agent';

const SYSTEM_PROMPT = `You are a professional activity poster prompt builder expert. Your task is to generate a detailed Chinese image generation prompt based on the provided activity information, poster requirements, and concept direction.

【Input Information】
You will receive:
1. Activity information (name, dates, events)
2. Poster requirements (style, theme, language, color, size, visual constraints)
3. Concept direction (style, color palette, visual elements, layout hints, title concept)

【Output Format】
Generate a detailed Chinese image generation prompt suitable for Google's Gemini image generation model (nano-banana). The prompt should:
- Be descriptive and specific
- Include visual elements, colors, composition details
- Incorporate the activity theme and mood
- Describe the overall atmosphere and style
- Be clear about what should appear in the image

【Important Notes】
- The output prompt must be in Chinese
- Include specific color names and hex codes where applicable
- Describe the composition and layout
- Set the overall mood and atmosphere`;

export const PromptBuilderSchema = z.object({
  prompt: z.string().describe('Detailed English prompt for image generation'),
});

export type PromptBuilderOutput = z.infer<typeof PromptBuilderSchema>;

export function createPromptBuilderAgent(model: string = 'openai:gpt-5.4') {
  const agent = createAgent({
    model,
    tools: [],
    systemPrompt: SYSTEM_PROMPT,
    responseFormat: PromptBuilderSchema,
  });

  return agent;
}

export async function generatePrompt(
  requirements: RequirementExtractorOutput,
  direction: ConceptDirection,
  model?: string,
): Promise<string> {
  const agent = createPromptBuilderAgent(model);

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

  return (result.structuredResponse as PromptBuilderOutput).prompt;
}
