import {
  AppWindowIcon,
  BookOpenIcon,
  CalculatorIcon,
  ChatBubbleLeftRightIcon,
  CloudIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  ComputerDesktopIcon,
  CursorArrowRaysIcon,
  DisplayIcon,
  DocumentTextIcon,
  FaceSmileIcon,
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
  { type: "app", id: "aetherius-genesis-human", title: "Genesis Human", component: "aetherius-genesis-human", icon: ChatBubbleLeftRightIcon },
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
  { type: "app", id: "aetherius-task-manager", title: "Task Manager", component: "aetherius-task-manager", icon: CommandLineIcon },
  { type: "app", id: "aetherius-system-monitor", title: "System Monitor", component: "aetherius-system-monitor", icon: Cog6ToothIcon },
  { type: "app", id: "aetherius-system-info", title: "System Info", component: "aetherius-system-info", icon: InformationCircleIcon },
  { type: "app", id: "aetherius-services", title: "Services", component: "aetherius-services", icon: Squares2X2Icon },
  { type: "app", id: "aetherius-cloud-ops", title: "Cloud Ops", component: "aetherius-cloud-ops", icon: CloudIcon },
  { type: "app", id: "aetherius-ai-platform", title: "AI Productivity", component: "aetherius-ai-platform", icon: ChatBubbleLeftRightIcon },
  { type: "app", id: "aetherius-ai-suite", title: "AI Studio", component: "aetherius-ai-suite", icon: ChatBubbleLeftRightIcon },
  { type: "app", id: "aetherius-finance", title: "Finance", component: "aetherius-finance", icon: Squares2X2Icon },
  { type: "app", id: "aetherius-health", title: "Health", component: "aetherius-health", icon: Squares2X2Icon },
  { type: "app", id: "aetherius-media", title: "Media", component: "aetherius-media", icon: MicrophoneIcon },
  { type: "app", id: "aetherius-social", title: "Social", component: "aetherius-social", icon: Squares2X2Icon },
  { type: "app", id: "aetherius-productivity", title: "Productivity", component: "aetherius-productivity", icon: DocumentTextIcon },
  { type: "app", id: "aetherius-app-market", title: "App Market", component: "aetherius-app-market", icon: Squares2X2Icon },
  { type: "app", id: "aetherius-development", title: "Development", component: "aetherius-development", icon: CommandLineIcon },
  { type: "app", id: "aetherius-account", title: "Accounts", component: "aetherius-account", icon: Squares2X2Icon },
  { type: "app", id: "aetherius-omni-dashboard", title: "Omni Dashboard", component: "aetherius-omni-dashboard", icon: Squares2X2Icon },
  { type: "app", id: "aetherius-gaming", title: "Gaming", component: "aetherius-gaming", icon: Squares2X2Icon },
];
export const mainMenuItems: any = [
  {
    title: "Aetherius Apps",
    children: [
      { title: "Genesis Human", component: "aetherius-genesis-human", icon: ChatBubbleLeftRightIcon },
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
      { title: "Task Manager", component: "aetherius-task-manager", icon: CommandLineIcon },
      { title: "System Monitor", component: "aetherius-system-monitor", icon: Cog6ToothIcon },
      { title: "System Info", component: "aetherius-system-info", icon: InformationCircleIcon },
      { title: "Services", component: "aetherius-services", icon: Squares2X2Icon },
      { title: "Cloud Ops", component: "aetherius-cloud-ops", icon: CloudIcon },
      { title: "AI Productivity", component: "aetherius-ai-platform", icon: ChatBubbleLeftRightIcon },
      { title: "AI Studio", component: "aetherius-ai-suite", icon: ChatBubbleLeftRightIcon },
      { title: "Finance", component: "aetherius-finance", icon: Squares2X2Icon },
      { title: "Health", component: "aetherius-health", icon: Squares2X2Icon },
      { title: "Media", component: "aetherius-media", icon: MicrophoneIcon },
      { title: "Social", component: "aetherius-social", icon: Squares2X2Icon },
      { title: "Productivity", component: "aetherius-productivity", icon: DocumentTextIcon },
      { title: "App Market", component: "aetherius-app-market", icon: Squares2X2Icon },
      { title: "Development", component: "aetherius-development", icon: CommandLineIcon },
      { title: "Accounts", component: "aetherius-account", icon: Squares2X2Icon },
      { title: "Omni Dashboard", component: "aetherius-omni-dashboard", icon: Squares2X2Icon },
      { title: "Gaming", component: "aetherius-gaming", icon: Squares2X2Icon },
      { title: "Careers", component: "aetherius-careers", icon: Squares2X2Icon },
      { title: "Content Studio", component: "aetherius-content-gen", icon: DocumentTextIcon },
      { title: "Commerce", component: "aetherius-commerce", icon: Squares2X2Icon },
      { title: "E-Learning", component: "aetherius-elearning", icon: BookOpenIcon },
      { title: "Engineering", component: "aetherius-engineering", icon: CommandLineIcon },
      { title: "Enterprise", component: "aetherius-enterprise", icon: Squares2X2Icon },
      { title: "Guest OS", component: "aetherius-guest-os", icon: ComputerDesktopIcon },
      { title: "Hypervisor", component: "aetherius-hypervisor", icon: ComputerDesktopIcon },
      { title: "Omni Platform", component: "aetherius-omni-platform", icon: Squares2X2Icon },
      { title: "Visual Builder", component: "aetherius-omni-builder", icon: PaintBrushIcon },
      { title: "Operations Center", component: "aetherius-operations", icon: Squares2X2Icon },
      { title: "Quantum Lab", component: "aetherius-quantum-lab", icon: Squares2X2Icon },
      { title: "R&D Hub", component: "aetherius-rd-hub", icon: Squares2X2Icon },
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
    id: "desktop",
    icon: ComputerDesktopIcon,
    title: "Desktop & Widgets",
    description: "Icon size, grid, sorting, grouping, and per-widget visibility and size.",
    items: [
      { id: "desktop", title: "Desktop organisation", component: "desktop_org", icon: ComputerDesktopIcon },
      { id: "wallpaper", title: "Wallpaper", component: "wallpaper", icon: DisplayIcon },
    ],
  },
  {
    id: "windows-input",
    icon: CursorArrowRaysIcon,
    title: "Windows & Input",
    description: "Window size, snapping, and mouse, keyboard and touch behaviour.",
    items: [
      { id: "windows", title: "Window management", component: "window_mgmt", icon: AppWindowIcon },
      { id: "input", title: "Mouse, keyboard & touch", component: "input_dev", icon: CursorArrowRaysIcon },
    ],
  },
  {
    id: "genesis",
    icon: FaceSmileIcon,
    title: "Genesis Human",
    description: "Voice, local-model preference, and the research panel.",
    items: [
      { id: "genesis", title: "Genesis Human", component: "genesis_human", icon: FaceSmileIcon },
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

