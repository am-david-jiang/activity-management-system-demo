import { tool } from '@langchain/core/tools';
import z from 'zod';
import { Logger } from '@nestjs/common';
import type { ActivityService } from '../../../activity/activity.service';

const logger = new Logger('GetActivityInfoTool');

/**
 * Creates a LangChain tool that retrieves activity information by ID.
 * Uses ActivityService.findOne() to fetch activity with related events.
 */
export function createGetActivityInfoTool(activityService: ActivityService) {
  return tool(
    async ({ activityId }: { activityId: number }) => {
      try {
        logger.log(
          `Invoking get_activity_info tool with activityId: ${activityId}`,
        );
        const activity = await activityService.findOne(activityId, ['events']);

        logger.log(
          `get_activity_info tool returned activity: ${activity.activityName}`,
        );
        return JSON.stringify({
          id: activity.id,
          name: activity.activityName,
          startDate: activity.startDate.toString(),
          endDate: activity.endDate.toString(),
          budget: activity.budget,
          applyEndDate: activity.applyEndDate.toString(),
          status: activity.status,
          events: (activity.events ?? []).map((event) => ({
            name: event.title,
            description: event.description ?? '',
            datetime: event.startDate.toString(),
            location: event.address,
          })),
        });
      } catch (error) {
        logger.error(
          `get_activity_info tool failed: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
        return JSON.stringify({
          error: `get_activity_info failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    },
    {
      name: 'get_activity_info',
      description: `根据活动ID获取活动详情，包括活动名称、日期、预算、报名截止日期、状态以及关联的活动事件列表。

每次生成海报前必须使用此工具获取最新的活动信息。

参数:
- activityId: 活动的数字ID (必填)`,
      schema: z.object({
        activityId: z.number().describe('活动的数字ID'),
      }),
    },
  );
}
