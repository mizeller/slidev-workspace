<template>
  <div class="min-h-screen transition-colors">
    <div
      class="min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_280px_minmax(0,3fr)_minmax(0,1fr)]"
    >
      <div class="hidden bg-[#F1F1F1] dark:bg-[#191919] lg:block" />
      <aside
        class="w-full border-r border-[#E8E8E8] bg-[#F1F1F1] text-sidebar-foreground dark:border-[#212121] dark:bg-[#191919]"
      >
        <div
          class="sticky top-0 flex h-screen flex-col px-6 py-10 text-sidebar-foreground"
        >
          <div class="px-1 pb-4">
            <h2 class="text-lg font-semibold tracking-tight">
              {{ sidebar.title }}
            </h2>
          </div>

          <div class="px-1 pb-6">
            <div class="relative w-full">
              <Input
                class="pl-10 h-10 rounded-xl bg-background/70"
                placeholder="Search slides..."
                v-model="searchTerm"
              />
              <span
                class="absolute start-0 inset-y-0 flex items-center justify-center px-3"
              >
                <Search class="size-5 text-muted-foreground/50" />
              </span>
            </div>
          </div>

          <div class="px-1 pb-2">
            <h3
              class="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Categories
            </h3>
          </div>

          <div class="px-0.5 space-y-1 max-h-[60vh] overflow-auto">
            <button
              v-for="category in categoryOptions"
              :key="category.name"
              type="button"
              @click="selectedCategory = category.name"
              class="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors"
              :class="
                selectedCategory === category.name
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'hover:bg-sidebar-accent/70 text-sidebar-foreground'
              "
            >
              <span class="truncate">{{ category.name }}</span>
              <span class="text-xs text-muted-foreground">{{
                category.count
              }}</span>
            </button>
          </div>

          <div class="mt-auto flex items-center justify-between gap-3 pt-6">
            <a
              v-if="sidebar.githubUrl"
              :href="sidebar.githubUrl"
              target="_blank"
              rel="noreferrer"
              class="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
              aria-label="Open GitHub repository"
            >
              <Github class="size-5" />
            </a>
            <div v-else />
            <button
              @click="toggleDarkMode"
              class="p-2 rounded-lg hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
              aria-label="Toggle dark mode"
              type="button"
            >
              <Moon v-if="!isDark" class="size-5" />
              <Sun v-else class="size-5" />
            </button>
          </div>
        </div>
      </aside>

      <section class="bg-[#F5F5F5] dark:bg-[#121212]">
        <div class="px-6 py-10 lg:px-12">
          <div
            class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
          >
            <div>
              <h1 class="text-3xl font-semibold">{{ hero.title }}</h1>
              <p class="mt-2 text-sm text-muted-foreground">
                {{ hero.description }}
              </p>
            </div>
            <div class="self-start" />
          </div>

          <div
            class="mt-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
          >
            <p class="text-sm text-muted-foreground">
              Found {{ filteredSlides.length }} of {{ slidesCount }} slides
              <template v-if="searchTerm">
                <span>
                  containing "
                  <span class="font-medium">{{ searchTerm }}</span>
                  "
                </span>
              </template>
            </p>
            <div />
          </div>
        </div>

        <div
          class="grid grid-cols-1 gap-6 px-6 pb-12 sm:grid-cols-2 xl:grid-cols-3 lg:px-12"
        >
          <SlideCard
            v-for="slide in filteredSlides"
            :key="slide.url"
            :title="slide.title"
            :image="slide.image"
            :description="slide.description"
            :url="slide.url"
            :author="slide.author"
            :date="slide.date"
          />
        </div>
      </section>
      <div class="hidden bg-[#F5F5F5] dark:bg-[#121212] lg:block" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Search, Moon, Sun, Github } from "lucide-vue-next";

import { useSlides } from "../composables/useSlides";
import { useConfig } from "../composables/useConfig";
import { useDarkMode } from "../composables/useDarkMode";
import { Input } from "../components/ui/input";
import SlideCard from "./SlideCard.vue";

const searchTerm = ref("");
const { slides, slidesCount } = useSlides();
const { hero, sidebar } = useConfig();
const { isDark, toggleDarkMode } = useDarkMode();

const uncategorizedLabel = "Uncategorized";
const selectedCategory = ref("All");

const categoryOptions = computed(() => {
  const counts = new Map<string, number>();
  slides.value.forEach((slide) => {
    const category = slide.category || uncategorizedLabel;
    counts.set(category, (counts.get(category) || 0) + 1);
  });

  const categories = Array.from(counts.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  if (categories.length <= 1) {
    return [
      {
        name: "All",
        count: slidesCount.value,
      },
    ];
  }

  return [
    {
      name: "All",
      count: slidesCount.value,
    },
    ...categories,
  ];
});

watch(categoryOptions, (next) => {
  const hasSelected = next.some(
    (category) => category.name === selectedCategory.value,
  );
  if (!hasSelected) {
    selectedCategory.value = "All";
  }
});

const filteredSlides = computed(() => {
  let result = slides.value;

  if (selectedCategory.value !== "All") {
    result = result.filter(
      (slide) =>
        (slide.category || uncategorizedLabel) === selectedCategory.value,
    );
  }

  if (!searchTerm.value) return result;
  return result.filter(
    (slide) =>
      slide.title.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      slide.description
        .toLowerCase()
        .includes(searchTerm.value.toLowerCase()) ||
      slide.author.toLowerCase().includes(searchTerm.value.toLowerCase()),
  );
});
</script>
