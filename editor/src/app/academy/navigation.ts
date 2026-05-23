export interface DocItem {
  id: string;
  title: string;
  path: string; // Relative path inside public/academy-data/
  type: "file" | "category";
  children?: DocItem[];
}

export const ACADEMY_NAVIGATION: DocItem[] = [
  {
    id: "intro",
    title: "Welcome & Course Intro",
    path: "intro.md",
    type: "file",
  },
  {
    id: "course-mastery",
    title: "Faceless Video Mastery (11 Modules)",
    path: "course/README.md",
    type: "category",
    children: [
      {
        id: "m0",
        title: "Module 0: Welcome & Introduction",
        path: "course/module-0/README.md",
        type: "file",
      },
      {
        id: "m1",
        title: "Module 1: Foundations of Faceless Video",
        path: "course/module-1/README.md",
        type: "file",
      },
      {
        id: "m2",
        title: "Module 2: Mastering Automation Features",
        path: "course/module-2/README.md",
        type: "file",
      },
      {
        id: "m3",
        title: "Module 3: Content Creation Strategies",
        path: "course/module-3/README.md",
        type: "file",
      },
      {
        id: "m4",
        title: "Module 4: Getting Monetized Fast",
        path: "course/module-4/README.md",
        type: "file",
      },
      {
        id: "m5",
        title: "Module 5: Advanced Revenue Streams",
        path: "course/module-5/README.md",
        type: "file",
      },
      {
        id: "m6",
        title: "Module 6: Growth & Optimization",
        path: "course/module-6/README.md",
        type: "file",
      },
      {
        id: "m7",
        title: "Module 7: Scaling Your Business",
        path: "course/module-7/README.md",
        type: "file",
      },
      {
        id: "m8",
        title: "Module 8: Platform Domination",
        path: "course/module-8/README.md",
        type: "file",
      },
      {
        id: "m9",
        title: "Module 9: Troubleshooting & Mẹo nâng cao",
        path: "course/module-9/README.md",
        type: "file",
      },
      {
        id: "m10",
        title: "Module 10: Building Your Empire",
        path: "course/module-10/README.md",
        type: "file",
      },
    ],
  },
  {
    id: "getting-started-guides",
    title: "Getting Started Guides",
    path: "",
    type: "category",
    children: [
      {
        id: "gs-intro",
        title: "Introduction to Faceless Video",
        path: "guides/getting-started/introduction.md",
        type: "file",
      },
      {
        id: "gs-setup",
        title: "Account Setup & Configuration",
        path: "guides/getting-started/account-setup.md",
        type: "file",
      },
      {
        id: "gs-dashboard",
        title: "Dashboard Overview",
        path: "guides/getting-started/dashboard-overview.md",
        type: "file",
      },
      {
        id: "gs-first-video",
        title: "Creating Your First Video",
        path: "guides/getting-started/your-first-video.md",
        type: "file",
      },
      {
        id: "gs-connect",
        title: "Connecting Social Accounts",
        path: "guides/getting-started/connecting-accounts.md",
        type: "file",
      },
    ],
  },
  {
    id: "core-feature-guides",
    title: "Core Feature Guides",
    path: "",
    type: "category",
    children: [
      {
        id: "feat-gen",
        title: "Faceless Video Generator",
        path: "guides/features/faceless-video-generator.md",
        type: "file",
      },
      {
        id: "feat-edit",
        title: "Video Editing Mastery",
        path: "guides/features/video-editing.md",
        type: "file",
      },
      {
        id: "feat-char",
        title: "Character Consistency",
        path: "guides/features/character-consistency.md",
        type: "file",
      },
      {
        id: "feat-sched",
        title: "Bulk Scheduler & Calendar",
        path: "guides/features/bulk-scheduler.md",
        type: "file",
      },
      {
        id: "feat-idea",
        title: "Idea Discovery & Research",
        path: "guides/features/idea-discovery.md",
        type: "file",
      },
      {
        id: "feat-thumb",
        title: "Thumbnail Generator",
        path: "guides/features/thumbnail-generator.md",
        type: "file",
      },
      {
        id: "feat-clone",
        title: "Real Clone Feature",
        path: "guides/features/real-clone.md",
        type: "file",
      },
      {
        id: "feat-url",
        title: "URL to Video Converter",
        path: "guides/features/url-to-video.md",
        type: "file",
      },
      {
        id: "feat-audio",
        title: "Audio to Video Converter",
        path: "guides/features/audio-to-video.md",
        type: "file",
      },
      {
        id: "feat-scene",
        title: "Text to Scene (Ultra-Realistic)",
        path: "guides/features/text-to-scene.md",
        type: "file",
      },
    ],
  },
  {
    id: "monetization-guides",
    title: "Monetization Secrets",
    path: "",
    type: "category",
    children: [
      {
        id: "mon-guide",
        title: "Complete Monetization Guide",
        path: "guides/monetization/complete-guide.md",
        type: "file",
      },
      {
        id: "mon-yt",
        title: "YouTube Monetization Secrets",
        path: "guides/monetization/youtube-monetization.md",
        type: "file",
      },
      {
        id: "mon-reqs",
        title: "Platform Requirements",
        path: "guides/monetization/platform-requirements.md",
        type: "file",
      },
      {
        id: "mon-streams",
        title: "Revenue Streams Explained",
        path: "guides/monetization/revenue-streams.md",
        type: "file",
      },
      {
        id: "mon-fast",
        title: "Getting Monetized Fast (2-3 Weeks)",
        path: "guides/monetization/getting-monetized-fast.md",
        type: "file",
      },
      {
        id: "mon-aff",
        title: "Affiliate Marketing Strategy",
        path: "guides/monetization/affiliate-marketing.md",
        type: "file",
      },
    ],
  },
  {
    id: "bonuses-resources",
    title: "Special Resources & Bonuses",
    path: "",
    type: "category",
    children: [
      {
        id: "bonus-ideas",
        title: "🔥 Bonus: 2,700 Video Ideas",
        path: "video-ideas.md",
        type: "file",
      },
      {
        id: "bonus-tools",
        title: "🛠️ Best Automating Tools",
        path: "best-automating-tools.md",
        type: "file",
      },
    ],
  },
];
