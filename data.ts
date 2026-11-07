import {
  BookOpenIcon,
  CalculatorIcon,
  CloudIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  DisplayIcon,
  DocumentTextIcon,
  FolderIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  MicrophoneIcon,
  PaintBrushIcon,
  PencilIcon,
  PresentationChartBarIcon,
  Squares2X2Icon,
  TableCellsIcon,
} from "./components/Icons";

// Canonical shared data (P10 shell increment).
//
// Empty until real providers land. Components must render empty states,
// not demo rows. Each export is filled by its provider integration.
export const achievements: any = [];
export const mockValidators: any = [];
export const aiConsciousnessLayers: any = [];
export const aiTradingPlatforms: any = [];
export const allUsers: any = [];
export const loggedInUser: any = null;
export const groups: any = [];
export const buildChecklistData: any = [];
export const knowledgeBaseData: any = [];
export const milestonesData: any = [];
export const realityResources: Record<string, any> = {};
export const chatSessions: any = [];
export const commerceData: any = [];
export const courses: any = [];
export const enrolledCourses: any = [];
export const creatorMarketplaceItems: any = [];
export const desktopItems: any = [
  { type: "app", id: "aetherius-notes", title: "Notes", component: "aetherius-notes", icon: BookOpenIcon },
  { type: "app", id: "aetherius-writer", title: "Writer", component: "aetherius-writer", icon: DocumentTextIcon },
  { type: "app", id: "aetherius-sheets", title: "Sheets", component: "aetherius-sheets", icon: TableCellsIcon },
  { type: "app", id: "aetherius-slides", title: "Slides", component: "aetherius-slides", icon: PresentationChartBarIcon },
  { type: "app", id: "aetherius-canvas", title: "Canvas", component: "aetherius-canvas", icon: PaintBrushIcon },
  { type: "app", id: "aetherius-recorder", title: "Recorder", component: "aetherius-recorder", icon: MicrophoneIcon },
  { type: "app", id: "aetherius-terminal", title: "Terminal", component: "aetherius-terminal", icon: CommandLineIcon },
  { type: "app", id: "aetherius-calculator", title: "Calculator", component: "aetherius-calculator", icon: CalculatorIcon },
  { type: "app", id: "aetherius-notepad", title: "Notepad", component: "aetherius-notepad", icon: PencilIcon },
  { type: "app", id: "aetherius-browser", title: "Browser", component: "aetherius-browser", icon: GlobeAltIcon },
  { type: "app", id: "aetherius-files", title: "Files", component: "aetherius-files", icon: FolderIcon },
];
export const mainMenuItems: any = [
  {
    title: "Aetherius Apps",
    children: [
      { title: "Notes", component: "aetherius-notes", icon: BookOpenIcon },
      { title: "Writer", component: "aetherius-writer", icon: DocumentTextIcon },
      { title: "Sheets", component: "aetherius-sheets", icon: TableCellsIcon },
      { title: "Slides", component: "aetherius-slides", icon: PresentationChartBarIcon },
      { title: "Canvas", component: "aetherius-canvas", icon: PaintBrushIcon },
      { title: "Recorder", component: "aetherius-recorder", icon: MicrophoneIcon },
      { title: "Terminal", component: "aetherius-terminal", icon: CommandLineIcon },
      { title: "Calculator", component: "aetherius-calculator", icon: CalculatorIcon },
      { title: "Notepad", component: "aetherius-notepad", icon: PencilIcon },
      { title: "Browser", component: "aetherius-browser", icon: GlobeAltIcon },
      { title: "Files", component: "aetherius-files", icon: FolderIcon },
    ],
  },
];
export const osMenuStructures: any = {
  desktopContext: [],
};
// Settings categories. Every component key resolves in the componentMap in
// components/settings/SettingsModal.tsx. Only pages that are functional and
// honest today are listed; pages with fake data or dead controls stay out
// until they are fixed (see docs/GAP-ANALYSIS-2026-11-07.md).
export const settingsConfig: any = [
  {
    id: "shell",
    icon: Cog6ToothIcon,
    title: "Shell",
    description: "Theme, endpoints and status polling for the shell.",
    items: [
      { id: "shell-settings", title: "Shell settings", component: "systemSettings", icon: Cog6ToothIcon },
      { id: "display", title: "Display", component: "display", icon: DisplayIcon },
      { id: "about", title: "About", component: "about", icon: InformationCircleIcon },
    ],
  },
  {
    id: "cloud-sync",
    icon: CloudIcon,
    title: "Cloud & Sync",
    description: "Endpoint, access token, health test and manual sync.",
    items: [
      { id: "cloud-sync", title: "Cloud & Sync", component: "cloud_sync", icon: CloudIcon },
    ],
  },
  {
    id: "applications",
    icon: Squares2X2Icon,
    title: "Applications",
    description: "Every directory under apps/ with its manifest status.",
    items: [
      { id: "applications", title: "Applications", component: "applications", icon: Squares2X2Icon },
    ],
  },
];
export const jobs: any = [];
export const mockCompanies: any = [];
export const mockFreelanceProjects: any = [];
export const mockApplications: any = [];
export const mockInterviews: any = [];
export const learnAndEarnCourses: any = [];
export const loanableAssets: any = [];
export const posts: any = [];
export const blogs: any = [];
export const following: any = [];
export const profileCompletion: any = {};
export const latestUpdates: any = [];
export const peopleYouMayKnowData: any = [];
export const sponsoredDataFB: any = [];
export const contactsDataFB: any = [];
export const messengerSessions: any = [];
export const messengerUsers: any = [];
export const socialCommunities: any = [];
export const socialStreams: any = [];
export const stakingPools: any = [];
export const topCopyTraders: any = [];
export const tradingAssets: any = [];
export const tradingBots: any = [];
export const tradingNews: any = [];
export const gapAnalysisData: any = [];

