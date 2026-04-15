import { createAgent } from 'langchain';
import type { ActivityService } from '../../activity/activity.service';
import { createRequirementExtractorTool } from './tools/requirement-extractor.tool';
import { createConceptPlannerTool } from './tools/concept-planner.tool';
import type { ConceptDirection } from './concept-planner.agent';
import type { RequirementExtractorOutput } from './requirement-extractor';
import { MemorySaver } from '@langchain/langgraph';

const SUPERVISOR_SYSTEM_PROMPT = `You are the coordinator for poster generation workflow.

Available tools:
1. requirement_extractor - Extract poster design requirements from activity info and user input
2. concept_planner - Generate 1 best poster concept direction from requirements

Workflow:
1. First call requirement_extractor with activityId and userRequirements
2. Then call concept_planner with the requirements JSON from step 1
3. Confirm the concept direction and inform user image generation is coming soon

Important:
- You MUST extract requirements first before generating concepts
- concept_planner returns a single best direction - confirm it directly
- Inform user that image generation is coming soon after confirming the concept`;

/**
 * Create the poster generation orchestrator agent.
 * This supervisor agent delegates to sub-agents (requirement_extractor, concept_planner).
 */
export function createOrchestratorAgent(
  activityService: ActivityService,
  model: string = 'openai:gpt-5.2',
) {
  const tools = [
    createRequirementExtractorTool(activityService),
    createConceptPlannerTool(),
  ];

  const checkpointer = new MemorySaver();

  const agent = createAgent({
    model,
    tools,
    systemPrompt: SUPERVISOR_SYSTEM_PROMPT,
    checkpointer,
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
