import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
  ],
  framework: "@storybook/vue3-vite",
  async viteFinal(baseConfig) {
    // Prevent slides plugin execute a watch task when running storybook
    const plugins = (baseConfig.plugins ?? []).filter(
      (plugin) =>
        plugin && (plugin as { name?: string }).name !== "vite-plugin-slides",
    );

    return {
      ...baseConfig,
      plugins,
    };
  },
};
export default config;
