import type { HeroConfig, SidebarConfig } from "../../../types/config";

interface ConfigData {
  hero: HeroConfig;
  sidebar: SidebarConfig;
}

const mockConfigData: ConfigData = {
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

export default mockConfigData;
