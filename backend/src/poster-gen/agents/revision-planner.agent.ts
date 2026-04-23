import { createAgent } from 'langchain';
import { z } from 'zod';
import type { RequirementExtractorOutput } from './requirement-extractor';
import {
  ConceptDirectionSchema,
  type ConceptDirection,
} from './concept-planner.agent';

const SYSTEM_PROMPT = `你是一个专业的活动海报修改策划专家。你的任务是结合用户的修改意见和上一轮海报设计结果，产出一版新的海报概念方向。

【输入信息】
你会收到：
1. 活动与海报基础需求
2. 上一轮海报概念方向
3. 上一轮图片生成提示词
4. 用户本轮修改意见

【工作要求】
- 不要脱离原活动主题
- 明确区分“保留的设计部分”和“需要调整的设计部分”
- 新方向必须能直接用于下一步图片提示词组装
- 优先响应用户本轮修改意见，同时保持海报可执行性

【输出格式】
请输出 1 个新的海报方向，字段与原始概念方向保持一致：
- style
- color_palette.primary
- color_palette.secondary
- color_palette.accent
- visual_elements
- layout_hints
- title_concept`;

const RevisionPlannerSchema = z.object({
  direction: ConceptDirectionSchema.describe('修改后的海报方向'),
});

type RevisionPlannerOutput = z.infer<typeof RevisionPlannerSchema>;

export function createRevisionPlannerAgent(model: string = 'openai:gpt-5.4') {
  return createAgent({
    model,
    tools: [],
    systemPrompt: SYSTEM_PROMPT,
    responseFormat: RevisionPlannerSchema,
  });
}

export type RevisionPlannerContext = {
  requirements: RequirementExtractorOutput;
  revisionRequirements: string;
  previousConceptDirection: ConceptDirection;
  previousImagePrompt?: string;
  previousFinalImage?: {
    imageUrl: string;
    mimeType: string;
    filename: string;
  };
};

export function buildRevisionPlannerInput(
  context: RevisionPlannerContext,
): string {
  const {
    requirements,
    revisionRequirements,
    previousConceptDirection,
    previousImagePrompt,
    previousFinalImage,
  } = context;

  return `请基于以下信息生成修改后的海报概念方向：

【活动信息】
活动名称：${requirements.activity.name}
活动时间：${requirements.activity.startDate} 至 ${requirements.activity.endDate}
活动事件：
${requirements.activity.events.map((e) => `- ${e.name}: ${e.description} (${e.datetime}, ${e.location})`).join('\n')}

【原始海报需求】
风格偏好：${requirements.poster.style}
主题色调：${requirements.poster.theme}
语言：${requirements.poster.language}
颜色要求：${requirements.poster.color}
尺寸：${requirements.poster.size}
视觉约束：${requirements.poster.visualConstraints.join('、')}

【上一轮海报概念】
风格：${previousConceptDirection.style}
主色：${previousConceptDirection.color_palette.primary}
辅色：${previousConceptDirection.color_palette.secondary}
点缀色：${previousConceptDirection.color_palette.accent}
视觉元素：${previousConceptDirection.visual_elements.join('、')}
布局建议：${previousConceptDirection.layout_hints}
标题方向：${previousConceptDirection.title_concept}

【上一轮图片提示词】
${previousImagePrompt ?? '无'}

【上一轮生成结果】
文件名：${previousFinalImage?.filename ?? '未知'}
MIME 类型：${previousFinalImage?.mimeType ?? '未知'}
文件路径：${previousFinalImage?.imageUrl ?? '未知'}

【用户修改意见】
${revisionRequirements}`;
}

export async function generateRevisionConceptDirection(
  context: RevisionPlannerContext,
  model?: string,
): Promise<ConceptDirection> {
  const agent = createRevisionPlannerAgent(model);
  const input = buildRevisionPlannerInput(context);
  const result = await agent.invoke({
    messages: [{ role: 'user', content: input }],
  });

  return (result.structuredResponse as RevisionPlannerOutput).direction;
}
