import { createAgent, createMiddleware } from 'langchain';
import { MemorySaver } from '@langchain/langgraph';
import { z } from 'zod';
import type { ClientTool } from '@langchain/core/tools';
import type { ActivityService } from '../../activity/activity.service';
import { createRequirementExtractorTool } from './tools/requirement-extractor.tool';
import { createConceptPlannerTool } from './tools/concept-planner.tool';
import { createPromptBuilderTool } from './tools/prompt-builder.tool';
import { createNanoBananaTool } from './tools/nano-banana.tool';
import { createRevisionPlannerTool } from './tools/revision-planner.tool';
import type { ConceptDirection } from './concept-planner.agent';
import {
  RequirementExtractorSchema,
  type RequirementExtractorOutput,
} from './requirement-extractor';

const OrchestratorStepSchema = z.enum([
  'requirements',
  'concept',
  'revision',
  'prompt',
  'image',
  'completed',
]);

const FinalImageSchema = z.object({
  imageUrl: z.string(),
  mimeType: z.string(),
  filename: z.string(),
});

const PosterOrchestrationStateSchema = z.object({
  currentStep: OrchestratorStepSchema.optional(),
  activityId: z.number().optional(),
  userRequirements: z.string().optional(),
  revisionRequirements: z.string().optional(),
  requirementsResult: RequirementExtractorSchema.optional(),
  conceptDirection: z
    .object({
      style: z.string(),
      color_palette: z.object({
        primary: z.string(),
        secondary: z.string(),
        accent: z.string(),
      }),
      visual_elements: z.array(z.string()),
      layout_hints: z.string(),
      title_concept: z.string(),
    })
    .optional(),
  revisionConceptDirection: z
    .object({
      style: z.string(),
      color_palette: z.object({
        primary: z.string(),
        secondary: z.string(),
        accent: z.string(),
      }),
      visual_elements: z.array(z.string()),
      layout_hints: z.string(),
      title_concept: z.string(),
    })
    .optional(),
  imagePrompt: z.string().optional(),
  previousImagePrompt: z.string().optional(),
  previousConceptDirection: z
    .object({
      style: z.string(),
      color_palette: z.object({
        primary: z.string(),
        secondary: z.string(),
        accent: z.string(),
      }),
      visual_elements: z.array(z.string()),
      layout_hints: z.string(),
      title_concept: z.string(),
    })
    .optional(),
  previousFinalImage: FinalImageSchema.optional(),
  finalImage: FinalImageSchema.optional(),
  finalError: z.string().optional(),
});

const REQUIREMENTS_SYSTEM_PROMPT = `You are the requirements handoff agent for poster generation.

Current stage: REQUIREMENTS

Current values:
- activityId: {activityId}
- userRequirements: {userRequirements}

Responsibilities:
1. Read the current state values activityId and userRequirements
2. Call requirement_extractor exactly once with activityId and userRequirements
3. Do not answer directly
4. Do not call any other tool

Workflow rule:
- This stage exists only to extract structured poster requirements and hand off to the concept stage.`;

const CONCEPT_SYSTEM_PROMPT = `You are the concept handoff agent for poster generation.

Current stage: CONCEPT

Available state:
- requirementsResult is already prepared
- requirementsJson: {requirementsJson}

Responsibilities:
1. Call concept_planner exactly once with requirementsJson
2. Do not ask questions
3. Do not answer directly
4. Do not call any other tool

Workflow rule:
- This stage exists only to generate one best concept direction and hand off to the prompt stage.`;

const REVISION_SYSTEM_PROMPT = `You are the revision handoff agent for poster generation.

Current stage: REVISION

Available state:
- requirementsResult is already prepared
- revisionRequirements: {revisionRequirements}
- requirementsJson: {requirementsJson}
- previousDirectionJson: {previousDirectionJson}
- previousImagePrompt: {previousImagePrompt}
- previousFinalImageUrl: {previousFinalImageUrl}

Responsibilities:
1. Call revision_planner exactly once with revisionRequirements
2. Do not ask questions
3. Do not answer directly
4. Do not call any other tool

Workflow rule:
- This stage exists only to generate a revised concept direction and hand off to the prompt stage.`;

const PROMPT_SYSTEM_PROMPT = `You are the prompt handoff agent for poster generation.

Current stage: PROMPT

Available state:
- requirementsResult is already prepared
- conceptDirection or revisionConceptDirection is already prepared
- requirementsJson: {requirementsJson}
- activeDirectionJson: {activeDirectionJson}
- revisionRequirements: {revisionRequirements}
- previousImagePrompt: {previousImagePrompt}

Responsibilities:
1. Call prompt_builder exactly once with requirementsJson and directionJson=activeDirectionJson
2. Do not ask questions
3. Do not answer directly
4. Do not call any other tool

Workflow rule:
- This stage exists only to generate the final image prompt and hand off to the image stage.`;

const IMAGE_SYSTEM_PROMPT = `You are the image handoff agent for poster generation.

Current stage: IMAGE

Available state:
- imagePrompt is already prepared
- requirementsResult is already prepared
- prompt: {imagePrompt}
- aspectRatio: {aspectRatio}

Responsibilities:
1. Call generate_image_nano_banana exactly once with prompt and aspectRatio
2. Do not ask questions
3. Do not answer directly
4. Do not call any other tool

Workflow rule:
- This stage exists only to generate the final poster image and hand off to the completed stage.`;

const COMPLETED_SYSTEM_PROMPT = `You are the final response agent for poster generation.

Current stage: COMPLETED

State summary:
- finalImage.imageUrl: {finalImageUrl}
- finalImage.mimeType: {finalImageMimeType}
- finalImage.filename: {finalImageFilename}
- finalError: {finalError}

Output rules:
- Produce a structured response only
- If finalImageUrl is present, return success=true with imageUrl, mimeType, filename, and error=null
- Otherwise return success=false with imageUrl=null, mimeType=null, filename=null, and the error message
- Do not call tools`;

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

export interface OrchestratorState {
  sessionId: string;
  activityId: number;
  userRequirements: string;
  currentStep:
    | 'requirements'
    | 'concept'
    | 'revision'
    | 'prompt'
    | 'image'
    | 'completed';
  revisionRequirements?: string;
  requirementsResult?: RequirementExtractorOutput;
  conceptDirection?: ConceptDirection;
  revisionConceptDirection?: ConceptDirection;
  imagePrompt?: string;
  previousImagePrompt?: string;
  previousConceptDirection?: ConceptDirection;
  previousFinalImage?: {
    imageUrl: string;
    mimeType: string;
    filename: string;
  };
  finalImage?: {
    imageUrl: string;
    mimeType: string;
    filename: string;
  };
  finalError?: string;
}

export type OrchestratorResponse = z.infer<typeof OrchestratorResponseSchema>;

type StepKey = z.infer<typeof OrchestratorStepSchema>;

type StepConfig = {
  prompt: string;
  tools: ClientTool[];
  requires: Array<
    | 'activityId'
    | 'userRequirements'
    | 'revisionRequirements'
    | 'requirementsResult'
    | 'conceptDirection'
    | 'revisionConceptDirection'
    | 'imagePrompt'
    | 'previousImagePrompt'
    | 'previousConceptDirection'
    | 'previousFinalImage'
    | 'finalImage'
    | 'finalError'
  >;
  toolChoice?: 'required';
};

function formatPrompt(
  template: string,
  state: Partial<OrchestratorState>,
): string {
  const requirementsJson = state.requirementsResult
    ? JSON.stringify(state.requirementsResult)
    : '';
  const directionJson = state.conceptDirection
    ? JSON.stringify(state.conceptDirection)
    : '';
  const activeDirectionJson = JSON.stringify(getActiveConceptDirection(state) ?? {});
  const previousDirectionJson = state.previousConceptDirection
    ? JSON.stringify(state.previousConceptDirection)
    : '';
  const aspectRatio = state.requirementsResult?.poster?.size ?? '';

  return template
    .replace('{activityId}', state.activityId != null ? String(state.activityId) : '')
    .replace('{userRequirements}', state.userRequirements ?? '')
    .replace('{revisionRequirements}', state.revisionRequirements ?? '')
    .replace('{requirementsJson}', requirementsJson)
    .replace('{directionJson}', directionJson)
    .replace('{activeDirectionJson}', activeDirectionJson)
    .replace('{previousDirectionJson}', previousDirectionJson)
    .replace('{imagePrompt}', state.imagePrompt ?? '')
    .replace('{previousImagePrompt}', state.previousImagePrompt ?? '')
    .replace('{aspectRatio}', aspectRatio)
    .replace('{previousFinalImageUrl}', state.previousFinalImage?.imageUrl ?? '')
    .replace('{finalImageUrl}', state.finalImage?.imageUrl ?? '')
    .replace('{finalImageMimeType}', state.finalImage?.mimeType ?? '')
    .replace('{finalImageFilename}', state.finalImage?.filename ?? '')
    .replace('{finalError}', state.finalError ?? '');
}

function getActiveConceptDirection(
  state: Partial<OrchestratorState>,
): ConceptDirection | undefined {
  return state.revisionConceptDirection ?? state.conceptDirection;
}

export function validateStepState(
  step: StepKey,
  state: Partial<OrchestratorState>,
): void {
  const requirements: Record<StepKey, StepConfig['requires']> = {
    requirements: ['activityId', 'userRequirements'],
    concept: ['requirementsResult'],
    revision: [
      'requirementsResult',
      'revisionRequirements',
      'previousConceptDirection',
      'previousImagePrompt',
      'previousFinalImage',
    ],
    prompt: ['requirementsResult'],
    image: ['requirementsResult', 'imagePrompt'],
    completed: [],
  };

  for (const key of requirements[step]) {
    if (state[key] == null) {
      throw new Error(`${key} must be set before reaching ${step}`);
    }
  }

  if (step === 'prompt' && !getActiveConceptDirection(state)) {
    throw new Error(
      'conceptDirection or revisionConceptDirection must be set before reaching prompt',
    );
  }
}

export function createOrchestratorAgent(
  activityService: ActivityService,
  model: string = 'openai:gpt-5.4',
) {
  const requirementExtractorTool = createRequirementExtractorTool(
    activityService,
  ) as ClientTool;
  const conceptPlannerTool = createConceptPlannerTool() as ClientTool;
  const revisionPlannerTool = createRevisionPlannerTool() as ClientTool;
  const promptBuilderTool = createPromptBuilderTool() as ClientTool;
  const imageGeneratorTool = createNanoBananaTool() as ClientTool;

  const stepConfig: Record<StepKey, StepConfig> = {
    requirements: {
      prompt: REQUIREMENTS_SYSTEM_PROMPT,
      tools: [requirementExtractorTool],
      requires: ['activityId', 'userRequirements'],
      toolChoice: 'required',
    },
    concept: {
      prompt: CONCEPT_SYSTEM_PROMPT,
      tools: [conceptPlannerTool],
      requires: ['requirementsResult'],
      toolChoice: 'required',
    },
    revision: {
      prompt: REVISION_SYSTEM_PROMPT,
      tools: [revisionPlannerTool],
      requires: [
        'requirementsResult',
        'revisionRequirements',
        'previousConceptDirection',
        'previousImagePrompt',
        'previousFinalImage',
      ],
      toolChoice: 'required',
    },
    prompt: {
      prompt: PROMPT_SYSTEM_PROMPT,
      tools: [promptBuilderTool],
      requires: ['requirementsResult'],
      toolChoice: 'required',
    },
    image: {
      prompt: IMAGE_SYSTEM_PROMPT,
      tools: [imageGeneratorTool],
      requires: ['requirementsResult', 'imagePrompt'],
      toolChoice: 'required',
    },
    completed: {
      prompt: COMPLETED_SYSTEM_PROMPT,
      tools: [],
      requires: [],
    },
  };

  const applyStepMiddleware = createMiddleware({
    name: 'poster_generation_handoffs',
    stateSchema: PosterOrchestrationStateSchema,
    wrapModelCall: async (request, handler) => {
      const currentStep = (request.state.currentStep ?? 'requirements') as StepKey;
      validateStepState(currentStep, request.state as Partial<OrchestratorState>);

      const config = stepConfig[currentStep];
      return handler({
        ...request,
        systemPrompt: formatPrompt(
          config.prompt,
          request.state as Partial<OrchestratorState>,
        ),
        tools: config.tools,
        toolChoice: config.toolChoice,
        responseFormat:
          currentStep === 'completed' ? request.responseFormat : undefined,
      });
    },
  });

  const agent = createAgent({
    model,
    tools: [
      requirementExtractorTool,
      conceptPlannerTool,
      revisionPlannerTool,
      promptBuilderTool,
      imageGeneratorTool,
    ],
    stateSchema: PosterOrchestrationStateSchema,
    middleware: [applyStepMiddleware],
    checkpointer: new MemorySaver(),
    responseFormat: OrchestratorResponseSchema,
  });

  return { agent };
}
