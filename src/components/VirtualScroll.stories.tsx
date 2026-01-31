import type { Meta, StoryObj } from "@storybook/react";
import { VirtualScroll } from "./VirtualScroll";

const meta: Meta<typeof VirtualScroll> = {
  title: "Components/VirtualScroll",
  component: VirtualScroll,
  tags: ["autodocs"],
  args: {
    height: 320,
    itemHeight: 48,
    overscan: 3,
    items: Array.from({ length: 200 }, (_, index) => (
      <div
        key={index}
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: "1px solid #e3e6ea",
          background: index % 2 === 0 ? "#ffffff" : "#f7f9fc",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
        }}
      >
        Item #{index + 1}
      </div>
    ))
  }
};

export default meta;

type Story = StoryObj<typeof VirtualScroll>;

export const Basic: Story = {};
