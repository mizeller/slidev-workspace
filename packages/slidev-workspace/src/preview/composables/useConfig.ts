import { computed, ref } from "vue";
import type { HeroConfig, SidebarConfig } from "../../types/config.js";

const DEFAULT_CONFIG = {
  hero: {
    title: "Slide Deck",
    description:
      "Browse all available slide decks and use the search function to quickly find what you need.",
  },
  sidebar: {
    title: "Slide Deck",
    githubUrl: "",
  },
};

export function useConfig() {
  const heroData = ref<HeroConfig>(DEFAULT_CONFIG.hero);
  const sidebarData = ref<SidebarConfig>(DEFAULT_CONFIG.sidebar);

  const loadConfigData = async () => {
    try {
      const module = await import("slidev:config");
      heroData.value = module.default?.hero || heroData.value;
      sidebarData.value = module.default?.sidebar || sidebarData.value;
    } catch (error) {
      console.warn("Failed to load config data:", error);
    }
  };

  loadConfigData();

  const hero = computed(() => heroData.value);
  const sidebar = computed(() => sidebarData.value);

  return {
    hero,
    sidebar,
  };
}
