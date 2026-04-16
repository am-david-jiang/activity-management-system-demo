import { createAgent } from 'langchain';
import { z } from 'zod';
import type { ActivityService } from '../../activity/activity.service';
import { createRequirementExtractorTool } from './tools/requirement-extractor.tool';
import { createConceptPlannerTool } from './tools/concept-planner.tool';
import { createPromptBuilderTool } from './tools/prompt-builder.tool';
import { createNanoBananaTool } from './tools/nano-banana.tool';
import type { ConceptDirection } from './concept-planner.agent';
import type { RequirementExtractorOutput } from './requirement-extractor';
import { MemorySaver } from '@langchain/langgraph';

const SUPERVISOR_SYSTEM_PROMPT = `You are the coordinator for poster generation workflow.

Available tools:
1. requirement_extractor - Extract poster design requirements from activity info and user input
2. concept_planner - Generate 1 best poster concept direction from requirements
3. prompt_builder - Generate detailed image generation prompt from requirements and concept direction
4. generate_image_nano_banana - Generate poster image using Google Gemini (nano-banana)

Workflow:
1. First call requirement_extractor with activityId and userRequirements
2. Then call concept_planner with the requirements JSON from step 1
3. Then call prompt_builder with requirements JSON (from step 1) and direction JSON (from step 2)
4. Finally call generate_image_nano_banana with the prompt (from step 3) and aspectRatio (infer from requirements poster.size, e.g., "16:9", "1:1")

Output Requirements:
- After generate_image_nano_banana returns, parse the JSON result
- If the result contains image_url, output: {"success": true, "imageUrl": "<url>", "mimeType": "<mimeType>", "filename": "<filename>"}
- If the result contains error, output: {"success": false, "error": "<error message>"}
- NEVER ask for clarification or additional information - proceed autonomously with reasonable defaults when information is missing or unclear

Important:
- You MUST extract requirements first before generating concepts
- You MUST generate the prompt before calling image generation
- aspectRatio should be inferred from requirements.poster.size (e.g., "16:9" from "16:9", "1:1" from "1:1", default to "16:9" if unclear)`;

const OrchestratorResponseSchema = z.object({
  success: z.boolean().describe('Whether the poster generation succeeded'),
  imageUrl: z
    .string()
    .nullable()
    .describe('Generated image URL (when success is true)'),
  mimeType: z
    .string()
    .nullable()
    .describe(
      'MIME type of generated image (when success is true, e.g., "image/png")',
    ),
  filename: z
    .string()
    .nullable()
    .describe(
      'Filename of generated image (when success is true, e.g., "nano-banana-xxx.png")',
    ),
  error: z
    .string()
    .nullable()
    .describe('Error message (when success is false)'),
});

/**
 * Create the poster generation orchestrator agent.
 * This supervisor agent delegates to sub-agents (requirement_extractor, concept_planner, prompt_builder).
 */
export function createOrchestratorAgent(
  activityService: ActivityService,
  model: string = 'openai:gpt-5.4',
) {
  const tools = [
    createRequirementExtractorTool(activityService),
    createConceptPlannerTool(),
    createPromptBuilderTool(),
    createNanoBananaTool(),
  ];

  const checkpointer = new MemorySaver();

  const agent = createAgent({
    model,
    tools,
    systemPrompt: SUPERVISOR_SYSTEM_PROMPT,
    checkpointer,
    responseFormat: OrchestratorResponseSchema,
  });

  return { agent };
}

/**
 * State maintained by the orchestrator across invocations.
 */
export interface OrchestratorState {
  sessionId: string;
  activityId: number;
  userRequirements: string;
  requirementsResult?: RequirementExtractorOutput;
  conceptDirection?: ConceptDirection;
  currentPhase: 'requirements' | 'concept' | 'confirmed';
}

export type OrchestratorResponse = z.infer<typeof OrchestratorResponseSchema>;
