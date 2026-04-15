import { createAgent } from 'langchain';
import { z } from 'zod';
import type { ClientTool } from '@langchain/core/tools';
import type { ActivityService } from '../../activity/activity.service';
import { createGetActivityInfoTool } from './tools';

const SYSTEM_PROMPT = `你是一个专业的活动海报需求提取专家。你的任务是从用户消息中提取海报设计需求，并与活动数据库中的信息结合，输出结构化的海报需求数据。

【核心能力】
1. 使用 get_activity_info 工具获取活动的完整信息（名称、日期、事件等）
2. 从用户的自然语言描述中提取海报设计要素
3. 将活动信息与用户需求结合，输出结构化JSON

【海报需求提取字段】
请提取以下字段：
- style: 风格偏好（如：现代简约、复古、国潮、卡通、清新淡雅、科技感等）
- theme: 主题色调（如：春节红、海洋蓝、森林绿、紫色浪漫、金色奢华等）
- language: 展示语言（如：中文、英文、中英双语）
- color: 具体颜色要求（如：#FF5733、暖色调、冷色调等）
- size: 尺寸/格式要求（如：16:9、1:1、A4竖版等）
- visualConstraints: 视觉约束条件（如：不要文字、不要人像、只需要背景等）

【重要提示】
- 所有字段都是必填的，如果某个字段无法确定，请基于活动信息合理推断
- style 和 theme 是不同字段，style是风格，theme是色调
- visualConstraints 可以为空字符串，但不能缺失`;

export const RequirementExtractorSchema = z.object({
  activity: z.object({
    name: z.string().describe('活动名称'),
    startDate: z.string().describe('开始日期'),
    endDate: z.string().describe('结束日期'),
    events: z
      .array(
        z.object({
          name: z.string().describe('事件名称'),
          description: z.string().describe('事件描述'),
          datetime: z.string().describe('事件时间'),
          location: z.string().describe('事件地点'),
        }),
      )
      .describe('活动事件列表'),
  }),
  poster: z.object({
    style: z.string().describe('风格偏好'),
    theme: z.string().describe('主题色调'),
    language: z.string().describe('展示语言'),
    color: z.string().describe('具体颜色要求'),
    size: z.string().describe('尺寸/格式要求'),
    visualConstraints: z.array(z.string()).describe('视觉约束条件'),
  }),
});

export type RequirementExtractorOutput = z.infer<
  typeof RequirementExtractorSchema
>;

export function createRequirementExtractorAgent(
  activityService: ActivityService,
  model: string = 'openai:gpt-5.2',
) {
  const getActivityInfoTool = createGetActivityInfoTool(activityService);

  const tools: ClientTool[] = [getActivityInfoTool as ClientTool];

  const agent = createAgent({
    model,
    tools,
    systemPrompt: SYSTEM_PROMPT,
    responseFormat: RequirementExtractorSchema,
  });

  return agent;
}
