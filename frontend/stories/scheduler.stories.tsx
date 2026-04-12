import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Scheduler } from "@/components/scheduler";
import { Event } from "@/components/scheduler";
import { useArgs } from "storybook/internal/preview-api";

const mockEvents: Event[] = [
  {
    id: 1,
    title: "团队晨会",
    description: "每日站会讨论项目进度",
    startDate: new Date("2026-04-12T09:00:00"),
    endDate: new Date("2026-04-12T09:30:00"),
    address: "会议室A",
  },
  {
    id: 2,
    title: "产品评审",
    description: "Q2产品功能评审",
    startDate: new Date("2026-04-12T10:00:00"),
    endDate: new Date("2026-04-12T11:30:00"),
    address: "会议室B",
  },
  {
    id: 3,
    title: "代码审查",
    description: "Review PR #234",
    startDate: new Date("2026-04-12T10:15:00"),
    endDate: new Date("2026-04-12T11:00:00"),
    address: "在线会议",
  },
  {
    id: 4,
    title: "午餐休息",
    startDate: new Date("2026-04-12T12:00:00"),
    endDate: new Date("2026-04-12T13:00:00"),
    address: "食堂",
  },
  {
    id: 5,
    title: "客户演示",
    description: "向客户演示新功能",
    startDate: new Date("2026-04-12T14:00:00"),
    endDate: new Date("2026-04-12T15:30:00"),
    address: "客户办公室",
  },
  {
    id: 6,
    title: "长时会议",
    description: "战略规划讨论",
    startDate: new Date("2026-04-12T13:30:00"),
    endDate: new Date("2026-04-12T16:30:00"),
    address: "会议室A",
  },
];

const meta: Meta<typeof Scheduler> = {
  title: "Scheduler",
  component: Scheduler,
};

export default meta;
type Story = StoryObj<typeof Scheduler>;

export const DailyView: Story = {
  args: {
    events: mockEvents,
    onEventsChange: () => {},
    defaultVisibleDate: new Date("2026-04-12"),
  },
  render: function Renderer(args) {
    const [{ events }, updateArgs] = useArgs();

    function onEventsChange(events: Event[]) {
      updateArgs({ events });
    }

    return (
      <Scheduler {...args} events={events} onEventsChange={onEventsChange} />
    );
  },
};
