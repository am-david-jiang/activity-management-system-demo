import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TimePicker } from "@/components/ui/time-picker";
import { useArgs } from "storybook/internal/preview-api";

const meta: Meta<typeof TimePicker> = {
  title: "TimePicker",
  component: TimePicker,
};

export default meta;
type Story = StoryObj<typeof TimePicker>;

export const Default: Story = {
  args: {
    value: undefined,
    placeholder: "选择时间",
  },
  render: function Renderer(args) {
    const [{ value }, updateArgs] = useArgs();

    function onChange(date: Date | undefined) {
      updateArgs({ value: date });
    }

    return <TimePicker {...args} value={value} onChange={onChange} />;
  },
};

export const WithValue: Story = {
  args: {
    value: new Date("2026-04-17T14:30:00"),
    placeholder: "选择时间",
  },
  render: function Renderer(args) {
    const [{ value }, updateArgs] = useArgs();

    function onChange(date: Date | undefined) {
      updateArgs({ value: date });
    }

    return <TimePicker {...args} value={value} onChange={onChange} />;
  },
};