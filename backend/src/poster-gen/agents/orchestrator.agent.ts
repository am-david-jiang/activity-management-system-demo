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
2. concept_planner - Generate 2-4 differentiated poster concept directions from requirements

Workflow:
1. First call requirement_extractor with activityId and userRequirements
2. Then call concept_planner with the requirements JSON from step 1
3. Present all concept directions to the user for selection
4. Wait for user to select or edit a direction

Important:
- You MUST extract requirements first before generating concepts
- concept_planner returns multiple directions - present them all to the user
- Do NOT select a direction yourself - wait for explicit user selection
- After user selection, confirm and inform them image generation is coming soon`;

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
  conceptDirections?: ConceptDirection[];
  selectedDirection?: ConceptDirection;
  currentPhase: 'requirements' | 'concepts' | 'selection' | 'confirmed';
}
