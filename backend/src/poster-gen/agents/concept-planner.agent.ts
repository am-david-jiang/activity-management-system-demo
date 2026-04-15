import { createAgent } from 'langchain';
import { z } from 'zod';
export type { RequirementExtractorOutput } from './requirement-extractor';
import type { RequirementExtractorOutput } from './requirement-extractor';

const SYSTEM_PROMPT = `你是一个专业的活动海报创意策划专家。你的任务是基于提取的海报需求，生成2-4个不同风格方向的创意方案供用户选择。

【输入信息】
你会收到一个结构化的需求数据，包含活动信息和海报需求。

【输出格式】
请生成2-4个差异化的海报方向选项，每个方向包含：
- direction_id: 方向唯一标识（如 "A", "B", "C"）
- style: 具体风格描述（如：现代简约、复古国潮、科技未来感、清新文艺）
- color_palette: 配色方案
  - primary: 主色调（如：#E53935 中国红）
  - secondary: 辅助色（如：#FFD54F 金色）
  - accent: 点缀色（如：#FFFFFF 白色）
- visual_elements: 主要视觉元素列表（如：灯笼、祥云、梅花、龙纹等）
- layout_hints: 布局建议描述
- title_concept: 标题文案方向
- image_prompt: 详细的英文图像生成提示词（适合 Midjourney/Stable Diffusion）

【重要提示】
- 每个方向要有明显差异，避免相似方案
- 考虑活动类型（学术、文艺、体育、商业等）选择合适风格
- image_prompt 要详细具体，描述画面构图、色彩、氛围
- 颜色使用十六进制格式，如 #FF5733`;

export const ConceptDirectionSchema = z.object({
  direction_id: z.string().describe('方向唯一标识，如 A、B、C'),
  style: z.string().describe('具体风格描述'),
  color_palette: z.object({
    primary: z.string().describe('主色调'),
    secondary: z.string().describe('辅助色'),
    accent: z.string().describe('点缀色'),
  }),
  visual_elements: z.array(z.string()).describe('主要视觉元素列表'),
  layout_hints: z.string().describe('布局建议'),
  title_concept: z.string().describe('标题文案方向'),
  image_prompt: z.string().describe('英文图像生成提示词'),
});

export const ConceptPlannerSchema = z.object({
  directions: z.array(ConceptDirectionSchema).describe('海报方向选项列表'),
});

export type ConceptPlannerOutput = z.infer<typeof ConceptPlannerSchema>;
export type ConceptDirection = z.infer<typeof ConceptDirectionSchema>;

export function createConceptPlannerAgent(model: string = 'openai:gpt-5.2') {
  const agent = createAgent({
    model,
    tools: [],
    systemPrompt: SYSTEM_PROMPT,
    responseFormat: ConceptPlannerSchema,
  });

  return agent;
}

/**
 * Generate concept directions from requirement extractor output
 */
export async function generateConceptDirections(
  requirements: RequirementExtractorOutput,
  model?: string,
): Promise<ConceptDirection[]> {
  const agent = createConceptPlannerAgent(model);

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

  const result = await agent.invoke({
    messages: [{ role: 'user', content: input }],
  });

  return (result.structuredResponse as ConceptPlannerOutput).directions;
}
