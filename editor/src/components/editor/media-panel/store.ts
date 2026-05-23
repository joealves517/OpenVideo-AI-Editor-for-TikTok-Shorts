import { Icons } from "@/components/shared/icons";
import {
  IconFolder,
  IconLetterT,
  IconCircleSquare,
  IconSubtitles,
  IconMusic,
  IconMicrophone,
  IconWaveSine,
  IconArrowsLeftRight,
  IconSparkles,
  type IconProps,
  IconPhoto,
  IconVideo,
  IconSchool,
} from "@tabler/icons-react";
import { create } from "zustand";

export type Tab =
  | "uploads"
  | "images"
  | "videos"
  | "music"
  | "text"
  | "captions"
  | "effects"
  | "voiceovers"
  | "sfx"
  | "transitions"
  | "academy";

export const tabs: {
  [key in Tab]: { icon: React.FC<IconProps> | React.FC<any>; label: string };
} = {
  uploads: {
    icon: IconFolder,
    label: "Uploads",
  },
  images: {
    icon: IconPhoto,
    label: "Images",
  },
  videos: {
    icon: IconVideo,
    label: "Videos",
  },
  text: {
    icon: IconLetterT,
    label: "Text",
  },

  captions: {
    icon: IconSubtitles,
    label: "Captions",
  },
  music: {
    icon: IconMusic,
    label: "Music",
  },
  voiceovers: {
    icon: IconMicrophone,
    label: "Voiceovers",
  },
  sfx: {
    icon: IconWaveSine,
    label: "SFX",
  },
  transitions: {
    icon: Icons.transition,
    label: "Transitions",
  },
  effects: {
    icon: IconSparkles,
    label: "Effects",
  },
  academy: {
    icon: IconSchool,
    label: "Academy",
  },
};

interface MediaPanelStore {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  highlightMediaId: string | null;
  requestRevealMedia: (mediaId: string) => void;
  clearHighlight: () => void;
  showProperties: boolean;
  setShowProperties: (show: boolean) => void;
}

export const useMediaPanelStore = create<MediaPanelStore>((set) => ({
  activeTab: "uploads",
  setActiveTab: (tab) => set({ activeTab: tab, showProperties: false }),
  highlightMediaId: null,
  requestRevealMedia: (mediaId) =>
    set({
      activeTab: "uploads",
      highlightMediaId: mediaId,
      showProperties: false,
    }),
  clearHighlight: () => set({ highlightMediaId: null }),
  showProperties: false,
  setShowProperties: (show) => set({ showProperties: show }),
}));
