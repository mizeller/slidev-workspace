import type { Meta, StoryObj } from "@storybook/vue3-vite";

import "../assets/main.css";
import SlideCard from "./SlideCard.vue";

const meta: Meta<typeof SlideCard> = {
  title: "Preview/SlideCard",
  component: SlideCard,
  args: {
    title: "Design Systems 101",
    description:
      "Learn how to build scalable UI foundations with practical tokens, components, and patterns.",
    url: "https://example.com",
    author: "Lea Chiu",
    date: "2026-02-01",
    image: "https://picsum.photos/200",
  },
  render: (args) => ({
    components: { SlideCard },
    setup: () => ({ args }),
    template: "<div class='max-w-sm'><SlideCard v-bind='args' /></div>",
  }),
};

export default meta;

type Story = StoryObj<typeof SlideCard>;

export const Default: Story = {};

export const WithoutImage: Story = {
  args: {
    image: undefined,
  },
};

export const LongText: Story = {
  args: {
    title:
      "Building for the Next Billion Users: Design, Performance, and Accessibility, Accessibility",
    description:
      "A deep dive into performance budgets, resilient layouts, content strategies, and internationalization across diverse devices.",
  },
};
